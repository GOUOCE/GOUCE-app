from functools import wraps
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.datastructures import FormData

from src.modulos.arquivos.application.use_cases.salvar_arquivo_use_case import (
    ArquivoValidacaoError,
    SalvarArquivoUseCase,
)
from src.modulos.arquivos.infrastructure.repositories.arquivo_repository import SQLAlchemyArquivoRepository
from src.modulos.arquivos.infrastructure.services.minio_storage import MinioStorageService
from src.modulos.crud_basicos.application.dtos.onibus_dto import (
    AtualizarOnibusDTO,
    CriarOnibusDTO,
    OnibusResponseDTO,
    OperacaoOnibusResponseDTO,
)
from src.modulos.crud_basicos.application.services.onibus_service import (
    OnibusService,
    OnibusValidationError,
)
from src.modulos.crud_basicos.infrastructure.repositories.onibus_repository import (
    OnibusJaAtivado,
    OnibusJaCadastradoError,
    OnibusJaDesativado,
    OnibusNaoEncontradoError,
    OnibusRepository,
)
from src.shared.auth.dependencies import get_optional_current_user, require_roles
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.http.validation import validation_details
from src.shared.infrastructure.db import get_session


def _error_response(status_code: int, code: str, message: str, details=None):
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "detail": message,
            "error": error,
        },
    )


class OnibusValidationRoute(APIRoute):
    def get_route_handler(self):
        original_route_handler = super().get_route_handler()

        @wraps(original_route_handler)
        async def custom_route_handler(request: Request):
            try:
                content_type = request.headers.get("content-type", "")
                if content_type.startswith("application/json"):
                    try:
                        body = await request.json()
                    except Exception:
                        body = None

                    if isinstance(body, dict):
                        items = []
                        alias_map = {
                            "qtd_assentos": "assentos",
                            "quantidade_assentos": "assentos",
                            "capacidade_maxima": "capacidade_em_pe",
                            "capacidade_alunos_em_pe": "capacidade_em_pe",
                            "capacidade_maxima_alunos_em_pe": "capacidade_em_pe",
                            "apelido_onibus": "apelido",
                            "placa_onibus": "placa",
                            "foto_onibus": "id_foto_onibus",
                        }
                        for k, v in body.items():
                            if v is not None:
                                key = alias_map.get(k, k)
                                items.append((key, str(v)))
                        request._form = FormData(items)

                return await original_route_handler(request)
            except (RequestValidationError, ValidationError) as error:
                return _error_response(
                    422,
                    "REQUEST_VALIDATION_ERROR",
                    "Requisição inválida",
                    validation_details(error.errors()),
                )
            except HTTPException as error:
                code_by_status = {
                    400: "VALIDATION_ERROR",
                    401: "UNAUTHORIZED",
                    403: "FORBIDDEN",
                    404: "RESOURCE_NOT_FOUND",
                    409: "CONFLICT",
                    422: "REQUEST_VALIDATION_ERROR",
                    500: "INTERNAL_ERROR",
                    503: "SERVICE_UNAVAILABLE",
                }
                detail = error.detail
                message = str(detail) if detail else "Requisição inválida"
                return _error_response(
                    error.status_code,
                    code_by_status.get(error.status_code, "REQUEST_ERROR"),
                    message,
                )

        return custom_route_handler


router = APIRouter(
    prefix="/onibus",
    tags=["Ônibus"],
    route_class=OnibusValidationRoute,
)


def get_repository(session: Annotated[Session, Depends(get_session)]) -> OnibusRepository:
    return OnibusRepository(session)


def get_service(
    repository: Annotated[OnibusRepository, Depends(get_repository)]
) -> OnibusService:
    return OnibusService(repository)


def get_arquivo_repository(
    session: Annotated[Session, Depends(get_session)]
) -> SQLAlchemyArquivoRepository:
    return SQLAlchemyArquivoRepository(session)


def get_storage_service() -> MinioStorageService:
    return MinioStorageService()


admin_required = require_roles(CargoEnum.ADMINISTRADOR.value)


def _usuario_executor_id(current_user: dict) -> Optional[int]:
    user_id = current_user.get("current_user_id") or current_user.get("sub")
    return int(user_id) if user_id is not None else None


def is_admin_user(user: Optional[dict]) -> bool:
    if not user:
        return False
    roles = user.get("current_roles") or []
    if isinstance(roles, str):
        roles = [roles]
    role = user.get("current_role") or user.get("role")
    if role and role not in roles:
        roles = list(roles) + [role]
    return CargoEnum.ADMINISTRADOR.value in roles


def _montar_resposta_operacao(
    onibus, message: str = "Operação realizada com sucesso"
) -> OperacaoOnibusResponseDTO:
    return OperacaoOnibusResponseDTO(
        success=True,
        message=message,
        data=OnibusResponseDTO.model_validate(onibus),
    )


