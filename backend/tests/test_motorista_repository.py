import os
import unittest

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://test:test@localhost:5432/test",
)

from src.modulos.motoristas.application.use_cases.gerenciar_motoristas_use_case import (
    GerenciarMotoristasUseCase,
    MotoristaComAlocacoesPendentesError,
    MotoristaValidationError,
)
from src.modulos.motoristas.infrastructure.repositories.motorista_repository import (
    MotoristaRepository,
    MotoristaTelefoneEmUsoError,
)
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.infrastructure.db import Base
from src.shared.security.lgpd_encryption import hash_telefone


class FakeQuery:
    def __init__(self, session):
        self.items = list(session.motoristas)

    def filter(self, *criterios):
        for criterio in criterios:
            coluna = getattr(getattr(criterio, "left", None), "key", None)
            lado_direito = getattr(criterio, "right", None)
            valor = getattr(lado_direito, "value", None)
            if valor is None:
                valor_sql = str(lado_direito).strip().lower()
                if valor_sql == "true":
                    valor = True
                elif valor_sql == "false":
                    valor = False
            if coluna is None:
                continue
            operador = getattr(getattr(criterio, "operator", None), "__name__", "eq")
            self.items = [
                motorista
                for motorista in self.items
                if (
                    getattr(motorista, coluna) != valor
                    if operador == "ne"
                    else getattr(motorista, coluna) == valor
                )
            ]
        return self

    def order_by(self, *args):
        self.items.sort(key=lambda motorista: motorista.id)
        return self

    def all(self):
        return list(self.items)

    def first(self):
        return self.items[0] if self.items else None


class FakeSession:
    def __init__(self, motoristas=None, *, fail_commit=False):
        self.motoristas = list(motoristas or [])
        self.fail_commit = fail_commit
        self.added = []
        self.commit_count = 0
        self.rollback_count = 0
        self._original_motoristas = list(self.motoristas)
        self._original_states = {
            id(motorista): {
                "nome_completo": motorista.nome_completo,
                "telefone": motorista.telefone,
                "telefone_hash": motorista.telefone_hash,
                "ativo": motorista.ativo,
            }
            for motorista in self.motoristas
        }

    def query(self, model):
        return FakeQuery(self)

    def add(self, entity):
        self.added.append(entity)
        if isinstance(entity, MotoristaORM):
            if entity.id is None:
                next_id = max(
                    (motorista.id or 0 for motorista in self.motoristas),
                    default=0,
                ) + 1
                entity.id = next_id
            if entity not in self.motoristas:
                self.motoristas.append(entity)

    def commit(self):
        self.commit_count += 1
        if self.fail_commit:
            raise RuntimeError("falha de persistência")

    def refresh(self, instance):
        return None

    def rollback(self):
        self.rollback_count += 1
        self.motoristas[:] = self._original_motoristas
        for motorista in self.motoristas:
            estado = self._original_states[id(motorista)]
            motorista.nome_completo = estado["nome_completo"]
            motorista.telefone = estado["telefone"]
            motorista.telefone_hash = estado["telefone_hash"]
            motorista.ativo = estado["ativo"]


def motorista(
    motorista_id: int,
    nome: str,
    telefone: str,
    ativo: bool,
) -> MotoristaORM:
    return MotoristaORM(
        id=motorista_id,
        nome_completo=nome,
        telefone=telefone,
        telefone_hash=hash_telefone(telefone),
        ativo=ativo,
    )


