import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Etapa 1 route body
content = re.sub(
    r'@router\.post\(\s*"/validar-etapa-1"[\s\S]*?(?=@router\.post\(\s*"/validar-etapa-2")',
    '''@router.post(
    "/validar-etapa-1",
    response_model=CadastroSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 1: Dados básicos",
    description="Valida foto, nome, data de nascimento, e-mail, senha e confirmação de senha."
)
async def validar_etapa_1_cadastro_usuario(
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    confirmar_senha: str = Form(...),
    data_nascimento: str = Form(...),
    foto_perfil: UploadFile | str | None = File(None),
    repository=Depends(get_repository),
):
    try:
        dto = ValidarEtapa1CadastroUsuarioDTO(
            nome=nome,
            email=email,
            senha=senha,
            confirmar_senha=confirmar_senha,
            data_nascimento=data_nascimento
        )
    except ValidationError as error:
        return _error_response(
            status_code=422,
            code="REQUEST_VALIDATION_ERROR",
            message="Requisição inválida",
            details=_validation_details(error.errors()),
        )

    try:
        use_case = ValidarEtapa1UsuarioUseCase(repository=repository)
        
        arq_foto = None
        if foto_perfil and getattr(foto_perfil, "filename", None):
            arq_foto = (foto_perfil.filename, foto_perfil.content_type, await foto_perfil.read())

        return use_case.execute(dto, arquivo_foto=arq_foto)
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 1", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 1")
        return _internal_error_response()

''',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
