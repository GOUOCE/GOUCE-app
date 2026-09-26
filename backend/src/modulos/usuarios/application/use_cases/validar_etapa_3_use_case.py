# -*- coding: utf-8 -*-
from src.modulos.usuarios.application.dtos.usuario_dto import (
    ValidacaoSucessoDTO,
    CadastroSucessoDTO,
    ValidarEtapa3CadastroUsuarioDTO,
    CadastroValidationDetailDTO
)
from src.shared.validators.periodo_ingresso_validator import PeriodoIngressoValidator
from src.shared.validators.telefone_validator import TelefoneValidator
from src.shared.validators.turno_curso_validator import TurnoCursoValidator
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import ValidacaoMultiplaError

class ValidarEtapa3UsuarioUseCase:
    def __init__(
        self,
        telefone_validator=None,
        periodo_ingresso_validator=None,
        turno_curso_validator=None,
    ):
        self.telefone_validator = telefone_validator or TelefoneValidator()
        self.periodo_ingresso_validator = periodo_ingresso_validator or PeriodoIngressoValidator()
        self.turno_curso_validator = turno_curso_validator or TurnoCursoValidator()

    def execute(self, dto: ValidarEtapa3CadastroUsuarioDTO) -> CadastroSucessoDTO:
        erros = []

        # Validação de Bairro
        bairro_id = str(dto.bairro_id).strip() if dto.bairro_id else ""
        if not bairro_id:
            erros.append({"field": "bairro_id", "message": "Bairro é obrigatório"})

        # Validação de Telefone / Celular com DDD
        telefone = str(dto.telefone).strip() if dto.telefone else ""
        if not telefone:
            erros.append({"field": "telefone", "message": "Telefone é obrigatório"})
        elif not self.telefone_validator.validar_telefone(telefone):
            erros.append({"field": "telefone", "message": "Telefone celular inválido. Informe um número celular válido com DDD (ex: 11987654321)"})

        # Validação de Instituição / Faculdade
        faculdade_id = str(dto.faculdade_id).strip() if dto.faculdade_id else ""
        if not faculdade_id or len(faculdade_id) < 2:
            erros.append({"field": "faculdade_id", "message": "Instituição/Faculdade é obrigatória"})

        # Validação de Curso
        curso = str(dto.curso).strip() if dto.curso else ""
        if not curso or len(curso) < 2:
            erros.append({"field": "curso", "message": "O nome do curso é obrigatório"})

        # Validação de Campus
        campus = str(dto.campus).strip() if dto.campus else ""
        if not campus:
            erros.append({"field": "campus", "message": "O campus é obrigatório"})

        # Validação do Período de Ingresso
        if not dto.periodo_ingresso or not str(dto.periodo_ingresso).strip():
            erros.append({"field": "periodo_ingresso", "message": "Período de ingresso é obrigatório"})
        else:
            try:
                self.periodo_ingresso_validator.validar_e_formatar(str(dto.periodo_ingresso).strip())
            except ValueError as e:
                erros.append({"field": "periodo_ingresso", "message": str(e)})

        # Validação de Turno do Curso
        turno_curso_str = str(dto.turno_curso).strip() if dto.turno_curso else ""
        if not turno_curso_str:
            erros.append({"field": "turno_curso", "message": "O turno do curso é obrigatório"})
        else:
            is_valid, _ = self.turno_curso_validator.validar_e_formatar(turno_curso_str)
            if not is_valid:
                erros.append({"field": "turno_curso", "message": "Turno do curso inválido. Opções permitidas: Matutino, Vespertino, Noturno ou Integral"})

        # Validação de Semestre Atual
        if dto.semestre_atual is None:
            erros.append({"field": "semestre_atual", "message": "Semestre atual é obrigatório"})
        elif not isinstance(dto.semestre_atual, int) or dto.semestre_atual < 1 or dto.semestre_atual > 16:
            erros.append({"field": "semestre_atual", "message": "O semestre atual deve ser um número inteiro entre 1 e 16"})

        if erros:
            raise ValidacaoMultiplaError(erros)

        return ValidacaoSucessoDTO(
            success=True,
            message="Etapa 3 validada com sucesso",
            data=CadastroValidationDetailDTO(
                field=None,
                message="Sem erros"
            )
        )