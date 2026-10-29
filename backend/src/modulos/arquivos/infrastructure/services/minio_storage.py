import os
from io import BytesIO
from src.modulos.arquivos.infrastructure.services.minio_client import (
    get_minio_client,
    get_minio_public_client,
    ensure_bucket_exists,
)


class MinioStorageService:
    def __init__(self, bucket_name: str | None = None):
        self.bucket_name = bucket_name or os.getenv("MINIO_BUCKET", "gouce-arquivos")
        ensure_bucket_exists(self.bucket_name)

    def salvar_arquivo(self, conteudo: bytes, nome_objeto: str, content_type: str | None = None) -> str:
        client = get_minio_client()
        stream = BytesIO(conteudo)
        
        client.put_object(
            bucket_name=self.bucket_name,
            object_name=nome_objeto,
            data=stream,
            length=len(conteudo),
            content_type=content_type or "application/octet-stream",
        )
        
        minio_endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        
        if "localhost" in minio_endpoint or "127.0.0.1" in minio_endpoint:
            url_publica = f"http://{minio_endpoint}/{self.bucket_name}/{nome_objeto}"
        else:
            url_publica = f"http://localhost:9000/{self.bucket_name}/{nome_objeto}"

        return url_publica

    def gerar_url_presigned(self, nome_objeto: str, expira_em_segundos: int = 900) -> str:
        from datetime import timedelta
        # Usamos o cliente com o endpoint público (ex: localhost:9000) para que o hash SigV4 bata exatamente com o Host acessado pelo navegador
        client = get_minio_public_client()
        return client.presigned_get_object(
            bucket_name=self.bucket_name,
            object_name=nome_objeto,
            expires=timedelta(seconds=expira_em_segundos),
        )

    def obter_bytes_arquivo(self, nome_objeto: str) -> bytes:
        client = get_minio_client()
        response = client.get_object(self.bucket_name, nome_objeto)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def deletar_arquivo(self, nome_objeto: str) -> bool:
        try:
            client = get_minio_client()
            client.remove_object(self.bucket_name, nome_objeto)
            return True
        except Exception:
            return False
