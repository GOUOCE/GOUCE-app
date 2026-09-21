import uuid
from src.shared.security.lgpd_encryption import encrypt_bytes
from src.modulos.arquivos.application.dtos.arquivo_dto import ArquivoResponseDTO
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM

MIME_TYPES_PERMITIDOS = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


class ArquivoValidacaoError(ValueError):
    """Indica uma rejeição controlada dos dados do arquivo enviado."""


class SalvarArquivoUseCase:
    def __init__(self, repository, storage_service):
        self.repository = repository
        self.storage_service = storage_service

    def execute(
        self,
        conteudo_bytes: bytes,
        nome_original: str,
        content_type: str | None = None
    ) -> ArquivoResponseDTO:
        if not conteudo_bytes:
            raise ArquivoValidacaoError("O arquivo enviado está vazio")

        tamanho_maximo = 10 * 1024 * 1024  # 10MB
        if len(conteudo_bytes) > tamanho_maximo:
            raise ArquivoValidacaoError(f"O arquivo '{nome_original}' excede o tamanho máximo permitido de 10MB")

        ct = (content_type or "application/octet-stream").lower().strip()
        
        # Extensão de fallback para o nome original
        extensao = nome_original.split(".")[-1].lower() if "." in nome_original else ""
        if extensao in ["pdf"]:
            ct = "application/pdf"
        elif extensao in ["png", "jpg", "jpeg", "webp"]:
            ct = f"image/{'jpeg' if extensao == 'jpg' else extensao}"

        if ct not in MIME_TYPES_PERMITIDOS and extensao not in ["pdf", "png", "jpg", "jpeg", "webp"]:
            raise ArquivoValidacaoError("Formato de arquivo inválido. Apenas arquivos PDF e Imagens (PNG, JPG, JPEG, WEBP) são permitidos.")

        arquivo_id = str(uuid.uuid4())
        nome_objeto_minio = f"{arquivo_id}_{nome_original.replace(' ', '_')}"

        conteudo_criptografado = encrypt_bytes(conteudo_bytes)
        url_arquivo = self.storage_service.salvar_arquivo(conteudo_criptografado, nome_objeto_minio, ct)

        arquivo_orm = ArquivoORM(
            id=arquivo_id,
            nome=nome_original,
            url=url_arquivo,
            content_type=ct,
            tamanho_bytes=len(conteudo_bytes),
        )

        salvo = self.repository.salvar(arquivo_orm)

        return ArquivoResponseDTO(
            id=salvo.id,
            nome=salvo.nome,
            url=salvo.url,
            content_type=salvo.content_type,
            tamanho_bytes=salvo.tamanho_bytes,
        )
