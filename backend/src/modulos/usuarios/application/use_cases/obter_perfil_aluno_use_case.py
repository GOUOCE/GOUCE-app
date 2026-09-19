from src.modulos.usuarios.application.dtos.usuario_dto import PerfilAlunoResponseDTO


class ObterPerfilAlunoUseCase:
    """
    Caso de uso responsável por consultar os dados do perfil do aluno autenticado.
    Retorna apenas as informações permitidas, omitindo hashes, senhas e dados internos.
    """

    def __init__(self, repository):
        self.repository = repository

    def execute(self, user_id: int) -> PerfilAlunoResponseDTO:
        if not user_id or not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("ID de usuário inválido")

        usuario, aluno = self.repository.buscar_com_detalhes_por_id(user_id)

        if not usuario:
            raise ValueError(f"Usuário com ID {user_id} não encontrado")

        status_cadastro = aluno.status_cadastro if aluno else "desconhecido"

        return PerfilAlunoResponseDTO(
            id=usuario.id,
            nome=usuario.nome_completo,
            email=usuario.email,
            telefone=usuario.telefone,
            status_cadastro=status_cadastro,
            faculdade_id=aluno.faculdade_id if aluno else None,
            bairro_id=aluno.bairro_id if aluno else None,
            curso=aluno.curso if aluno else None,
            semestre_atual=aluno.semestre_atual if aluno else None,
            periodo_ingresso=aluno.periodo_ingresso if aluno else None,
            turno_curso=aluno.turno_curso if aluno else None,
            data_nascimento=aluno.data_nascimento if aluno else None,
            identificacao_genero=aluno.identificacao_genero if aluno else None,
            raca=aluno.raca if aluno else None,
            identificacao_sexual=aluno.identificacao_sexual if aluno else None,
            tem_filhos=aluno.tem_filhos if aluno else None,
            id_foto_aluno=aluno.id_foto_aluno if aluno else None,
            validade_acesso=aluno.validade_acesso if aluno else None,
            motivo_reprovacao=aluno.motivo_reprovacao if aluno else None,
            id_comprovante_matricula=aluno.id_comprovante_matricula if aluno else None,
            id_comprovante_residencia=aluno.id_comprovante_residencia if aluno else None,
        )
