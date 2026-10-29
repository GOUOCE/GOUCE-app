from src.modulos.auth.api.http.auth_routes import router as auth_router
from backend.src.modulos.usuarios.interface.http.usuario_routes import router as usuario_router

# Router unificado mantido para retrocompatibilidade se necessário
router = auth_router
