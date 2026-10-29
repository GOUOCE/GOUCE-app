# -*- coding: utf-8 -*-
from src.shared.enums.demograficos_enum import (
    IdentidadeSexualEnum,
    RacaEnum,
    IdentificacaoGeneroEnum,
    SimNaoPrefiroEnum,
)

class DemograficosValidator:
    @classmethod
    def _normalizar(cls, valor: str | None, enum_class) -> tuple[bool, str | None]:
        if not valor or not str(valor).strip():
            return False, None
        v_clean = str(valor).strip().lower()
        for member in enum_class:
            if member.value.lower() == v_clean:
                return True, member.value
        return False, None

    @classmethod
    def validar_e_formatar_identidade_sexual(cls, valor: str | None) -> tuple[bool, str | None]:
        return cls._normalizar(valor, IdentidadeSexualEnum)

    @classmethod
    def validar_e_formatar_raca(cls, valor: str | None) -> tuple[bool, str | None]:
        return cls._normalizar(valor, RacaEnum)

    @classmethod
    def validar_e_formatar_genero(cls, valor: str | None) -> tuple[bool, str | None]:
        return cls._normalizar(valor, IdentificacaoGeneroEnum)

    @classmethod
    def validar_e_formatar_sim_nao_prefiro(cls, valor: str | None) -> tuple[bool, str | None]:
        return cls._normalizar(valor, SimNaoPrefiroEnum)

    @classmethod
    def converter_sim_nao_para_bool(cls, valor: str | None) -> bool | None:
        is_valid, formatado = cls.validar_e_formatar_sim_nao_prefiro(valor)
        if not is_valid:
            return None
        if formatado == SimNaoPrefiroEnum.SIM.value:
            return True
        if formatado == SimNaoPrefiroEnum.NAO.value:
            return False
        # PREFIRO_NAO_DIZER maps to None (or could be left untouched if DB supports string, but DB has Boolean)
        return None