@router.get("", response_model=list[OnibusResponseDTO])
async def listar_onibus(
    ativo: Optional[bool] = Query(default=None),
    limite: Optional[int] = Query(default=None, ge=1),
    offset: Optional[int] = Query(default=None, ge=0),
    service: OnibusService = Depends(get_service),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    
    if not is_admin_user(current_user):
        ativo = True
    return service.listar(ativo=ativo,limite=limite, offset=offset)


@router.get("/{placa}", response_model=OnibusResponseDTO)
async def buscar_onibus(
    placa: str,
    service: OnibusService = Depends(get_service),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    try:
        onibus = service.buscar_por_placa(placa)
        if not is_admin_user(current_user) and not onibus.ativo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ônibus não encontrado.",
            )
        return onibus
    except OnibusNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ônibus não encontrado.",
        )
    except OnibusValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )


@router.post(
    "",
    response_model=OperacaoOnibusResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar Ônibus (com foto via Swagger/Form ou JSON)",
    description=(
        "Cadastra um novo ônibus. Permite envio de foto diretamente pelo Swagger "
        "(arquivo de imagem) ou via JSON informando id_foto_onibus."
    ),
)
async def criar_onibus(
    placa: str = Form(..., description="Placa do ônibus"),
    assentos: int = Form(..., description="Quantidade de assentos", ge=0),
    capacidade_em_pe: int = Form(None, description="Capacidade máxima de alunos em pé"),
    apelido: Optional[str] = Form(None, description="Apelido do veículo"),
    id_foto_onibus: Optional[str] = Form(None, description="UUID da foto já cadastrada em arquivos"),
    foto: Optional[UploadFile] = File(None, description="Arquivo de imagem da foto do ônibus"),
    service: OnibusService = Depends(get_service),
    arquivo_repository: SQLAlchemyArquivoRepository = Depends(get_arquivo_repository),
    storage_service: MinioStorageService = Depends(get_storage_service),
    current_user: dict = Depends(admin_required),
):
    try:

        if capacidade_em_pe is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A capacidade em pé é obrigatória."
            )

        id_foto_onibus = id_foto_onibus.strip() or None if id_foto_onibus is not None else None

        dto = CriarOnibusDTO(
            placa=placa,
            assentos=assentos,
            capacidade_em_pe=capacidade_em_pe,
            apelido=apelido,
            id_foto_onibus=id_foto_onibus,
        )

        foto_id = dto.id_foto_onibus
        if foto is not None and getattr(foto, "filename", None) and callable(getattr(foto, "read", None)):
            conteudo_foto = await foto.read()
            if conteudo_foto:
                salvar_uc = SalvarArquivoUseCase(arquivo_repository, storage_service)
                res_foto = salvar_uc.execute(
                    conteudo_bytes=conteudo_foto,
                    nome_original=foto.filename or f"foto_{dto.placa}",
                    content_type=foto.content_type,
                )
                foto_id = res_foto.id

        onibus = service.criar(
            placa=dto.placa,
            qtd_assentos=dto.assentos,
            capacidade_maxima=dto.capacidade_em_pe,
            apelido=dto.apelido,
            id_foto_onibus=foto_id,
            usuario_executor_id=_usuario_executor_id(current_user),
        )
        return _montar_resposta_operacao(onibus, "Operação realizada com sucesso")
    except OnibusJaCadastradoError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except ArquivoValidacaoError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except OnibusValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este veículo já está registrado.",
        )


@router.patch(
    "/{placa}",
    response_model=OperacaoOnibusResponseDTO,
    summary="Atualizar Ônibus (com foto opcional)",
    description="Permite atualizar os dados do veículo e/ou enviar nova foto via upload no Swagger.",
)
async def atualizar_onibus(
    placa: str,
    nova_placa: Optional[str] = Form(None, alias="placa", description="Nova placa"),
    assentos: Optional[int] = Form(None, description="Quantidade de assentos", ge=0),
    capacidade_em_pe: Optional[int] = Form(None, description="Capacidade máxima em pé", ge=0),
    apelido: Optional[str] = Form(None, description="Apelido do veículo"),
    ativo: Optional[bool] = Form(None, description="Status de ativação"),
    id_foto_onibus: Optional[str] = Form(None, description="UUID da foto do ônibus"),
    foto: Optional[UploadFile] = File(None, description="Novo arquivo de imagem para foto do ônibus"),
    service: OnibusService = Depends(get_service),
    arquivo_repository: SQLAlchemyArquivoRepository = Depends(get_arquivo_repository),
    storage_service: MinioStorageService = Depends(get_storage_service),
    current_user: dict = Depends(admin_required),
):
    try:
        dto = AtualizarOnibusDTO(
            placa=nova_placa,
            assentos=assentos,
            capacidade_em_pe=capacidade_em_pe,
            apelido=apelido,
            ativo=ativo,
            id_foto_onibus=id_foto_onibus,
        )

        foto_id = dto.id_foto_onibus
        if foto is not None and getattr(foto, "filename", None) and callable(getattr(foto, "read", None)):
            conteudo_foto = await foto.read()
            if conteudo_foto:
                salvar_uc = SalvarArquivoUseCase(arquivo_repository, storage_service)
                res_foto = salvar_uc.execute(
                    conteudo_bytes=conteudo_foto,
                    nome_original=foto.filename or f"foto_{placa}",
                    content_type=foto.content_type,
                )
                foto_id = res_foto.id

        onibus = service.atualizar(
            placa_atual=placa,
            nova_placa=dto.placa,
            qtd_assentos=dto.assentos,
            capacidade_maxima=dto.capacidade_em_pe,
            apelido=dto.apelido,
            ativo=dto.ativo,
            id_foto_onibus=foto_id,
            usuario_executor_id=_usuario_executor_id(current_user),
        )
        return _montar_resposta_operacao(onibus, "Operação realizada com sucesso")
    except OnibusNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ônibus não encontrado.",
        )
    except OnibusJaCadastradoError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except ArquivoValidacaoError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except OnibusValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este veículo já está registrado.",
        )


