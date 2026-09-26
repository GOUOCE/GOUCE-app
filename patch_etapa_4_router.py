import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Etapa 4 route body
content = re.sub(
    r'@router\.post\(\s*"/validar-etapa-4"[\s\S]*?(?=@router|$)',
    '''@router.post(
    "/validar-etapa-4",
    response_model=CadastroSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 4: Documentação",
    description="Valida tamanho e formato do comprovante de matrícula e comprovante de residência."
)
async def validar_etapa_4_cadastro_usuario(
    comprovante_matricula: UploadFile | str | None = File(None),
    comprovante_residencia: UploadFile | str | None = File(None),
):
    try:
        arq_mat = None
        if comprovante_matricula and getattr(comprovante_matricula, "filename", None):
            arq_mat = (comprovante_matricula.filename, comprovante_matricula.content_type, await comprovante_matricula.read())

        arq_res = None
        if comprovante_residencia and getattr(comprovante_residencia, "filename", None):
            arq_res = (comprovante_residencia.filename, comprovante_residencia.content_type, await comprovante_residencia.read())

        use_case = ValidarEtapa4UsuarioUseCase()
        return use_case.execute(arq_mat, arq_res)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 4", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 4")
        return _internal_error_response()
''',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
