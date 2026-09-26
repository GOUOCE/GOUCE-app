from src.modulos.usuarios.application.dtos.usuario_dto import (
    ValidacaoSucessoDTO,
    CadastroSucessoDTO,
    CadastroValidationDetailDTO
)
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import ValidacaoMultiplaError

def validar_regras_arquivo(nome_original: str, content_type: str, conteudo_bytes: bytes) -> str | None:
    MIME_TYPES_PERMITIDOS = {"application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"}
    if not conteudo_bytes:
        return "O arquivo enviado está vazio"
    if len(conteudo_bytes) > 10 * 1024 * 1024:
        return "O arquivo excede o tamanho máximo permitido de 10MB"
    ct = (content_type or "application/octet-stream").lower().strip()
    extensao = nome_original.split(".")[-1].lower() if "." in nome_original else ""
    if ct not in MIME_TYPES_PERMITIDOS and extensao not in ["pdf", "png", "jpg", "jpeg", "webp"]:
        return "Formato de arquivo inválido. Apenas PDF e Imagens (PNG, JPG, JPEG, WEBP) são permitidos."
    return None

class ValidarEtapa4UsuarioUseCase:
    def execute(self, arquivo_mat: tuple | None, arquivo_res: tuple | None) -> CadastroSucessoDTO:
        erros = []

        if not arquivo_mat:
            erros.append({"field": "comprovante_matricula", "message": "Comprovante de matrícula é obrigatório"})
        else:
            erro = validar_regras_arquivo(arquivo_mat[0], arquivo_mat[1], arquivo_mat[2])
            if erro:
                erros.append({"field": "comprovante_matricula", "message": erro})

        if not arquivo_res:
            erros.append({"field": "comprovante_residencia", "message": "Comprovante de residência é obrigatório"})
        else:
            erro = validar_regras_arquivo(arquivo_res[0], arquivo_res[1], arquivo_res[2])
            if erro:
                erros.append({"field": "comprovante_residencia", "message": erro})

        if erros:
            raise ValidacaoMultiplaError(erros)

        return ValidacaoSucessoDTO(
            success=True,
            message="Etapa 4 validada com sucesso",
            data=CadastroValidationDetailDTO(
                field=None,
                message="Sem erros"
            )
        )