class MotoristaRepositoryTest(unittest.TestCase):
    def setUp(self):
        self.ativo = motorista(1, "Maria da Silva", "85999990000", True)
        self.inativo = motorista(2, "João de Souza", "85888880000", False)
        self.session = FakeSession([self.ativo, self.inativo])
        self.repository = MotoristaRepository(self.session)

    def test_criar_persiste_motorista_sem_criar_usuario(self):
        resultado = self.repository.criar("  Ana Lima  ", " 85977770000 ")

        self.assertEqual(resultado["id"], 3)
        self.assertEqual(resultado["nome"], "Ana Lima")
        self.assertEqual(resultado["telefone"], "85977770000")
        self.assertTrue(resultado["ativo"])
        self.assertEqual(self.session.commit_count, 1)
        self.assertEqual(self.session.rollback_count, 0)
        self.assertFalse(
            any(isinstance(item, UsuarioORM) for item in self.session.added)
        )

    def test_criar_faz_rollback_e_propaga_falha_de_commit(self):
        self.session.fail_commit = True

        with self.assertRaisesRegex(RuntimeError, "falha de persistência"):
            self.repository.criar("Ana Lima", "85977770000")

        self.assertEqual(self.session.rollback_count, 1)
        self.assertEqual(len(self.session.motoristas), 2)

    def test_criar_rejeita_telefone_de_motorista_ativo(self):
        with self.assertRaisesRegex(
            MotoristaTelefoneEmUsoError,
            "Este profissional já está registrado\\.",
        ):
            self.repository.criar("Ana Lima", "85 99999-0000")

        self.assertEqual(self.session.commit_count, 0)
        self.assertEqual(self.session.rollback_count, 1)
        self.assertEqual(len(self.session.motoristas), 2)

    def test_criar_rejeita_telefone_de_motorista_inativo(self):
        with self.assertRaises(MotoristaTelefoneEmUsoError):
            self.repository.criar("Ana Lima", "(85) 88888-0000")

        self.assertEqual(self.session.commit_count, 0)
        self.assertEqual(self.session.rollback_count, 1)

    def test_atualizar_permite_manter_o_proprio_telefone_formatado(self):
        resultado = self.repository.atualizar(1, telefone="(85) 99999-0000")

        self.assertEqual(resultado["telefone"], "(85) 99999-0000")
        self.assertEqual(self.ativo.telefone_hash, hash_telefone("85999990000"))
        self.assertEqual(self.session.commit_count, 1)

    def test_atualizar_rejeita_telefone_de_outro_motorista_inativo(self):
        with self.assertRaises(MotoristaTelefoneEmUsoError):
            self.repository.atualizar(1, telefone="85 88888-0000")

        self.assertEqual(self.ativo.telefone, "85999990000")
        self.assertEqual(self.session.commit_count, 0)
        self.assertEqual(self.session.rollback_count, 1)

    def test_listar_aplica_filtro_de_ativo_e_busca_de_nome_sem_case(self):
        resultados = self.repository.listar(ativo=True, nome="SILVA")

        self.assertEqual(resultados, [
            {
                "id": 1,
                "nome": "Maria da Silva",
                "telefone": "85999990000",
                "ativo": True,
            }
        ])

    def test_listar_permite_consultar_inativos(self):
        resultados = self.repository.listar(ativo=False)

        self.assertEqual([item["id"] for item in resultados], [2])
        self.assertFalse(resultados[0]["ativo"])

    def test_buscar_retorna_contrato_publico_e_none_quando_inexistente(self):
        resultado = self.repository.buscar(1)

        self.assertEqual(set(resultado), {"id", "nome", "telefone", "ativo"})
        self.assertEqual(resultado["nome"], "Maria da Silva")
        self.assertNotIn("telefone_hash", resultado)
        self.assertIsNone(self.repository.buscar(99))

    def test_atualizar_altera_apenas_campos_informados(self):
        resultado = self.repository.atualizar(1, telefone=" 85911112222 ")

        self.assertEqual(resultado["nome"], "Maria da Silva")
        self.assertEqual(resultado["telefone"], "85911112222")
        self.assertEqual(self.ativo.nome_completo, "Maria da Silva")
        self.assertEqual(self.session.commit_count, 1)

    def test_atualizar_motorista_inexistente_nao_persiste(self):
        resultado = self.repository.atualizar(99, nome="Novo Nome")

        self.assertIsNone(resultado)
        self.assertEqual(self.session.commit_count, 0)
        self.assertEqual(self.session.rollback_count, 0)

    def test_atualizar_faz_rollback_e_propaga_falha_de_commit(self):
        self.session.fail_commit = True

        with self.assertRaisesRegex(RuntimeError, "falha de persistência"):
            self.repository.atualizar(1, nome="Novo Nome")

        self.assertEqual(self.session.rollback_count, 1)
        self.assertEqual(self.ativo.nome_completo, "Maria da Silva")

    def test_possui_alocacoes_futuras_sem_checker_nao_bloqueia(self):
        # TODO(HU-010): enquanto não houver entidade de escalas, a
        # verificação falha aberto.
        self.assertFalse(self.repository.possui_alocacoes_futuras(1))

    def test_possui_alocacoes_futuras_delega_ao_checker_injetado(self):
        chamadas = []

        def checker(motorista_id):
            chamadas.append(motorista_id)
            return motorista_id == 1

        repository = MotoristaRepository(
            self.session,
            alocacoes_futuras_checker=checker,
        )

        self.assertTrue(repository.possui_alocacoes_futuras(1))
        self.assertFalse(repository.possui_alocacoes_futuras(2))
        self.assertEqual(chamadas, [1, 2])

    def test_inativar_persiste_estado_e_log_sem_dados_pessoais(self):
        resultado = self.repository.inativar(
            1,
            usuario_executor_id=10,
        )

        self.assertFalse(resultado["ativo"])
        self.assertFalse(self.ativo.ativo)
        self.assertEqual(self.session.commit_count, 1)

        logs = [item for item in self.session.added if isinstance(item, LogAuditoriaORM)]
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].usuario_id, 10)
        self.assertEqual(logs[0].acao, "INATIVAR")
        self.assertEqual(logs[0].entidade, "motorista")
        self.assertEqual(logs[0].entidade_id, 1)
        self.assertEqual(logs[0].valor_anterior, "ativo")
        self.assertEqual(logs[0].valor_novo, "inativo")
        self.assertNotIn("Maria da Silva", str(logs[0].__dict__))
        self.assertNotIn("85999990000", str(logs[0].__dict__))

    def test_reativar_persiste_estado_e_log(self):
        resultado = self.repository.reativar(2, usuario_executor_id=10)

        self.assertTrue(resultado["ativo"])
        self.assertTrue(self.inativo.ativo)
        self.assertEqual(self.session.commit_count, 1)

        logs = [item for item in self.session.added if isinstance(item, LogAuditoriaORM)]
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].acao, "REATIVAR")
        self.assertEqual(logs[0].valor_anterior, "inativo")
        self.assertEqual(logs[0].valor_novo, "ativo")

    def test_reativar_motorista_ja_ativo_nao_cria_log(self):
        resultado = self.repository.reativar(1, usuario_executor_id=10)

        self.assertTrue(resultado["ativo"])
        self.assertEqual(self.session.commit_count, 0)
        self.assertEqual(self.session.added, [])

    def test_inativar_faz_rollback_se_auditoria_falhar_no_commit(self):
        self.session.fail_commit = True

        with self.assertRaisesRegex(RuntimeError, "falha de persistência"):
            self.repository.inativar(
                1,
                usuario_executor_id=10,
            )

        self.assertTrue(self.ativo.ativo)
        self.assertEqual(self.session.rollback_count, 1)


