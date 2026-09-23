import logging
import traceback
from functools import wraps
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from pydantic import ValidationError
from sqlalchemy.orm import Session

from src.shared.infrastructure.db import get_session
from src.shared.auth.dependencies import require_roles
from src.shared.auth.jwt_service import JWTService
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum

from src.modulos.usuarios.application.dtos.usuario_dto import (
    CadastroUsuarioDTO,
    CadastroSucessoDTO,
    CadastroErrorResponseDTO,
    AtualizarStatusAlunoDTO,
    AprovacaoAlunoResponseDTO,
    PerfilAlunoResponseDTO,
    RedefinirEmailDTO,
    UsuarioResponseDTO,
    AtualizarAlunoDTO,
)
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import (
    CadastroValidationError,
    ValidacaoMultiplaError,
    CriarUsuarioUseCase,
    EmailAlreadyRegisteredError,
)
from src.modulos.usuarios.application.use_cases.listar_usuarios_use_case import ListarUsuariosUseCase
from src.modulos.usuarios.application.use_cases.aprovar_aluno_use_case import AprovarAlunoUseCase
from src.modulos.usuarios.application.use_cases.obter_perfil_aluno_use_case import ObterPerfilAlunoUseCase
from src.modulos.usuarios.application.use_cases.redefinir_email_use_case import (
    RedefinirEmailUseCase,
    RedefinirEmailValidationError,
)
from src.modulos.usuarios.application.use_cases.atualizar_aluno_use_case import (
    AtualizarAlunoUseCase,
    AtualizarAlunoValidationError,
)
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


def _multiple_validation_details(error: ValidacaoMultiplaError) -> list[dict]:
    return [
        {
            "field": getattr(item, "field", None),
            "message": str(item),
        }
        for item in error.erros
    ]


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


def _internal_error_response(error: Exception, context: str = "cadastro") -> JSONResponse:
    tb = traceback.format_exc()
    logger.error("Erro inesperado no %s: %s\n%s", context, error, tb)
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
            except Exception as error:
                return _internal_error_response(error, context="cadastro")

        return custom_route_handler


class EdicaoPerfilValidationRoute(APIRoute):
    """Padroniza erros estruturais e internos das rotas de edição de perfil."""

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
            except HTTPException as error:
                if error.status_code >= 500:
                    return _internal_error_response(error, context="edicao-perfil")

                status_codes = {
                    400: "VALIDATION_ERROR",
                    401: "UNAUTHORIZED",
                    403: "FORBIDDEN",
                    404: "RESOURCE_NOT_FOUND",
                    409: "CONFLICT",
                    422: "REQUEST_VALIDATION_ERROR",
                }
                return _error_response(
                    status_code=error.status_code,
                    code=status_codes.get(error.status_code, "REQUEST_ERROR"),
                    message="Não autorizado" if error.status_code == 401 else "Requisição inválida",
                )
            except Exception as error:
                return _internal_error_response(error, context="edicao-perfil")

        return custom_route_handler


CADASTRO_ERROR_RESPONSES = {
    400: {"model": CadastroErrorResponseDTO},
    409: {"model": CadastroErrorResponseDTO},
    422: {"model": CadastroErrorResponseDTO},
    500: {"model": CadastroErrorResponseDTO},
}


router = APIRouter(prefix="/usuarios", tags=["Usuários e Alunos"])
cadastro_router = APIRouter(route_class=CadastroValidationRoute)
edicao_router = APIRouter(route_class=EdicaoPerfilValidationRoute)

EDICAO_ERROR_RESPONSES = {
    400: {"model": CadastroErrorResponseDTO},
    401: {"model": CadastroErrorResponseDTO},
    404: {"model": CadastroErrorResponseDTO},
    409: {"model": CadastroErrorResponseDTO},
    422: {"model": CadastroErrorResponseDTO},
    500: {"model": CadastroErrorResponseDTO},
}


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
    "/",
    response_model=list[dict],
    summary="Listar Todos os Usuários e Alunos",
)
async def listar_usuarios(
    repository=Depends(get_repository),
    current_user: Annotated[dict, Depends(require_roles(CargoEnum.ADMINISTRADOR.value))] = None,
):
    try:
        use_case = ListarUsuariosUseCase(repository)
        return use_case.execute()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno ao listar os usuários e alunos")


