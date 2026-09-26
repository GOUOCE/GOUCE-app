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
from src.shared.auth.dependencies import verify_any_user
from src.shared.auth.jwt_service import JWTService
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum

from src.modulos.usuarios.application.dtos.usuario_dto import (
    ValidarEtapa1CadastroUsuarioDTO,
    ValidacaoSucessoDTO,
    ValidarEtapa2CadastroUsuarioDTO,
    ValidarEtapa3CadastroUsuarioDTO,
    ValidarEtapa4CadastroUsuarioDTO,
    CadastroSucessoDTO,
    CadastroErrorResponseDTO,
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





def _validation_details(errors: list[dict]) -> list[dict]:
    details = []
    for error in errors:
        location = [
            str(part)
            for part in error.get("loc", ())
            if part not in {"body", "path", "query", "form"}
        ]
        details.append({
            "field": ".".join(location) or None,
            "message": error.get("msg", "Valor inválido"),
        })
    return details


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
                    details=_validation_details(error.errors()),
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
            details=_validation_details(error.errors()),
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

