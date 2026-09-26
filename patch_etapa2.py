import re

file_path = 'backend/src/modulos/usuarios/application/use_cases/validar_etapa_2_use_case.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = """
# -*- coding: utf-8 -*-
from src.modulos.usuarios.application.dtos.usuario_dto import (
    CadastroDataDTO,
    CadastroSucessoDTO,
    ValidarEtapa2CadastroUsuarioDTO,
)
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import ValidacaoMultiplaError
from src.shared.validators.demograficos_validator import DemograficosValidator

class ValidarEtapa2UsuarioUseCase:
    def __init__(self, demograficos_validator=None):
        self.demograficos_validator = demograficos_validator or DemograficosValidator()

    def execute(self, dto: ValidarEtapa2CadastroUsuarioDTO) -> CadastroSucessoDTO:
        erros = []

        # Validação de Raça
        raca_str = str(dto.raca).strip() if dto.raca else ""
        if not raca_str:
            erros.append({"field": "raca", "message": "Raça é obrigatória"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_raca(raca_str)
            if not is_valid:
                erros.append({"field": "raca", "message": "Raça inválida. Selecione uma opção válida."})

        # Validação de Identidade Sexual
        sexual_str = str(dto.identificacao_sexual).strip() if dto.identificacao_sexual else ""
        if not sexual_str:
            erros.append({"field": "identificacao_sexual", "message": "Identidade sexual é obrigatória"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_identidade_sexual(sexual_str)
            if not is_valid:
                erros.append({"field": "identificacao_sexual", "message": "Identidade sexual inválida. Selecione uma opção válida."})

        # Validação de Identificação de Gênero
        genero_str = str(dto.identificacao_genero).strip() if dto.identificacao_genero else ""
        if not genero_str:
            erros.append({"field": "identificacao_genero", "message": "Identificação de gênero é obrigatória"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_genero(genero_str)
            if not is_valid:
                erros.append({"field": "identificacao_genero", "message": "Identificação de gênero inválida. Selecione uma opção válida."})

        # Validação de Transgênero
        trans_str = str(dto.transgenero).strip() if dto.transgenero is not None else ""
        if not trans_str:
            erros.append({"field": "transgenero", "message": "Informe se você é transgênero"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_sim_nao_prefiro(trans_str)
            if not is_valid:
                erros.append({"field": "transgenero", "message": "Valor inválido para transgênero. Use Sim, Não ou Prefiro não dizer."})

        # Validação de Tem Filhos
        filhos_str = str(dto.tem_filhos).strip() if dto.tem_filhos is not None else ""
        if not filhos_str:
            erros.append({"field": "tem_filhos", "message": "Informe se você tem filhos"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_sim_nao_prefiro(filhos_str)
            if not is_valid:
                erros.append({"field": "tem_filhos", "message": "Valor inválido para filhos. Use Sim, Não ou Prefiro não dizer."})

        if erros:
            raise ValidacaoMultiplaError(erros)

        return CadastroSucessoDTO(
            message="Etapa 2 validada com sucesso",
            data=CadastroDataDTO(id=0, nome="", email="", status_cadastro="em_andamento")
        )
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
