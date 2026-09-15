from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM


class CadastroDuplicadoError(Exception):
    pass


class SQLAlchemyUsuarioRepository:
    def __init__(self, session: Session):
        self.session = session

    def buscar_por_email(self, email: str):
        return self.session.query(UsuarioORM).filter(UsuarioORM.email == email.lower().strip()).first()

    def buscar_com_detalhes_por_email(self, email: str):
        resultado = (
            self.session.query(UsuarioORM, AlunoORM)
            .outerjoin(AlunoORM, UsuarioORM.id == AlunoORM.aluno_id)
            .filter(UsuarioORM.email == email.lower().strip())
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
            
            # Remove o hash da senha por boas práticas de segurança
            dados_usuario.pop("senha", None)

            # Serializa 100% de todas as colunas de AlunoORM se existir
            dados_aluno = {}
            if aluno:
                dados_aluno = {c.name: getattr(aluno, c.name) for c in aluno.__table__.columns}
            
            # Combina todas as informações de usuário e de aluno
            item_completo = {**dados_usuario, **dados_aluno}
            lista.append(item_completo)

        return lista

    def criar_aluno(self, comando, senha_hash: str):
        status_str = str(comando.status_cadastro.value if hasattr(comando.status_cadastro, "value") else comando.status_cadastro)

        usuario = UsuarioORM(
            nome_completo=comando.nome.strip(),
            email=comando.email.lower().strip(),
            telefone=comando.telefone,
            senha=senha_hash,
        )
        self.session.add(usuario)

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
            ))
            self.session.commit()
            self.session.refresh(usuario)
            return usuario
        except IntegrityError as error:
            self.session.rollback()
            raise CadastroDuplicadoError from error