@router.get(
    "/alunos",
    response_model=list[dict],
    summary="Listar Todos os Alunos",
)
async def listar_alunos(
    repository=Depends(get_repository),
    current_user: Annotated[dict, Depends(require_roles(CargoEnum.ADMINISTRADOR.value))] = None,
):
    return await listar_usuarios(repository, current_user)


@cadastro_router.post(
    "/cadastrar",
    response_model=CadastroSucessoDTO,
    status_code=201,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Cadastrar Usuário / Aluno com Arquivos",
)
async def cadastrar_usuario_com_arquivos(
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    faculdade_id: str = Form(...),
    curso: str = Form(...),
    data_nascimento: str = Form(...),
    termos_de_uso: bool = Form(...),
    comprovante_matricula: UploadFile = File(...),
    comprovante_residencia: UploadFile = File(...),
    telefone: Optional[str] = Form(None),
    bairro_id: Optional[str] = Form(None),
    identificacao_genero: Optional[str] = Form(None),
    tem_filhos: Optional[bool] = Form(None),
    semestre_atual: Optional[int] = Form(None),
    periodo_ingresso: Optional[str] = Form(None),
    turno_curso: Optional[str] = Form(None),
    raca: Optional[str] = Form(None),
    identificacao_sexual: Optional[str] = Form(None),
    foto_perfil: UploadFile | str | None = File(None),
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
    hasher=Depends(get_hasher),
    token_service=Depends(get_token_service),
    storage_service=Depends(get_storage_service),
):
    try:
        salvar_arquivo_uc = SalvarArquivoUseCase(arquivo_repository, storage_service)

        # Normaliza campos opcionais para evitar strings vazias vindas do Swagger/FormData.
        telefone = telefone.strip() if isinstance(telefone, str) and telefone.strip() else None
        bairro_id = bairro_id.strip() if isinstance(bairro_id, str) and bairro_id.strip() else None
        identificacao_genero = identificacao_genero.strip() if isinstance(identificacao_genero, str) and identificacao_genero.strip() else None
        raca = raca.strip() if isinstance(raca, str) and raca.strip() else None
        identificacao_sexual = identificacao_sexual.strip() if isinstance(identificacao_sexual, str) and identificacao_sexual.strip() else None
        periodo_ingresso = periodo_ingresso.strip() if isinstance(periodo_ingresso, str) and periodo_ingresso.strip() else None
        turno_curso = turno_curso.strip() if isinstance(turno_curso, str) and turno_curso.strip() else None

        # 1. Upload do comprovante de matrícula
        conteudo_mat = await comprovante_matricula.read()
        res_mat = salvar_arquivo_uc.execute(
            conteudo_mat,
            comprovante_matricula.filename or "comprovante_matricula",
            comprovante_matricula.content_type,
        )

        # 2. Upload do comprovante de residência
        conteudo_res = await comprovante_residencia.read()
        res_res = salvar_arquivo_uc.execute(
            conteudo_res,
            comprovante_residencia.filename or "comprovante_residencia",
            comprovante_residencia.content_type,
        )

        # 3. Upload da foto de perfil (se fornecida)
        foto_id = None
        if foto_perfil is not None and getattr(foto_perfil, "filename", None):
            conteudo_foto = await foto_perfil.read()
            res_foto = salvar_arquivo_uc.execute(
                conteudo_foto,
                foto_perfil.filename or "foto_perfil",
                foto_perfil.content_type,
            )
            foto_id = res_foto.id

        # 4. Montar DTO e Criar Aluno
        try:
            dto = CadastroUsuarioDTO(
                nome=nome,
                email=email,
                senha=senha,
                telefone=telefone,
                status_cadastro=StatusCadastroEnum.PENDENTE,
                faculdade_id=faculdade_id,
                bairro_id=bairro_id,
                id_comprovante_matricula=res_mat.id,
                id_comprovante_residencia=res_res.id,
                data_nascimento=data_nascimento,
                identificacao_genero=identificacao_genero,
                tem_filhos=tem_filhos,
                curso=curso,
                semestre_atual=semestre_atual,
                periodo_ingresso=periodo_ingresso,
                turno_curso=turno_curso,
                raca=raca,
                identificacao_sexual=identificacao_sexual,
                id_foto_aluno=foto_id,
                termos_de_uso=termos_de_uso,
            )
        except ValidationError as error:
            return _error_response(
                status_code=422,
                code="REQUEST_VALIDATION_ERROR",
                message="Requisição inválida",
                details=_validation_details(error.errors()),
            )

        use_case = CriarUsuarioUseCase(repository, hasher, token_service, arquivo_repository=arquivo_repository)
        return use_case.execute(dto)
    except EmailAlreadyRegisteredError:
        return _error_response(
            status_code=409,
            code="EMAIL_ALREADY_REGISTERED",
            message="E-mail já cadastrado no sistema",
        )
    except ValidacaoMultiplaError as error:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
            details=_multiple_validation_details(error),
        )
    except ArquivoValidacaoError as error:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
            details=[{"field": "arquivo", "message": str(error)}],
        )
    except EmailDuplicadoError:
        return _error_response(
            status_code=409,
            code="EMAIL_ALREADY_REGISTERED",
            message="E-mail já cadastrado no sistema",
        )
    except CadastroDuplicadoError:
        return _error_response(
            status_code=409,
            code="REGISTRATION_CONFLICT",
            message="Não foi possível concluir o cadastro devido a dados já existentes",
        )
    except CadastroValidationError as error:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
            details=[{"field": error.field, "message": str(error)}],
        )
    except HTTPException:
        raise
    except ValueError as error:
        return _internal_error_response(error, context="cadastro")
    except Exception as error:
        return _internal_error_response(error, context="cadastro")


