import re

file_path = 'backend/src/modulos/usuarios/interface/http/aluno_router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Etapa 1 route
etapa_1_new = """
@router.post(
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
        # Execute basic validations
        use_case.execute(dto)

        # Validate file
        if foto_perfil is not None and getattr(foto_perfil, "filename", None):
            conteudo = await foto_perfil.read()
            erro_arquivo = validar_regras_arquivo(foto_perfil.filename, foto_perfil.content_type, conteudo)
            if erro_arquivo:
                raise ValidacaoMultiplaError([{"field": "foto_perfil", "message": erro_arquivo}])

        return CadastroSucessoDTO(message="Etapa 1 validada com sucesso", data={"status_cadastro": "em_andamento"})
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 1", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 1")
        return _internal_error_response()
"""

# Replace the Etapa 4 route
etapa_4_new = """
@router.post(
    "/validar-etapa-4",
    response_model=CadastroSucessoDTO,
    status_code=200,
    responses=CADASTRO_ERROR_RESPONSES,
    summary="Validar Etapa 4: Documentação",
    description="Valida comprovante de matrícula e comprovante de residência."
)
async def validar_etapa_4_cadastro_usuario(
    comprovante_matricula: UploadFile | str | None = File(None),
    comprovante_residencia: UploadFile | str | None = File(None),
):
    try:
        erros = []
        
        # Validar Comprovante de Matrícula
        if not comprovante_matricula or not getattr(comprovante_matricula, "filename", None):
            erros.append({"field": "comprovante_matricula", "message": "Comprovante de matrícula é obrigatório"})
        else:
            conteudo_mat = await comprovante_matricula.read()
            erro_mat = validar_regras_arquivo(comprovante_matricula.filename, comprovante_matricula.content_type, conteudo_mat)
            if erro_mat:
                erros.append({"field": "comprovante_matricula", "message": erro_mat})
                
        # Validar Comprovante de Residência
        if not comprovante_residencia or not getattr(comprovante_residencia, "filename", None):
            erros.append({"field": "comprovante_residencia", "message": "Comprovante de residência é obrigatório"})
        else:
            conteudo_res = await comprovante_residencia.read()
            erro_res = validar_regras_arquivo(comprovante_residencia.filename, comprovante_residencia.content_type, conteudo_res)
            if erro_res:
                erros.append({"field": "comprovante_residencia", "message": erro_res})
                
        if erros:
            raise ValidacaoMultiplaError(erros)

        return CadastroSucessoDTO(message="Etapa 4 validada com sucesso", data={"status_cadastro": "em_andamento"})
    except ValidacaoMultiplaError as e:
        return _error_response(status_code=422, code="BUSINESS_VALIDATION_ERROR", message="Erros de validação encontrados na Etapa 4", details=e.erros)
    except Exception as e:
        logger.exception("Erro ao validar etapa 4")
        return _internal_error_response()
"""

# We need to inject the alidar_regras_arquivo function
helper_func = """
def validar_regras_arquivo(nome_original: str, content_type: str, conteudo_bytes: bytes) -> str | None:
    MIME_TYPES_PERMITIDOS = {"application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"}
    if not conteudo_bytes:
        return "O arquivo enviado está vazio"
    if len(conteudo_bytes) > 10 * 1024 * 1024:
        return f"O arquivo excede o tamanho máximo permitido de 10MB"
    ct = (content_type or "application/octet-stream").lower().strip()
    extensao = nome_original.split(".")[-1].lower() if "." in nome_original else ""
    if extensao in ["pdf"]:
        ct = "application/pdf"
    elif extensao in ["png", "jpg", "jpeg", "webp"]:
        ct = f"image/{'jpeg' if extensao == 'jpg' else extensao}"
        
    if ct not in MIME_TYPES_PERMITIDOS and extensao not in ["pdf", "png", "jpg", "jpeg", "webp"]:
        return "Formato de arquivo inválido. Apenas PDF e Imagens (PNG, JPG, JPEG, WEBP) são permitidos."
    return None
"""

content = re.sub(r'@router\.post\(\s*"/validar-etapa-1"[\s\S]*?(?=@router\.post\(\s*"/validar-etapa-2")', etapa_1_new + "\n\n", content)
content = re.sub(r'@router\.post\(\s*"/validar-etapa-4"[\s\S]*', etapa_4_new + "\n", content)

content = content.replace("logger = logging.getLogger(__name__)", "logger = logging.getLogger(__name__)\n\n" + helper_func)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
