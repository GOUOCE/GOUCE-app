# -*- coding: utf-8 -*-
import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add new DTO imports
content = content.replace(
    'ValidarEtapa1CadastroUsuarioDTO,',
    'ValidarEtapa1CadastroUsuarioDTO,\n    ValidarEtapa2CadastroUsuarioDTO,\n    ValidarEtapa3CadastroUsuarioDTO,\n    ValidarEtapa4CadastroUsuarioDTO,'
)

# Add Use Case imports
content = content.replace(
    'from src.modulos.usuarios.application.use_cases.validar_etapa_1_use_case import ValidarEtapa1UsuarioUseCase',
    '''from src.modulos.usuarios.application.use_cases.validar_etapa_1_use_case import ValidarEtapa1UsuarioUseCase
from src.modulos.usuarios.application.use_cases.validar_etapa_2_use_case import ValidarEtapa2UsuarioUseCase
from src.modulos.usuarios.application.use_cases.validar_etapa_3_use_case import ValidarEtapa3UsuarioUseCase
from src.modulos.usuarios.application.use_cases.validar_etapa_4_use_case import ValidarEtapa4UsuarioUseCase'''
)

# Replace the existing route with the 4 routes
new_routes = """
@aluno_router.post(
    "/validar-etapa-1",
    response_model=CadastroSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 1: Dados básicos",
    description="Valida foto, nome, data de nascimento, e-mail, senha e confirmação de senha."
)
async def validar_etapa_1_cadastro_usuario(
    dto: ValidarEtapa1CadastroUsuarioDTO,
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
):
    try:
        use_case = ValidarEtapa1UsuarioUseCase(
            repository=repository,
            arquivo_repository=arquivo_repository
        )
        return use_case.execute(dto)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 1", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 1")
        return _internal_error_response()


@aluno_router.post(
    "/validar-etapa-2",
    response_model=CadastroSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 2: Perfil demográfico",
    description="Valida raça, identidade sexual, gênero, se é transgênero e se tem filhos."
)
async def validar_etapa_2_cadastro_usuario(
    dto: ValidarEtapa2CadastroUsuarioDTO,
):
    try:
        use_case = ValidarEtapa2UsuarioUseCase()
        return use_case.execute(dto)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 2", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 2")
        return _internal_error_response()


@aluno_router.post(
    "/validar-etapa-3",
    response_model=CadastroSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 3: Contato e vínculo",
    description="Valida bairro, telefone, instituição, curso, campus, período de ingresso, turno e semestre atual."
)
async def validar_etapa_3_cadastro_usuario(
    dto: ValidarEtapa3CadastroUsuarioDTO,
):
    try:
        use_case = ValidarEtapa3UsuarioUseCase()
        return use_case.execute(dto)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 3", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 3")
        return _internal_error_response()


@aluno_router.post(
    "/validar-etapa-4",
    response_model=CadastroSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 4: Documentação",
    description="Valida comprovante de matrícula e comprovante de residência."
)
async def validar_etapa_4_cadastro_usuario(
    dto: ValidarEtapa4CadastroUsuarioDTO,
    arquivo_repository=Depends(get_arquivo_repository),
):
    try:
        use_case = ValidarEtapa4UsuarioUseCase(arquivo_repository=arquivo_repository)
        return use_case.execute(dto)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 4", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 4")
        return _internal_error_response()
"""

# The existing route looks like:
# @aluno_router.post(
#     "/validar-etapa-1",
# ...
# async def validar_etapa_1_cadastro_usuario(
# ...
#     except Exception:
#         return _internal_error_response()

content = re.sub(r'@aluno_router\.post\(\s*"/validar-etapa-1"[\s\S]*', new_routes, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
