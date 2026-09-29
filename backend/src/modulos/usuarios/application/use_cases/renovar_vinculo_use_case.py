from src.modulos.arquivos.application.use_cases.salvar_arquivo_use_case import (
    SalvarArquivoUseCase,
)
from src.modulos.usuarios.application.dtos.renovacao_vinculo_dto import (
    RenovacaoVinculoDTO,
    RenovacaoVinculoRespostaDTO,
)
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import (
    ValidacaoMultiplaError,
)
from src.modulos.usuarios.application.use_cases.validar_etapa_2_use_case import (
    ValidarEtapa2UsuarioUseCase,
)
from src.modulos.usuarios.application.use_cases.validar_etapa_3_use_case import (
    ValidarEtapa3UsuarioUseCase,
)
from src.modulos.usuarios.application.use_cases.validar_etapa_4_use_case import (
    ValidarEtapa4UsuarioUseCase,
)
from src.modulos.usuarios.application.use_cases.validar_etapa_1_use_case import (
    validar_regras_arquivo,
)
from src.modulos.usuarios.application.dtos.usuario_dto import (
    ValidarEtapa2CadastroUsuarioDTO,
    ValidarEtapa3CadastroUsuarioDTO,
)
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.validators.string_sem_numero_validator import StringSemNumeroValidator


class RenovarVinculoUseCase:
    def __init__(
        self,
        repository,
        salvar_arquivo_use_case: SalvarArquivoUseCase,
    ):
        self.repository = repository
        self.salvar_arquivo_use_case = salvar_arquivo_use_case
        self.validar_etapa_2 = ValidarEtapa2UsuarioUseCase()
        self.validar_etapa_3 = ValidarEtapa3UsuarioUseCase()
        self.validar_etapa_4 = ValidarEtapa4UsuarioUseCase()
        self.string_validator = StringSemNumeroValidator()

    def execute(
        self,
        aluno_id: int,
        dto: RenovacaoVinculoDTO,
        arquivo_matricula: tuple,
        arquivo_residencia: tuple,
        arquivo_foto: tuple | None = None,
    ) -> RenovacaoVinculoRespostaDTO:
        usuario, aluno = self.repository.buscar_com_detalhes_por_id(aluno_id)
        if not usuario or not aluno:
            raise ValueError("Aluno autenticado não encontrado")

        erros = []
        nome = dto.nome.strip()
        if len(nome.split()) < 2:
            erros.append({"field": "nome", "message": "Informe seu nome completo (nome e sobrenome)"})
        elif not self.string_validator.validar_string_sem_numero(nome):
            erros.append({"field": "nome", "message": "O nome deve conter apenas letras e espaços"})

        if arquivo_foto:
            erro_foto = validar_regras_arquivo(
                arquivo_foto[0], arquivo_foto[1], arquivo_foto[2]
            )
            if erro_foto:
                erros.append({"field": "foto_perfil", "message": erro_foto})
        etapa_2 = ValidarEtapa2CadastroUsuarioDTO(
            raca=dto.raca,
            identificacao_sexual=dto.identificacao_sexual,
            identificacao_genero=dto.identificacao_genero,
            transgenero=dto.transgenero,
            tem_filhos=dto.tem_filhos,
        )
        etapa_3 = ValidarEtapa3CadastroUsuarioDTO(
            bairro_id=dto.bairro_id,
            telefone=dto.telefone,
            faculdade_id=dto.faculdade_id,
            curso=dto.curso,
            campus=dto.campus,
            periodo_ingresso=dto.periodo_ingresso,
            turno_curso=getattr(dto.turno_curso, "value", dto.turno_curso),
            semestre_atual=dto.semestre_atual,
        )

        for validator, etapa in (
            (self.validar_etapa_2, etapa_2),
            (self.validar_etapa_3, etapa_3),
        ):
            try:
                validator.execute(etapa)
            except ValidacaoMultiplaError as error:
                erros.extend(error.erros)

        if not arquivo_matricula:
            erros.append({"field": "comprovante_matricula", "message": "Comprovante de matrícula é obrigatório"})
        else:
            erro_mat = validar_regras_arquivo(arquivo_matricula[0], arquivo_matricula[1], arquivo_matricula[2])
            if erro_mat:
                erros.append({"field": "comprovante_matricula", "message": erro_mat})

        if arquivo_residencia:
            erro_res = validar_regras_arquivo(arquivo_residencia[0], arquivo_residencia[1], arquivo_residencia[2])
            if erro_res:
                erros.append({"field": "comprovante_residencia", "message": erro_res})

        if erros:
            raise ValidacaoMultiplaError(erros)

        matricula = self.salvar_arquivo_use_case.execute(
            arquivo_matricula[2], arquivo_matricula[0], arquivo_matricula[1]
        )

        residencia_id = aluno.id_comprovante_residencia
        if arquivo_residencia:
            residencia = self.salvar_arquivo_use_case.execute(
                arquivo_residencia[2], arquivo_residencia[0], arquivo_residencia[1]
            )
            residencia_id = residencia.id

        foto_id = None
        if arquivo_foto:
            foto = self.salvar_arquivo_use_case.execute(
                arquivo_foto[2], arquivo_foto[0], arquivo_foto[1]
            )
            foto_id = foto.id

        atualizado = self.repository.atualizar_dados_renovacao(
            aluno_id=aluno_id,
            dados=dto,
            id_comprovante_matricula=matricula.id,
            id_comprovante_residencia=residencia_id,
            id_foto_aluno=foto_id,
            novo_status=StatusCadastroEnum.ANALISE_RENOVACAO.value,
        )
        if not atualizado:
            raise ValueError("Aluno autenticado não encontrado")

        return RenovacaoVinculoRespostaDTO(
            aluno_id=atualizado.aluno_id,
            status_cadastro=StatusCadastroEnum.ANALISE_RENOVACAO,
        )