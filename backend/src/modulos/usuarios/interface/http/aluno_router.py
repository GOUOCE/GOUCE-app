import logging
from functools import wraps
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from pydantic import ValidationError
from sqlalchemy.orm import Session

from src.shared.infrastructure.db import get_session
from src.shared.auth.dependencies import (
    require_roles,
    verify_any_user,
    verify_student_standard_access,
)
from src.shared.auth.jwt_service import JWTService
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.http.validation import validation_details

from src.modulos.usuarios.application.dtos.usuario_dto import (
    ValidarEtapa1CadastroUsuarioDTO,
    ValidacaoSucessoDTO,
    ValidarEtapa2CadastroUsuarioDTO,
    ValidarEtapa3CadastroUsuarioDTO,
    ValidarEtapa4CadastroUsuarioDTO,
    CadastroSucessoDTO,
    PerfilAlunoResponseDTO,
    AdminAlunoDetalhesResponseDTO,
    AlunoResumoResponseDTO,
    CadastroErrorResponseDTO,
)
from src.modulos.usuarios.application.dtos.renovacao_vinculo_dto import (
    RenovacaoVinculoDTO,
    RenovacaoVinculoRespostaDTO,
)
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import (
    CadastroValidationError,
    ValidacaoMultiplaError,
    CriarUsuarioUseCase,
    EmailAlreadyRegisteredError,
)
from src.modulos.usuarios.application.use_cases.validar_etapa_1_use_case import ValidarEtapa1UsuarioUseCase
from src.modulos.usuarios.application.use_cases.validar_etapa_2_use_case import ValidarEtapa2UsuarioUseCase
from src.modulos.usuarios.application.use_cases.validar_etapa_3_use_case import ValidarEtapa3UsuarioUseCase
from src.modulos.usuarios.application.use_cases.validar_etapa_4_use_case import ValidarEtapa4UsuarioUseCase
from src.modulos.usuarios.application.use_cases.renovar_vinculo_use_case import RenovarVinculoUseCase
from src.modulos.usuarios.application.use_cases.obter_perfil_aluno_use_case import ObterPerfilAlunoUseCase
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
    CadastroDuplicadoError,
    EmailDuplicadoError,
)

from src.modulos.arquivos.infrastructure.repositories.arquivo_repository import SQLAlchemyArquivoRepository
from src.modulos.arquivos.infrastructure.services.minio_storage import MinioStorageService
from src.modulos.arquivos.application.use_cases.salvar_arquivo_use_case import (
    ArquivoValidacaoError,
    SalvarArquivoUseCase,
)

logger = logging.getLogger(__name__)

EDICAO_ERROR_RESPONSES = {
    400: {"model": CadastroErrorResponseDTO},
    401: {"model": CadastroErrorResponseDTO},
    403: {"model": CadastroErrorResponseDTO},
    404: {"model": CadastroErrorResponseDTO},
    409: {"model": CadastroErrorResponseDTO},
    422: {"model": CadastroErrorResponseDTO},
    500: {"model": CadastroErrorResponseDTO},
}



def _error_response(
    status_code: int,
    code: str,
    message: str,
    details: list[dict] | None = None,
) -> JSONResponse:
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": error},
    )


def _internal_error_response() -> JSONResponse:
    logger.exception("Erro interno ao processar cadastro de aluno")
    return _error_response(
        status_code=500,
        code="INTERNAL_ERROR",
        message="Erro interno ao processar a solicitação",
    )


class CadastroValidationRoute(APIRoute):
    """Padroniza apenas erros estruturais das rotas públicas de cadastro."""

    def get_route_handler(self):
        original_route_handler = super().get_route_handler()

        @wraps(original_route_handler)
        async def custom_route_handler(request: Request):
            try:
                return await original_route_handler(request)
            except RequestValidationError as error:
                return _error_response(
                    status_code=422,
                    code="REQUEST_VALIDATION_ERROR",
                    message="Requisição inválida",
                    details=validation_details(error.errors()),
                )
            except HTTPException:
                raise
            except Exception:
                return _internal_error_response()

        return custom_route_handler


CADASTRO_ERROR_RESPONSES = {
    400: {"model": CadastroErrorResponseDTO},
    409: {"model": CadastroErrorResponseDTO},
    422: {"model": CadastroErrorResponseDTO},
    500: {"model": CadastroErrorResponseDTO},
}


router = APIRouter(prefix="/alunos", tags=["Alunos"], route_class=CadastroValidationRoute)


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return SQLAlchemyUsuarioRepository(session)


def get_arquivo_repository(session: Annotated[Session, Depends(get_session)]):
    return SQLAlchemyArquivoRepository(session)


def get_hasher():
    return Argon2PasswordHasher()


def get_token_service():
    return JWTService()


def get_storage_service():
    return MinioStorageService()





