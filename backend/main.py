from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.modulos.auth.api.http.auth_routes import router as auth_router
from src.modulos.usuarios.interface.http.usuario_routes import router as usuario_router
from src.modulos.usuarios.interface.http.aluno_router import router as aluno_router
from src.modulos.arquivos.api.http.arquivo_routes import router as arquivo_router
from src.modulos.arquivos.infrastructure.services.minio_client import ensure_bucket_exists
from src.shared.infrastructure.db import Base, engine, create_tables, sync_schema

app = FastAPI(
    title="API GOUCE",
    version="1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()
sync_schema()
ensure_bucket_exists()

app.include_router(auth_router)
app.include_router(usuario_router)
app.include_router(arquivo_router)
app.include_router(aluno_router)


@app.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "ok"}