@router.post(
    "/{placa}/foto",
    response_model=OperacaoOnibusResponseDTO,
    summary="Upload de Foto do Ônibus pelo Swagger",
    description="Permite enviar diretamente o arquivo da foto do ônibus via Swagger.",
)
async def upload_foto_onibus(
    placa: str,
    foto: UploadFile = File(..., description="Arquivo de imagem da foto do ônibus (PNG, JPG, JPEG, WEBP)"),
    service: OnibusService = Depends(get_service),
    arquivo_repository: SQLAlchemyArquivoRepository = Depends(get_arquivo_repository),
    storage_service: MinioStorageService = Depends(get_storage_service),
    current_user: dict = Depends(admin_required),
):
    try:
        conteudo_foto = await foto.read()
        salvar_uc = SalvarArquivoUseCase(arquivo_repository, storage_service)
        res_foto = salvar_uc.execute(
            conteudo_bytes=conteudo_foto,
            nome_original=foto.filename or f"foto_{placa}",
            content_type=foto.content_type,
        )

        onibus = service.atualizar(
            placa_atual=placa,
            id_foto_onibus=res_foto.id,
            usuario_executor_id=_usuario_executor_id(current_user),
        )
        return _montar_resposta_operacao(onibus, "Foto do ônibus enviada com sucesso")
    except OnibusNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ônibus não encontrado.",
        )
    except ArquivoValidacaoError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
    except OnibusValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )


@router.delete(
    "/{placa}/foto",
    response_model=OperacaoOnibusResponseDTO,
    summary="Remover Foto do Ônibus",
    description="Remove o vínculo da foto do veículo.",
)
async def remover_foto_onibus(
    placa: str,
    service: OnibusService = Depends(get_service),
    current_user: dict = Depends(admin_required),
):
    try:
        onibus = service.atualizar(
            placa_atual=placa,
            remover_foto=True,
            usuario_executor_id=_usuario_executor_id(current_user),
        )
        return _montar_resposta_operacao(onibus, "Foto do ônibus removida com sucesso")
    except OnibusNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ônibus não encontrado.",
        )
    except OnibusValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )


@router.patch(
    "/{placa}/ativar",
    response_model=OperacaoOnibusResponseDTO,
)
@router.patch(
    "/{placa}/reativar",
    response_model=OperacaoOnibusResponseDTO,
    include_in_schema=False,
)
async def ativar_onibus(
    placa: str,
    current_user: dict = Depends(admin_required),
    service: OnibusService = Depends(get_service),
):
    try:
        onibus = service.ativar(
            placa=placa,
            usuario_executor_id=_usuario_executor_id(current_user),
        )
        return _montar_resposta_operacao(onibus, "Operação realizada com sucesso")
    except OnibusNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ônibus não encontrado.",
        )
    except (OnibusJaAtivado, OnibusJaDesativado) as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )
    except OnibusValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )


@router.patch(
    "/{placa}/inativar",
    response_model=OperacaoOnibusResponseDTO,
)
async def inativar_onibus(
    placa: str,
    current_user: dict = Depends(admin_required),
    service: OnibusService = Depends(get_service),
):
    try:
        onibus = service.inativar(
            placa=placa,
            usuario_executor_id=_usuario_executor_id(current_user),
        )
        return _montar_resposta_operacao(onibus, "Operação realizada com sucesso")
    except OnibusNaoEncontradoError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ônibus não encontrado.",
        )
    except (OnibusJaAtivado, OnibusJaDesativado) as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )
    except OnibusValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )
