import json
import os
from functools import lru_cache
from dotenv import load_dotenv
from minio import Minio

load_dotenv()


@lru_cache(maxsize=1)
def get_minio_client() -> Minio:
    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
    secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    secure = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
    region = os.getenv("MINIO_REGION", "us-east-1")

    return Minio(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure,
        region=region,
    )


@lru_cache(maxsize=1)
def get_minio_public_client() -> Minio:
    endpoint = os.getenv("MINIO_PUBLIC_HOST", "localhost:9000")
    access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
    secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    secure = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
    region = os.getenv("MINIO_REGION", "us-east-1")

    return Minio(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure,
        region=region,
    )




def ensure_bucket_exists(bucket_name: str | None = None) -> None:
    if not bucket_name:
        bucket_name = os.getenv("MINIO_BUCKET", "gouce-arquivos")

    try:
        client = get_minio_client()
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            print(f"✓ Bucket MinIO '{bucket_name}' criado com sucesso (bucket privado)")
        else:
            try:
                client.delete_bucket_policy(bucket_name)
            except Exception:
                pass
        print(f"✓ Bucket MinIO '{bucket_name}' configurado como PRIVADO")
    except Exception as e:
        print(f"Aviso ao inicializar bucket MinIO '{bucket_name}': {e}")
