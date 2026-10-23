from src.modulos.crud_basicos.application.services.onibus_service import (
    OnibusService,
    OnibusValidationError,
)

OnibusUseCase = OnibusService

__all__ = ["OnibusService", "OnibusUseCase", "OnibusValidationError"]
