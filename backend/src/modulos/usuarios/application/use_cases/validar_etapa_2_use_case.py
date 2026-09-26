
# -*- coding: utf-8 -*-
from src.modulos.usuarios.application.dtos.usuario_dto import (
    ValidacaoSucessoDTO,
    CadastroSucessoDTO,
    CadastroValidationDetailDTO,
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
        raca_val = dto.raca.value if dto.raca else ""
        if not raca_val:
            erros.append({"field": "raca", "message": "Raça é obrigatória"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_raca(raca_val)
            if not is_valid:
                erros.append({"field": "raca", "message": "Raça inválida. Selecione uma opção válida."})

        # Validação de Identidade Sexual
        sexual_val = dto.identificacao_sexual.value if dto.identificacao_sexual else ""
        if not sexual_val:
            erros.append({"field": "identificacao_sexual", "message": "Identidade sexual é obrigatória"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_identidade_sexual(sexual_val)
            if not is_valid:
                erros.append({"field": "identificacao_sexual", "message": "Identidade sexual inválida. Selecione uma opção válida."})

        # Validação de Identificação de Gênero
        genero_val = dto.identificacao_genero.value if dto.identificacao_genero else ""
        if not genero_val:
            erros.append({"field": "identificacao_genero", "message": "Identificação de gênero é obrigatória"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_genero(genero_val)
            if not is_valid:
                erros.append({"field": "identificacao_genero", "message": "Identificação de gênero inválida. Selecione uma opção válida."})

        # Validação de Transgênero
        trans_val = dto.transgenero.value if dto.transgenero else ""
        if not trans_val:
            erros.append({"field": "transgenero", "message": "Informe se você é transgênero"})
        else:
            is_valid, _ = self.demograficos_validator.validar_e_formatar_sim_nao_prefiro(trans_val)
            if not is_valid:
                erros.append({"field": "transgenero", "message": "Valor inválido para transgênero. Use Sim, Não ou Prefiro não dizer."})

        # Validação de Tem Filhos
       
        if dto.tem_filhos == None:
            erros.append({"field": "tem_filhos", "message": "Informe se você tem filhos"})

        if erros:
            raise ValidacaoMultiplaError(erros)

        return ValidacaoSucessoDTO(
            success=True,
            message="Etapa 2 validada com sucesso",
            data=CadastroValidationDetailDTO(
                field=None,
                message="Sem erros"
            )
        )