class InativacaoComAlocacoesFuturasTest(unittest.TestCase):
    """Compõe use case e repository reais com o checker de alocações simulado."""

    def setUp(self):
        self.ativo = motorista(1, "Maria da Silva", "85999990000", True)
        self.session = FakeSession([self.ativo])

    def _use_case(self, possui_alocacoes: bool) -> GerenciarMotoristasUseCase:
        repository = MotoristaRepository(
            self.session,
            alocacoes_futuras_checker=lambda _motorista_id: possui_alocacoes,
        )
        return GerenciarMotoristasUseCase(repository)

    def test_checker_true_bloqueia_inativacao_sem_alterar_nem_auditar(self):
        with self.assertRaises(MotoristaComAlocacoesPendentesError) as contexto:
            self._use_case(True).inativar(1, usuario_executor_id=10)

        self.assertEqual(
            str(contexto.exception),
            "Este profissional possui alocações pendentes e não pode ser "
            "inativado no momento.",
        )
        self.assertTrue(self.ativo.ativo)
        self.assertEqual(self.session.commit_count, 0)
        self.assertEqual(self.session.added, [])

    def test_checker_false_inativa_e_grava_log_de_auditoria(self):
        resultado = self._use_case(False).inativar(1, usuario_executor_id=10)

        self.assertFalse(resultado["ativo"])
        self.assertFalse(self.ativo.ativo)
        self.assertEqual(self.session.commit_count, 1)
        logs = [item for item in self.session.added if isinstance(item, LogAuditoriaORM)]
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].usuario_id, 10)
        self.assertEqual(logs[0].acao, "INATIVAR")
        self.assertEqual(logs[0].entidade, "motorista")
        self.assertEqual(logs[0].entidade_id, 1)
        # Soft delete: o registro permanece persistido, apenas inativo.
        self.assertIn(self.ativo, self.session.motoristas)

    def test_log_de_auditoria_registra_timestamp_obrigatorio(self):
        coluna = LogAuditoriaORM.__table__.c.criado_em
        self.assertFalse(coluna.nullable)
        self.assertIsNotNone(coluna.default)