@cadastro_router.post(
    "/cadastrar-json",
    response_model=CadastroSucessoDTO,
    status_code=201,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Cadastrar Usuário via JSON",
)
async def cadastrar_usuario_json(
    data: CadastroUsuarioDTO,
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
    hasher=Depends(get_hasher),
    token_service=Depends(get_token_service),
):
    try:
        use_case = CriarUsuarioUseCase(repository, hasher, token_service, arquivo_repository=arquivo_repository)
        return use_case.execute(data)
    except EmailAlreadyRegisteredError:
        return _error_response(
            status_code=409,
            code="EMAIL_ALREADY_REGISTERED",
            message="E-mail já cadastrado no sistema",
        )
    except ValidacaoMultiplaError as error:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
            details=_multiple_validation_details(error),
        )
    except ArquivoValidacaoError as error:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
            details=[{"field": "arquivo", "message": str(error)}],
        )
    except EmailDuplicadoError:
        return _error_response(
            status_code=409,
            code="EMAIL_ALREADY_REGISTERED",
            message="E-mail já cadastrado no sistema",
        )
    except CadastroDuplicadoError:
        return _error_response(
            status_code=409,
            code="REGISTRATION_CONFLICT",
            message="Não foi possível concluir o cadastro devido a dados já existentes",
        )
    except CadastroValidationError as error:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
            details=[{"field": error.field, "message": str(error)}],
        )
    except HTTPException:
        raise
    except ValueError as error:
        return _internal_error_response(error, context="cadastro-json")
    except Exception as error:
        return _internal_error_response(error, context="cadastro-json")


# Aliases para retrocompatibilidade
@cadastro_router.post(
    "/cadastro",
    response_model=CadastroSucessoDTO,
    status_code=201,
    responses=CADASTRO_ERROR_RESPONSES,
    include_in_schema=False,
)
@cadastro_router.post(
    "/register",
    response_model=CadastroSucessoDTO,
    status_code=201,
    responses=CADASTRO_ERROR_RESPONSES,
    include_in_schema=False,
)
async def cadastrar_usuario_alias(
    data: CadastroUsuarioDTO,
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
    hasher=Depends(get_hasher),
    token_service=Depends(get_token_service),
):
    return await cadastrar_usuario_json(data, repository, arquivo_repository, hasher, token_service)


@router.patch(
    "/alunos/{aluno_id}/aprovar",
    response_model=AprovacaoAlunoResponseDTO,
)
async def aprovar_aluno(
    aluno_id: int,
    repository=Depends(get_repository),
    current_user: Annotated[dict, Depends(require_roles(CargoEnum.ADMINISTRADOR.value))] = None,
):
    try:
        use_case = AprovarAlunoUseCase(repository)
        return use_case.execute(aluno_id=aluno_id, novo_status=StatusCadastroEnum.ATIVADO)
    except HTTPException:
        raise
    except ValueError as error:
        if "não encontrado" in str(error).lower():
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        raise HTTPException(status_code=400, detail="Dados inválidos")
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno ao aprovar o cadastro do aluno")


