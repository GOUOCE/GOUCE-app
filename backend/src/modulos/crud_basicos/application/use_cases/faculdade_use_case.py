from src.modulos.crud_basicos.application.services.faculdade_service import (
    FaculdadeService,
    FaculdadeValidationError,
)

FaculdadeUseCase = FaculdadeService

__all__ = ["FaculdadeService", "FaculdadeUseCase", "FaculdadeValidationError"]