if __name__ == "__main__":
    unittest.main()


class MotoristaTelefoneSQLiteTest(unittest.TestCase):
    """Valida telefone, hash e persistência com um SQLite real em memória."""

    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            poolclass=StaticPool,
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(
            self.engine,
            tables=[MotoristaORM.__table__, LogAuditoriaORM.__table__],
        )
        self.session = sessionmaker(bind=self.engine)()
        self.repository = MotoristaRepository(self.session)
        self.use_case = GerenciarMotoristasUseCase(self.repository)

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def _contar(self, tabela):
        return self.session.execute(text(f"SELECT COUNT(*) FROM {tabela}")).scalar()

    def test_formas_com_e_sem_mascara_geram_o_mesmo_hash(self):
        self.assertEqual(
            hash_telefone("(88) 99811-2233"),
            hash_telefone("88998112233"),
        )

        criado = self.use_case.criar("Francisco Alves", "(88) 99811-2233")
        linha = self.session.execute(
            text("SELECT telefone_hash FROM motorista WHERE id = :id"),
            {"id": criado["id"]},
        ).scalar()

        self.assertEqual(linha, hash_telefone("88998112233"))

    def test_telefone_com_e_sem_mascara_continua_sendo_duplicado(self):
        self.use_case.criar("Francisco Alves", "(88) 99811-2233")

        for telefone in ("88998112233", "88 99811-2233", "(88) 99811-2233"):
            with self.subTest(telefone=telefone):
                with self.assertRaises(MotoristaTelefoneEmUsoError):
                    self.use_case.criar("Francisco Alves Filho", telefone)

        outro = self.use_case.criar("Antônio Lima", "(88) 99700-4455")
        with self.assertRaises(MotoristaTelefoneEmUsoError):
            self.use_case.atualizar(outro["id"], telefone="88998112233")
        self.assertEqual(self._contar("motorista"), 2)

    def test_telefone_e_gravado_como_digitado_e_criptografado(self):
        criado = self.use_case.criar("Francisco Alves", "(88) 99811-2233")

        bruto = self.session.execute(
            text("SELECT telefone FROM motorista WHERE id = :id"),
            {"id": criado["id"]},
        ).scalar()
        self.assertNotIn("99811", bruto)
        self.assertEqual(
            self.repository.buscar(criado["id"])["telefone"],
            "(88) 99811-2233",
        )

        editado = self.use_case.atualizar(criado["id"], telefone="8834125566")
        self.assertEqual(editado["telefone"], "8834125566")

    def test_telefone_recusado_nao_grava_nem_comita(self):
        existente = self.use_case.criar("Francisco Alves", "(88) 99811-2233")
        commits = []
        original_commit = self.session.commit
        self.session.commit = lambda: commits.append(1) or original_commit()

        for telefone in ("123", "998112233", "(88) abcdef", "+55 88 99811-2233"):
            with self.subTest(telefone=telefone):
                with self.assertRaises(MotoristaValidationError):
                    self.use_case.criar("Antônio Lima", telefone)
                with self.assertRaises(MotoristaValidationError):
                    self.use_case.atualizar(existente["id"], telefone=telefone)

        self.assertEqual(commits, [])
        self.assertEqual(self._contar("motorista"), 1)
        self.assertEqual(self._contar("log_auditoria"), 0)
        self.assertEqual(
            self.repository.buscar(existente["id"])["telefone"],
            "(88) 99811-2233",
        )

    def test_editar_so_o_nome_nao_falha_com_telefone_antigo_invalido(self):
        legado = MotoristaORM(
            nome_completo="Maria Antiga",
            telefone="123",
            telefone_hash=hash_telefone("123"),
            ativo=True,
        )
        self.session.add(legado)
        self.session.commit()

        editado = self.use_case.atualizar(legado.id, nome="Maria Atual")

        self.assertEqual(editado["nome"], "Maria Atual")
        self.assertEqual(editado["telefone"], "123")
        with self.assertRaises(MotoristaValidationError):
            self.use_case.atualizar(legado.id, telefone="123")