@router.get(
    "",
    response_model=list[AlunoResumoResponseDTO],
    summary="Listar resumo dos alunos",
)
async def listar_alunos_resumo(
    status: str | None = None,
    ordem: str | None = None,
    repository=Depends(get_repository),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    status_normalizado = status.strip().lower() if status is not None else None
    status_permitidos = {item.value for item in StatusCadastroEnum}
    if status_normalizado and status_normalizado not in status_permitidos:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status inválido. Informe um dos valores: "
                + ", ".join(sorted(status_permitidos))
            ),
        )

    return repository.listar_alunos_resumo(
        status=status_normalizado or None,
        ordem=ordem,
    )


@router.post(
    "/validar-etapa-1",
    response_model=ValidacaoSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 1: Dados básicos",
    description="Valida foto, nome, data de nascimento, e-mail, senha e confirmação de senha."
)
async def validar_etapa_1_cadastro_usuario(
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    confirmar_senha: str = Form(...),
    data_nascimento: str = Form(...),
    foto_perfil: UploadFile | str | None = File(None),
    repository=Depends(get_repository),
):
    try:
        dto = ValidarEtapa1CadastroUsuarioDTO(
            nome=nome,
            email=email,
            senha=senha,
            confirmar_senha=confirmar_senha,
            data_nascimento=data_nascimento
        )
    except ValidationError as error:
        return _error_response(
            status_code=422,
            code="REQUEST_VALIDATION_ERROR",
            message="Requisição inválida",
            details=validation_details(error.errors()),
        )

    try:
        use_case = ValidarEtapa1UsuarioUseCase(repository=repository)
        
        arq_foto = None
        if foto_perfil and getattr(foto_perfil, "filename", None):
            arq_foto = (foto_perfil.filename, foto_perfil.content_type, await foto_perfil.read())

        return use_case.execute(dto, arquivo_foto=arq_foto)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 1", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 1")
        return _internal_error_response()

@router.post(
    "/validar-etapa-2",
    response_model=ValidacaoSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 2: Perfil demográfico",
    description="Valida raça, identidade sexual, gênero, se é transgênero e se tem filhos."
)
async def validar_etapa_2_cadastro_usuario(
    dto: ValidarEtapa2CadastroUsuarioDTO,
):
    try:
        use_case = ValidarEtapa2UsuarioUseCase()
        return use_case.execute(dto)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 2", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 2")
        return _internal_error_response()


@router.post(
    "/validar-etapa-3",
    response_model=ValidacaoSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 3: Contato e vínculo",
    description="Valida bairro, telefone, instituição, curso, campus, período de ingresso, turno e semestre atual."
)
async def validar_etapa_3_cadastro_usuario(
    dto: ValidarEtapa3CadastroUsuarioDTO,
):
    try:
        use_case = ValidarEtapa3UsuarioUseCase()
        return use_case.execute(dto)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 3", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 3")
        return _internal_error_response()



@router.post(
    "/validar-etapa-4",
    response_model=ValidacaoSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 4: Documentação",
    description="Valida tamanho e formato do comprovante de matrícula e comprovante de residência."
)
async def validar_etapa_4_cadastro_usuario(
    comprovante_matricula: UploadFile | str | None = File(None),
    comprovante_residencia: UploadFile | str | None = File(None),
):
    try:
        arq_mat = None
        if comprovante_matricula and getattr(comprovante_matricula, "filename", None):
            arq_mat = (comprovante_matricula.filename, comprovante_matricula.content_type, await comprovante_matricula.read())

        arq_res = None
        if comprovante_residencia and getattr(comprovante_residencia, "filename", None):
            arq_res = (comprovante_residencia.filename, comprovante_residencia.content_type, await comprovante_residencia.read())

        use_case = ValidarEtapa4UsuarioUseCase()
        return use_case.execute(arq_mat, arq_res)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 4", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 4")
        return _internal_error_response()


