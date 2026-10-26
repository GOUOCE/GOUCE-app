from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.modulos.auth.api.http.auth_routes import router as auth_router
from src.modulos.usuarios.interface.http.usuario_routes import router as usuario_router
from src.modulos.usuarios.interface.http.aluno_router import router as aluno_router
from src.modulos.usuarios.interface.http.administrador_routes import router as administrador_router
from src.modulos.usuarios.interface.http.representante_routes import router as representante_router
from src.modulos.motoristas.interface.http.motorista_routes import router as motorista_router
from src.modulos.arquivos.api.http.arquivo_routes import router as arquivo_router
from src.modulos.arquivos.infrastructure.services.minio_client import ensure_bucket_exists
from src.modulos.crud_basicos.interface.http.faculdade_routes import router as faculdade_router
from src.modulos.crud_basicos.interface.http.onibus_routes import router as onibus_router
from src.modulos.crud_basicos.interface.http.bairro_routes import router as bairro_router
from src.modulos.rotas.interface.http.rota_principal_routes import router as rota_principal_router

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
        "frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_bucket_exists()

app.include_router(auth_router)
app.include_router(usuario_router)
app.include_router(arquivo_router)
app.include_router(aluno_router)
app.include_router(administrador_router)
app.include_router(representante_router)
app.include_router(faculdade_router)
app.include_router(onibus_router)
app.include_router(motorista_router)
app.include_router(bairro_router)
app.include_router(rota_principal_router)


@app.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "ok"}
