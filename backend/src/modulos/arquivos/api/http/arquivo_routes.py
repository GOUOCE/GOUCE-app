from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from src.shared.infrastructure.db import get_session
from src.modulos.arquivos.application.dtos.arquivo_dto import ArquivoResponseDTO, ArquivoPresignedUrlDTO
from src.modulos.arquivos.application.use_cases.salvar_arquivo_use_case import SalvarArquivoUseCase
from src.modulos.arquivos.infrastructure.repositories.arquivo_repository import SQLAlchemyArquivoRepository
from src.modulos.arquivos.infrastructure.services.minio_storage import MinioStorageService

router = APIRouter(prefix="/arquivos", tags=["Arquivos"])


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return SQLAlchemyArquivoRepository(session)


def get_storage_service():
    return MinioStorageService()


@router.post(
    "/upload",
    response_model=ArquivoResponseDTO,
    status_code=201,
    summary="Upload de Arquivo (PDF ou Imagem)",
    description="Realiza upload de um comprovante ou arquivo no MinIO, salva o registro com UUID na tabela 'arquivos' e retorna a URL."
)
async def upload_arquivo(
    file: UploadFile = File(...),
    repository=Depends(get_repository),
    storage_service=Depends(get_storage_service),
):
    try:
        conteudo = await file.read()
        use_case = SalvarArquivoUseCase(repository, storage_service)
        return use_case.execute(conteudo, file.filename or "arquivo", file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao realizar upload do arquivo: {str(e)}")


from src.shared.auth.dependencies import verify_any_user

@router.get(
    "/{arquivo_id}",
    response_model=ArquivoResponseDTO,
    summary="Obter Detalhes do Arquivo por UUID",
    description="Retorna as informações do arquivo pelo seu UUID. Requer autenticação."
)
async def obter_arquivo(
    arquivo_id: str,
    repository=Depends(get_repository),
    current_user: Annotated[dict, Depends(verify_any_user)] = None,
):
    arquivo = repository.buscar_por_id(arquivo_id)
    if not arquivo:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    return ArquivoResponseDTO(
        id=arquivo.id,
        nome=arquivo.nome,
        url=arquivo.url,
        content_type=arquivo.content_type,
        tamanho_bytes=arquivo.tamanho_bytes,
    )


@router.get(
    "/{arquivo_id}/url-assinada",
    response_model=ArquivoPresignedUrlDTO,
    summary="Gerar URL Assinada Temporária (Presigned URL)",
    description="Gera uma URL temporária com assinatura válida por 15 minutos (ou tempo customizado) para acesso ao arquivo no MinIO. Requer autenticação."
)
async def obter_url_assinada(
    arquivo_id: str,
    expira_em_segundos: int = 900,
    repository=Depends(get_repository),
    storage_service=Depends(get_storage_service),
    current_user: Annotated[dict, Depends(verify_any_user)] = None,
):
    arquivo = repository.buscar_por_id(arquivo_id)
    if not arquivo:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    try:
        nome_objeto = arquivo.url.split(f"/{storage_service.bucket_name}/", 1)[-1]
        url_assinada = storage_service.gerar_url_presigned(nome_objeto, expira_em_segundos=expira_em_segundos)
        return ArquivoPresignedUrlDTO(
            id=arquivo.id,
            nome=arquivo.nome,
            url_assinada=url_assinada,
            expira_em_segundos=expira_em_segundos,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar URL assinada: {str(e)}")


from src.shared.security.lgpd_encryption import decrypt_bytes

@router.get(
    "/{arquivo_id}/view",
    summary="Visualizar Conteúdo do Arquivo por UUID (Descriptografado em tempo real)",
    description="Retorna o arquivo PDF ou Imagem descriptografado em tempo de execução. Requer autenticação."
)
@router.get(
    "/{arquivo_id}/download",
    summary="Download do Arquivo por UUID",
    include_in_schema=False
)
async def visualizar_arquivo(
    arquivo_id: str,
    repository=Depends(get_repository),
    storage_service=Depends(get_storage_service),
    current_user: Annotated[dict, Depends(verify_any_user)] = None,
):
    arquivo = repository.buscar_por_id(arquivo_id)
    if not arquivo:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    try:
        nome_objeto = arquivo.url.split(f"/{storage_service.bucket_name}/", 1)[-1]
        bytes_cifrados = storage_service.obter_bytes_arquivo(nome_objeto)
        bytes_descriptografados = decrypt_bytes(bytes_cifrados)
        
        media_type = arquivo.content_type or "application/octet-stream"
        disposition = f'inline; filename="{arquivo.nome}"'
        
        return Response(
            content=bytes_descriptografados,
            media_type=media_type,
            headers={"Content-Disposition": disposition}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao visualizar arquivo: {str(e)}")

