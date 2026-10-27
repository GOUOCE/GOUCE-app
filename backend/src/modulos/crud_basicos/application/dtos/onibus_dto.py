from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class CriarOnibusDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    placa: str = Field(..., alias="placa_onibus", min_length=1, max_length=20)
    assentos: int = Field(..., alias="qtd_assentos", ge=0, le=2147483647)
    capacidade_em_pe: int = Field(..., alias="capacidade_maxima", ge=0, le=2147483647)
    apelido: Optional[str] = Field(default=None, alias="apelido_onibus", max_length=100)
    id_foto_onibus: Optional[str] = Field(default=None, alias="foto_onibus", max_length=36)

    @model_validator(mode="before")
    @classmethod
    def normalizar_chaves_criar(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        dados = dict(data)
        if "placa" not in dados and "placa_onibus" in dados:
            dados["placa"] = dados["placa_onibus"]
        if "assentos" not in dados:
            if "qtd_assentos" in dados:
                dados["assentos"] = dados["qtd_assentos"]
            elif "quantidade_assentos" in dados:
                dados["assentos"] = dados["quantidade_assentos"]
        if "capacidade_em_pe" not in dados:
            if "capacidade_maxima" in dados:
                dados["capacidade_em_pe"] = dados["capacidade_maxima"]
            elif "capacidade_alunos_em_pe" in dados:
                dados["capacidade_em_pe"] = dados["capacidade_alunos_em_pe"]
            elif "capacidade_maxima_alunos_em_pe" in dados:
                dados["capacidade_em_pe"] = dados["capacidade_maxima_alunos_em_pe"]
        if "apelido" not in dados and "apelido_onibus" in dados:
            dados["apelido"] = dados["apelido_onibus"]
        if "id_foto_onibus" not in dados and "foto_onibus" in dados:
            dados["id_foto_onibus"] = dados["foto_onibus"]
        return dados

    @field_validator("assentos", "capacidade_em_pe", mode="before")
    @classmethod
    def validar_limite_inteiro_criar(cls, valor: object) -> object:
        if valor is None:
            return valor
        try:
            v_num = int(valor)
            if v_num > 2147483647:
                raise ValueError("O valor informado excede o limite máximo permitido.")
            return v_num
        except (ValueError, TypeError):
            raise ValueError("Informe um valor numérico válido dentro do limite permitido.")

    @field_validator("placa", mode="before")
    @classmethod
    def validar_placa(cls, valor: object) -> str:
        if valor is None:
            raise ValueError("A placa do veículo é obrigatória.")
        valor_str = str(valor).strip().upper()
        if not valor_str:
            raise ValueError("A placa do veículo é obrigatória.")
        return valor_str

    @field_validator("apelido", mode="before")
    @classmethod
    def normalizar_apelido(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip()
        return valor_str if valor_str else None


class AtualizarOnibusDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    placa: Optional[str] = Field(default=None, alias="placa_onibus", max_length=20)
    assentos: Optional[int] = Field(default=None, alias="qtd_assentos", ge=0, le=2147483647)
    capacidade_em_pe: Optional[int] = Field(default=None, alias="capacidade_maxima", ge=0, le=2147483647)
    apelido: Optional[str] = Field(default=None, alias="apelido_onibus", max_length=100)
    ativo: Optional[bool] = None
    id_foto_onibus: Optional[str] = Field(default=None, alias="foto_onibus", max_length=36)

    @model_validator(mode="before")
    @classmethod
    def normalizar_chaves_atualizar(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        dados = dict(data)
        if "placa" not in dados and "placa_onibus" in dados:
            dados["placa"] = dados["placa_onibus"]
        if "assentos" not in dados:
            if "qtd_assentos" in dados:
                dados["assentos"] = dados["qtd_assentos"]
            elif "quantidade_assentos" in dados:
                dados["assentos"] = dados["quantidade_assentos"]
        if "capacidade_em_pe" not in dados:
            if "capacidade_maxima" in dados:
                dados["capacidade_em_pe"] = dados["capacidade_maxima"]
            elif "capacidade_alunos_em_pe" in dados:
                dados["capacidade_em_pe"] = dados["capacidade_alunos_em_pe"]
            elif "capacidade_maxima_alunos_em_pe" in dados:
                dados["capacidade_em_pe"] = dados["capacidade_maxima_alunos_em_pe"]
        if "apelido" not in dados and "apelido_onibus" in dados:
            dados["apelido"] = dados["apelido_onibus"]
        if "id_foto_onibus" not in dados and "foto_onibus" in dados:
            dados["id_foto_onibus"] = dados["foto_onibus"]
        return dados

    @field_validator("assentos", "capacidade_em_pe", mode="before")
    @classmethod
    def validar_limite_inteiro_atualizar(cls, valor: object) -> object:
        if valor is None:
            return valor
        try:
            v_num = int(valor)
            if v_num > 2147483647:
                raise ValueError("O valor informado excede o limite máximo permitido.")
            return v_num
        except (ValueError, TypeError):
            raise ValueError("Informe um valor numérico válido dentro do limite permitido.")

    @field_validator("placa", mode="before")
    @classmethod
    def validar_placa_opcional(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip().upper()
        if not valor_str:
            raise ValueError("A placa do veículo não pode ser vazia.")
        return valor_str

    @field_validator("apelido", mode="before")
    @classmethod
    def normalizar_apelido_opcional(cls, valor: object) -> Optional[str]:
        if valor is None:
            return None
        valor_str = str(valor).strip()
        return valor_str if valor_str else None


class OnibusResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    placa: str
    assentos: int
    capacidade_em_pe: int
    placa_onibus: str
    qtd_assentos: int
    capacidade_maxima: int
    apelido: Optional[str] = None
    apelido_onibus: Optional[str] = None
    ativo: bool
    id_foto_onibus: Optional[str] = None
    foto_onibus: Optional[str] = None


class OperacaoOnibusResponseDTO(BaseModel):
    success: bool = True
    message: str = "Operação realizada com sucesso"
    data: Optional[OnibusResponseDTO] = None