@router.patch(
    "/alunos/{aluno_id}/status",
    response_model=AprovacaoAlunoResponseDTO,
)
async def atualizar_status_aluno(
    aluno_id: int,
    data: AtualizarStatusAlunoDTO,
    repository=Depends(get_repository),
    current_user: Annotated[dict, Depends(require_roles(CargoEnum.ADMINISTRADOR.value))] = None,
):
    try:
        use_case = AprovarAlunoUseCase(repository)
        return use_case.execute(aluno_id=aluno_id, novo_status=data.status_cadastro, motivo_reprovacao=data.motivo_reprovacao)
    except HTTPException:
        raise
    except ValueError as error:
        if "não encontrado" in str(error).lower():
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        raise HTTPException(status_code=400, detail="Dados inválidos")
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno ao atualizar o status do aluno")


@router.get(
    "/verificar-email/{email:path}",
)
async def verificar_email(
    email: str,
    repository=Depends(get_repository),
):
    try:
        usuario = repository.buscar_por_email(email.lower().strip())
        return {"existe": usuario is not None}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno ao verificar o e-mail")


@router.get(
    "/me",
    response_model=PerfilAlunoResponseDTO,
)
async def obter_meu_perfil(
    current_user: Annotated[dict, Depends(require_roles(CargoEnum.ALUNO.value))],
    repository=Depends(get_repository),
):
    try:
        user_id = current_user.get("current_user_id")
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


@edicao_router.patch(
    "/me/email",
    response_model=UsuarioResponseDTO,
    responses=EDICAO_ERROR_RESPONSES,
    summary="Redefinir E-mail do Aluno Autenticado",
    description="Permite alterar o e-mail da conta se a senha atual for fornecida e estiver correta."
)
async def atualizar_email_autenticado(
    data: RedefinirEmailDTO,
    current_user: Annotated[dict, Depends(require_roles(CargoEnum.ALUNO.value))],
    repository=Depends(get_repository),
    hasher=Depends(get_hasher),
):
    try:
        user_id = current_user.get("current_user_id")
        if not isinstance(user_id, int) or isinstance(user_id, bool):
            raise HTTPException(status_code=401, detail="Sessão inválida")

        use_case = RedefinirEmailUseCase(repository, hasher)
        return use_case.execute(user_id, data)
    except RedefinirEmailValidationError as error:
        if error.code == "VALIDATION_ERROR":
            return _error_response(
                status_code=error.status_code,
                code=error.code,
                message="Dados inválidos",
                details=[{"field": error.field, "message": str(error)}],
            )
        return _error_response(
            status_code=error.status_code,
            code=error.code,
            message=str(error),
        )
    except ValueError as error:
        if "não encontrado" in str(error).lower():
            return _error_response(
                status_code=404,
                code="RESOURCE_NOT_FOUND",
                message="Usuário não encontrado",
            )
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
        )
    except HTTPException:
        raise
    except Exception as error:
        return _internal_error_response(error, context="edicao-email")


@edicao_router.patch(
    "/me",
    response_model=AtualizarAlunoDTO,
    responses=EDICAO_ERROR_RESPONSES,
    summary="Atualizar Perfil do Aluno",
    description="Permite que o aluno autenticado atualize parcialmente seus dados (bairro e telefone)."
)
async def atualizar_meu_perfil(
    data: AtualizarAlunoDTO,
    current_user: Annotated[dict, Depends(require_roles(CargoEnum.ALUNO.value))],
    repository=Depends(get_repository),
):
    try:
        user_id = current_user.get("current_user_id")
        if not isinstance(user_id, int) or isinstance(user_id, bool):
            raise HTTPException(status_code=401, detail="Sessão inválida")

        use_case = AtualizarAlunoUseCase(repository)
        return use_case.execute(user_id, data)
    except AtualizarAlunoValidationError as error:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
            details=[{"field": error.field, "message": str(error)}],
        )
    except ValueError as error:
        if "não encontrado" in str(error).lower():
            return _error_response(
                status_code=404,
                code="RESOURCE_NOT_FOUND",
                message="Usuário não encontrado",
            )
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Dados inválidos",
        )
    except HTTPException:
        raise
    except Exception as error:
        return _internal_error_response(error, context="edicao-perfil")

router.include_router(cadastro_router)
router.include_router(edicao_router)
