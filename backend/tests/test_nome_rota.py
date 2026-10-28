"""Unicidade do nome entre rotas principais e complementares (#208, item 1; #309)."""

import unittest
from datetime import time
from unittest.mock import MagicMock

from tests.rota_complementar_support import criar_engine, novo_session, semear_principais

from src.modulos.rotas.infrastructure.nome_rota import nome_rota_em_uso, travar_nome_rota
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM  # noqa: F401


class NomeRotaEmUsoTest(unittest.TestCase):
    def setUp(self):
        self.session = novo_session(criar_engine())
        # Principais: 1 "Rota Centro - UFC" (ativa) e 3 "Rota Antiga" (inativa)
        semear_principais(self.session)
        self.session.add(
            RotaComplementarORM(
                id=7, rota_principal_id=1, nome="Van Trevo", horario_saida=time(6, 0),
                horario_retorno=time(17, 40), ponto_conexao="Trevo", ativo=False,
            )
        )
        self.session.commit()

    def tearDown(self):
        self.session.close()

    def test_nome_de_qualquer_tipo_conta_sem_diferenciar_caixa_e_espacos(self):
        for nome in ("Rota Centro - UFC", "  ROTA CENTRO - ufc ", "rota antiga", " van trevo"):
            with self.subTest(nome=nome):
                self.assertTrue(nome_rota_em_uso(self.session, nome))
        self.assertFalse(nome_rota_em_uso(self.session, "Van Nova"))

    def test_ignora_so_o_proprio_registro_do_tipo_editado(self):
        self.assertFalse(nome_rota_em_uso(self.session, "Van Trevo", ignorar_complementar_id=7))
        self.assertFalse(nome_rota_em_uso(self.session, "Rota Antiga", ignorar_principal_id=3))
        # O id ignorado vale só para o próprio tipo
        self.assertTrue(nome_rota_em_uso(self.session, "Van Trevo", ignorar_principal_id=7))
        self.assertTrue(nome_rota_em_uso(self.session, "Rota Centro - UFC", ignorar_complementar_id=1))


class TravarNomeRotaTest(unittest.TestCase):
    def sessao(self, dialeto):
        session = MagicMock()
        session.get_bind.return_value.dialect.name = dialeto
        return session

    def test_no_postgres_trava_pelo_nome_normalizado(self):
        session = self.sessao("postgresql")

        travar_nome_rota(session, " Van Trevo ")

        sql, parametros = session.execute.call_args.args
        self.assertIn("pg_advisory_xact_lock(hashtext(lower(trim(:nome))))", str(sql))
        self.assertEqual(parametros, {"nome": " Van Trevo "})

    def test_fora_do_postgres_nao_executa_nada(self):
        session = self.sessao("sqlite")

        travar_nome_rota(session, "Van Trevo")

        session.execute.assert_not_called()