@router.put(
    "/renovar-vinculo",
    response_model=RenovacaoVinculoRespostaDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Solicitar renovação de vínculo",
    description="Atualiza os dados das etapas 2, 3 e 4 do aluno autenticado e envia a renovação para análise.",
)
async def renovar_vinculo(
    nome: str = Form(...),
    raca: str = Form(...),
    identificacao_sexual: str = Form(...),
    identificacao_genero: str = Form(...),
    transgenero: str = Form(...),
    tem_filhos: bool = Form(...),
    telefone: str = Form(...),
    bairro_id: str = Form(...),
    faculdade_id: str = Form(...),
    curso: str = Form(...),
    campus: str = Form(...),
    periodo_ingresso: str = Form(...),
    turno_curso: str = Form(...),
    semestre_atual: int = Form(...),
    comprovante_matricula: UploadFile = File(...),
    comprovante_residencia: UploadFile | str | None = File(None),
    foto_perfil: UploadFile | str | None = File(None),
    current_user: Annotated[dict, Depends(verify_student_standard_access)] = None,
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
    storage_service=Depends(get_storage_service),
):
    user_id = current_user.get("current_user_id") if current_user else None
    if not isinstance(user_id, int) or isinstance(user_id, bool):
        raise HTTPException(status_code=401, detail="Sessão inválida")

    try:
        dto = RenovacaoVinculoDTO(
            nome=nome,
            raca=raca,
            identificacao_sexual=identificacao_sexual,
            identificacao_genero=identificacao_genero,
            transgenero=transgenero,
            tem_filhos=tem_filhos,
            telefone=telefone,
            bairro_id=bairro_id,
            faculdade_id=faculdade_id,
            curso=curso,
            campus=campus,
            periodo_ingresso=periodo_ingresso,
            turno_curso=turno_curso,
            semestre_atual=semestre_atual,
        )
        arquivo_mat = (
            comprovante_matricula.filename or "comprovante_matricula",
            comprovante_matricula.content_type,
            await comprovante_matricula.read(),
        )
        arquivo_res = None
        if comprovante_residencia and getattr(comprovante_residencia, "filename", None):
            arquivo_res = (
                comprovante_residencia.filename or "comprovante_residencia",
                comprovante_residencia.content_type,
                await comprovante_residencia.read(),
            )
        arquivo_foto = None
        if foto_perfil and getattr(foto_perfil, "filename", None):
            arquivo_foto = (
                foto_perfil.filename,
                foto_perfil.content_type,
                await foto_perfil.read(),
            )
        salvar_arquivo = SalvarArquivoUseCase(arquivo_repository, storage_service)
        use_case = RenovarVinculoUseCase(repository, salvar_arquivo)
        return use_case.execute(user_id, dto, arquivo_mat, arquivo_res, arquivo_foto)
    except ValidationError as error:
        return _error_response(
            status_code=422,
            code="REQUEST_VALIDATION_ERROR",
            message="Requisição inválida",
            details=validation_details(error.errors()),
        )
    except ValidacaoMultiplaError as error:
        return _error_response(
            status_code=422,
            code="BUSINESS_VALIDATION_ERROR",
            message="Erros de validação encontrados na renovação de vínculo",
            details=error.erros,
        )
    except ValueError as error:
        if "não encontrado" in str(error).lower():
            return _error_response(404, "RESOURCE_NOT_FOUND", "Aluno autenticado não encontrado")
        return _error_response(400, "VALIDATION_ERROR", "Dados inválidos")
    except HTTPException:
        raise
    except Exception:
        logger.exception("Erro ao processar renovação de vínculo")
        return _internal_error_response()


@router.get(
    "/me/carteirinha",
    response_model=PerfilAlunoResponseDTO,
    responses=EDICAO_ERROR_RESPONSES,
)
async def obter_carteirinha(
    current_user: Annotated[dict, Depends(verify_student_standard_access)],
    repository=Depends(get_repository),
):
    try:
        user_id = current_user.get("current_user_id")
        status = current_user.get("current_status")

        # HU-029 (AC-02): somente aluno aprovado acessa a carteirinha;
        # "Em Análise" (renovação da HU-028), pendente e inativado ficam bloqueados.
        if status != StatusCadastroEnum.ATIVADO.value:
            raise HTTPException(status_code=403, detail="Carteirinha indisponível. Seu cadastro está inativo ou em análise.")
        if not isinstance(user_id, int) or isinstance(user_id, bool):
            raise HTTPException(status_code=401, detail="Sessão inválida")

        use_case = ObterPerfilAlunoUseCase(repository)
        return use_case.execute(user_id)
    except HTTPException:
        raise
    except ValueError as error:
        if "não encontrado" in str(error).lower():
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        raise HTTPException(status_code=400, detail="Dados inválidos")
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno ao consultar o perfil")


@router.get(
    "/{aluno_id}",
    response_model=AdminAlunoDetalhesResponseDTO,
    summary="Consultar todos os dados de um aluno",
    description="Retorna os dados seguros e completos de um aluno. Acesso exclusivo para administradores.",
)
async def obter_detalhes_aluno(
    aluno_id: int,
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
    _: dict = Depends(require_roles(CargoEnum.ADMINISTRADOR.value)),
):
    try:
        aluno = repository.buscar_aluno_por_id(aluno_id)
        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")

        perfil = ObterPerfilAlunoUseCase(repository, arquivo_repository).execute(aluno_id)
        resposta = perfil.model_dump()
        resposta.update(
            {
                "transgenero": aluno.transgenero,
                "documentos_reenvio": repository.normalizar_documentos_reenvio(
                    getattr(aluno, "documentos_reenvio", None)
                ),
                "data_hora_envio_analise": aluno.data_hora_envio_analise,
                "data_hora_ultima_renovacao_matricula": (
                    aluno.data_hora_ultima_renovacao_matricula
                ),
                "termos_de_uso": aluno.termos_de_uso,
                "consentimento_lgpd_em": aluno.consentimento_lgpd_em,
                "versao_termos": aluno.versao_termos,
            }
        )
        return resposta
    except HTTPException:
        raise
    except ValueError as error:
        if "não encontrado" in str(error).lower():
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        raise HTTPException(status_code=400, detail="Não foi possível consultar os dados do aluno")
    except Exception:
        logger.exception("Erro ao consultar detalhes do aluno %s", aluno_id)
        raise HTTPException(status_code=500, detail="Erro interno ao consultar os dados do aluno")
