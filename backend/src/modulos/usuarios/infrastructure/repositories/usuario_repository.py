from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import inspect, or_, text

from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.security.lgpd_encryption import hash_email


class CadastroDuplicadoError(Exception):
    pass


class EmailDuplicadoError(CadastroDuplicadoError):
    pass


class SQLAlchemyUsuarioRepository:
    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _normalizar_valor(valor) -> str | None:
        if valor is None:
            return None
        return str(getattr(valor, "value", valor)).lower().strip()

    def _buscar_flag_perfil_opcional(
        self,
        tabela: str,
        coluna_id: str,
        coluna_ativo: str,
        user_id: int,
    ) -> tuple[bool, bool] | None:
        """Busca um perfil auxiliar somente quando sua tabela é utilizável.

        Administrador e Representante não fazem parte do metadata carregado pelo
        aplicativo atual. A reflexão evita que uma tabela ausente quebre todas as
        requisições e não cria schema implicitamente.
        """
        try:
            inspector = inspect(self.session.get_bind())
            if tabela not in inspector.get_table_names():
                return None

            colunas = {coluna["name"] for coluna in inspector.get_columns(tabela)}
            if coluna_id not in colunas or coluna_ativo not in colunas:
                return None

            resultado = self.session.execute(
                text(
                    f'SELECT "{coluna_id}", "{coluna_ativo}" '
                    f'FROM "{tabela}" WHERE "{coluna_id}" = :user_id'
                ),
                {"user_id": user_id},
            ).mappings().first()

            if not resultado:
                return False, False

            return True, bool(resultado[coluna_ativo])
        except Exception:
            # Perfil auxiliar incompleto/indisponível não pode virar autorização
            # baseada apenas no claim do JWT. Nesse caso, o perfil não é aceito.
            return None

    def buscar_contexto_autenticacao_por_id(self, user_id: int) -> dict | None:
        """Retorna o perfil e o estado atual usados na validação de sessão."""
        usuario, aluno = self.buscar_com_detalhes_por_id(user_id)
        if not usuario:
            return None

        agora = datetime.now(timezone.utc)
        candidatos: list[dict] = []

        if aluno:
            status_cadastro = self._normalizar_valor(aluno.status_cadastro)
            ativo = status_cadastro == "ativado"
            motivo = None

            if status_cadastro == "pendente":
                motivo = "Sua conta está pendente de aprovação pela coordenação."
            elif status_cadastro != "ativado":
                motivo_reprovacao = aluno.motivo_reprovacao or ""
                complemento = f": {motivo_reprovacao}" if motivo_reprovacao else ""
                motivo = f"Sua conta está inativada{complemento}."

            validade_acesso = aluno.validade_acesso
            if ativo and validade_acesso:
                if validade_acesso.tzinfo is None:
                    validade_acesso = validade_acesso.replace(tzinfo=timezone.utc)
                if agora >= validade_acesso:
                    ativo = False
                    motivo = "A validade de acesso da sua conta expirou."

            candidatos.append({
                "role": CargoEnum.ALUNO.value,
                "ativo": ativo,
                "status": status_cadastro,
                "motivo": motivo,
                "aluno": aluno,
            })

        administrador = self._buscar_flag_perfil_opcional(
            tabela="administrador",
            coluna_id="administrador_id",
            coluna_ativo="is_administrador_ativo",
            user_id=user_id,
        )
        if administrador and administrador[0]:
            candidatos.append({
                "role": CargoEnum.ADMINISTRADOR.value,
                "ativo": administrador[1],
                "status": "ativado" if administrador[1] else "inativado",
                "motivo": None if administrador[1] else "Usuário administrativo inativo.",
                "aluno": None,
            })

        representante = self._buscar_flag_perfil_opcional(
            tabela="representante",
            coluna_id="administrador_id",
            coluna_ativo="is_representante_ativo",
            user_id=user_id,
        )
        if representante and representante[0]:
            # "supervisor" é o valor legado presente no CargoEnum e no JWT
            # atual para o perfil operacional equivalente a Representante.
            candidatos.append({
                "role": CargoEnum.SUPERVISOR.value,
                "ativo": representante[1],
                "status": "ativado" if representante[1] else "inativado",
                "motivo": None if representante[1] else "Usuário representante inativo.",
                "aluno": None,
            })

        # Um usuário sem perfil, ou com mais de um perfil, não deve receber
        # autorização por inferência arbitrária.
        if len(candidatos) != 1:
            return {
                "usuario": usuario,
                "role": None,
                "ativo": False,
                "status": None,
                "motivo": "Perfil de usuário não identificado.",
                "aluno": aluno,
            }

        contexto = candidatos[0]

        limite_de_bloqueio = usuario.limite_de_bloqueio
        if contexto["ativo"] and limite_de_bloqueio:
            if limite_de_bloqueio.tzinfo is None:
                limite_de_bloqueio = limite_de_bloqueio.replace(tzinfo=timezone.utc)
            if agora < limite_de_bloqueio:
                contexto["ativo"] = False
                contexto["motivo"] = "Conta temporariamente bloqueada."

        return {
            "usuario": usuario,
            **contexto,
        }

    def buscar_contexto_autenticacao_por_email(self, email: str) -> dict | None:
        usuario = self.buscar_por_email(email)
        if not usuario or not usuario.id:
            return None
        return self.buscar_contexto_autenticacao_por_id(usuario.id)

    def buscar_por_email(self, email: str):
        email_limpo = email.lower().strip()
        h = hash_email(email_limpo)
        return self.session.query(UsuarioORM).filter(
            or_(UsuarioORM.email_hash == h, UsuarioORM.email == email_limpo)
        ).first()

    def buscar_com_detalhes_por_email(self, email: str):
        email_limpo = email.lower().strip()
        h = hash_email(email_limpo)
        resultado = (
            self.session.query(UsuarioORM, AlunoORM)
            .outerjoin(AlunoORM, UsuarioORM.id == AlunoORM.aluno_id)
            .filter(or_(UsuarioORM.email_hash == h, UsuarioORM.email == email_limpo))
            .first()
        )
        if not resultado:
            return None, None
        return resultado[0], resultado[1]

    def listar_todos(self) -> list[dict]:
        resultados = (
            self.session.query(UsuarioORM, AlunoORM)
            .outerjoin(AlunoORM, UsuarioORM.id == AlunoORM.aluno_id)
            .all()
        )
        lista = []
        for usuario, aluno in resultados:
            # Serializa 100% de todas as colunas de UsuarioORM
            dados_usuario = {c.name: getattr(usuario, c.name) for c in usuario.__table__.columns}
            
            # Remove o hash da senha e email_hash por boas práticas de segurança
            dados_usuario.pop("senha", None)
            dados_usuario.pop("email_hash", None)

            # Serializa 100% de todas as colunas de AlunoORM se existir
            dados_aluno = {}
            if aluno:
                dados_aluno = {c.name: getattr(aluno, c.name) for c in aluno.__table__.columns}
            
            # Combina todas as informações de usuário e de aluno
            item_completo = {**dados_usuario, **dados_aluno}
            lista.append(item_completo)

        return lista

    def criar_aluno(self, comando, senha_hash: str):
        status_str = StatusCadastroEnum.PENDENTE.value
        email_limpo = comando.email.lower().strip()

        usuario = UsuarioORM(
            nome_completo=comando.nome.strip(),
            email=email_limpo,
            email_hash=hash_email(email_limpo),
            telefone=comando.telefone,
            senha=senha_hash,
        )
        self.session.add(usuario)

        consentimento_dt = (
            getattr(comando, "consentimento_lgpd_em", None)
            or (datetime.now(timezone.utc) if comando.termos_de_uso else None)
        )
        versao_termos_val = getattr(comando, "versao_termos", "1.0") or "1.0"

        try:
            self.session.flush()
            self.session.add(AlunoORM(
                aluno_id=usuario.id,
                status_cadastro=status_str,
                faculdade_id=comando.faculdade_id,
                bairro_id=comando.bairro_id,
                id_comprovante_matricula=comando.id_comprovante_matricula,
                id_comprovante_residencia=comando.id_comprovante_residencia,
                data_nascimento=comando.data_nascimento,
                identificacao_genero=comando.identificacao_genero,
                tem_filhos=comando.tem_filhos,
                transgenero=comando.transgenero,
                curso=comando.curso,
                semestre_atual=comando.semestre_atual,
                periodo_ingresso=comando.periodo_ingresso,
                turno_curso=comando.turno_curso,
                raca=comando.raca,
                validade_acesso=comando.validade_acesso,
                id_foto_aluno=comando.id_foto_aluno,
                identificacao_sexual=comando.identificacao_sexual,
                motivo_reprovacao=comando.motivo_reprovacao,
                termos_de_uso=comando.termos_de_uso,
                consentimento_lgpd_em=consentimento_dt,
                versao_termos=versao_termos_val,
            ))
            self.session.commit()
            self.session.refresh(usuario)
            return usuario
        except IntegrityError as error:
            self.session.rollback()
            try:
                if self.buscar_por_email(email_limpo):
                    raise EmailDuplicadoError from error
            except EmailDuplicadoError:
                raise
            except Exception:
                pass
            raise CadastroDuplicadoError from error

    def buscar_aluno_por_id(self, aluno_id: int) -> AlunoORM | None:
        return self.session.query(AlunoORM).filter(AlunoORM.aluno_id == aluno_id).first()

    def atualizar_status_aluno(
        self, aluno_id: int, novo_status: str, motivo_reprovacao: str | None = None
    ) -> AlunoORM | None:
        aluno = self.buscar_aluno_por_id(aluno_id)
        if not aluno:
            return None

        aluno.status_cadastro = novo_status
        if motivo_reprovacao is not None:
            aluno.motivo_reprovacao = motivo_reprovacao

        self.session.commit()
        self.session.refresh(aluno)
        return aluno

    def buscar_com_detalhes_por_id(self, user_id: int) -> tuple[UsuarioORM | None, AlunoORM | None]:
        resultado = (
            self.session.query(UsuarioORM, AlunoORM)
            .outerjoin(AlunoORM, UsuarioORM.id == AlunoORM.aluno_id)
            .filter(UsuarioORM.id == user_id)
            .first()
        )
        if not resultado:
            return None, None
        return resultado[0], resultado[1]

    def atualizar_email(self, user_id: int, novo_email: str) -> UsuarioORM | None:
        usuario = self.session.query(UsuarioORM).filter(UsuarioORM.id == user_id).first()
        if not usuario:
            return None

        email_limpo = novo_email.lower().strip()
        usuario.email = email_limpo
        usuario.email_hash = hash_email(email_limpo)

        self.session.commit()
        self.session.refresh(usuario)
        return usuario

    def atualizar_dados_parciais(self, user_id: int, telefone: str | None = None, bairro_id: str | None = None):
        usuario, aluno = self.buscar_com_detalhes_por_id(user_id)
        if not usuario:
            return None, None

        if telefone is not None:
            usuario.telefone = telefone

        if aluno and bairro_id is not None:
            aluno.bairro_id = bairro_id

        self.session.commit()
        self.session.refresh(usuario)
        if aluno:
            self.session.refresh(aluno)

        return usuario, aluno
