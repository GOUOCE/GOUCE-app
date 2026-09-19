from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import or_

from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.security.lgpd_encryption import hash_email


class CadastroDuplicadoError(Exception):
    pass


class EmailDuplicadoError(CadastroDuplicadoError):
    pass


class SQLAlchemyUsuarioRepository:
    def __init__(self, session: Session):
        self.session = session

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
