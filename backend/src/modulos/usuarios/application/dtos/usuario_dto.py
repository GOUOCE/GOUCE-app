from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, ValidationInfo, field_validator
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.enums.tipo_documento_reenvio_enum import TipoDocumentoReenvioEnum
from src.shared.enums.turno_curso_enum import TurnoCursoEnum
from src.shared.validators.id_localidade_validator import IdLocalidade
from src.shared.enums.demograficos_enum import (
    RacaEnum,
    IdentidadeSexualEnum,
    IdentificacaoGeneroEnum,
    SimNaoPrefiroEnum
)


class ValidarEtapa1CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id_foto_aluno: str | None = Field(default=None, max_length=36)
    nome: str = Field(min_length=3, max_length=150)
    data_nascimento: str | int | float | date | datetime | None = None
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)
    confirmar_senha: str = Field(min_length=8, max_length=128)

class ValidarEtapa2CadastroUsuarioDTO(BaseModel):

    model_config = ConfigDict(populate_by_name=True)
    raca: RacaEnum | None = None
    identificacao_sexual: IdentidadeSexualEnum | None = None
    identificacao_genero: IdentificacaoGeneroEnum | None = None
    transgenero: SimNaoPrefiroEnum | None = None
    tem_filhos: bool | None = None

class ValidarEtapa3CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    bairro_id: IdLocalidade
    telefone: str = Field(min_length=1, max_length=20)
    faculdade_id: IdLocalidade
    curso: str = Field(min_length=1, max_length=150)
    periodo_ingresso: str = Field(min_length=1, max_length=20)
    turno_curso: TurnoCursoEnum | str | None = None
    semestre_atual: int

class ValidarEtapa4CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id_comprovante_matricula: str = Field(default="", max_length=255)
    id_comprovante_residencia: str = Field(default="", max_length=255)

class CadastroUsuarioDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome: str = Field(min_length=3, max_length=150)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)
    telefone: str = Field(min_length=1, max_length=20)
    faculdade_id: IdLocalidade
    bairro_id: IdLocalidade
    id_comprovante_matricula: str = Field(default="", max_length=255)
    id_comprovante_residencia: str = Field(default="", max_length=255)
    data_nascimento: str | int | float | date | datetime | None = None
    identificacao_genero: str = Field(min_length=1, max_length=500)
    transgenero: str = Field(min_length=1, max_length=500)
    tem_filhos: bool
    curso: str = Field(min_length=1, max_length=150)
    semestre_atual: int
    periodo_ingresso: str = Field(min_length=1, max_length=20)
    turno_curso: str | None = None
    raca: str = Field(min_length=1, max_length=50)
    validade_acesso: datetime | None = None
    id_foto_aluno: str | None = Field(default=None, max_length=36)
    identificacao_sexual: str | None = Field(default=None, max_length=100)
    motivo_reprovacao: str | None = Field(default=None, max_length=255)
    termos_de_uso: bool = False
    consentimento_lgpd_em: datetime | None = None
    versao_termos: str | None = Field(default="1.0", max_length=20)



# Alias para retrocompatibilidade se necessário
RegisterDTO = CadastroUsuarioDTO


class UsuarioResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    nome_completo: str
    email: str
    telefone: str | None = None


class UsuarioNomeEmailResponseDTO(BaseModel):
    nome: str
    email: str


class DocumentoReenvioRespostaDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tipo: str
    motivo: str


class DocumentoReenvioSolicitadoDTO(BaseModel):
    # Sem o strip, um motivo só com espaços passava pelo min_length e era descartado em silêncio depois.
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    tipo: TipoDocumentoReenvioEnum = Field(
        description="Tipo do documento que deve ser reenviado pelo aluno.",
        json_schema_extra={
            "examples": [
                "comprovante_matricula",
                "comprovante_residencia",
                "foto_perfil",
            ]
        },
    )
    motivo: str = Field(
        min_length=1,
        max_length=255,
        description="Motivo específico da rejeição deste documento.",
        json_schema_extra={"examples": ["Documento ilegível. Envie uma nova cópia."]},
    )


class AlunoResumoResponseDTO(BaseModel):
    id: int
    nome: str
    email: str
    faculdade: str
    sigla: str | None = None
    campus: str | None = None
    status_cadastro: str
    data_hora_envio_analise: datetime | None = None
    data_hora_ultima_renovacao_matricula: datetime | None = None
    motivo_reprovacao: str | None = None
    documentos_reenvio: list[DocumentoReenvioRespostaDTO] | None = None


class AtualizarStatusAlunoDTO(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "examples": [
                {
                    "status_cadastro": "rejeitado",
                    "motivo_reprovacao": "Documentos precisam ser reenviados.",
                    "documentos_reenvio": [
                        {
                            "tipo": "comprovante_matricula",
                            "motivo": "Documento ilegível. Envie uma nova cópia.",
                        },
                        {
                            "tipo": "comprovante_residencia",
                            "motivo": "Comprovante fora do prazo de validade.",
                        },
                    ],
                },
            ]
        },
    )

    status_cadastro: StatusCadastroEnum = Field(
        default=StatusCadastroEnum.ATIVADO,
        description="Novo status do cadastro do aluno.",
    )
    motivo_reprovacao: str | None = Field(
        default=None,
        max_length=255,
        validate_default=True,
        description="Motivo geral da rejeição. Use junto com status_cadastro=rejeitado.",
    )
    documentos_reenvio: list[DocumentoReenvioSolicitadoDTO] | None = Field(
        default=None,
        validate_default=True,
        description=(
            "Documentos específicos que o aluno deverá reenviar. "
            "Obrigatório quando status_cadastro=rejeitado."
        ),
    )

    # Validação por campo (e não no modelo) para o erro 422 apontar qual campo foi recusado.
    @field_validator("motivo_reprovacao")
    @classmethod
    def validar_motivo_reprovacao(cls, valor: str | None, info: ValidationInfo) -> str | None:
        valor = valor.strip() if valor else None
        status = info.data.get("status_cadastro")
        if status is None:
            return valor
        if status == StatusCadastroEnum.REJEITADO:
            if not valor:
                raise ValueError("Informe o motivo da reprovação.")
        elif valor:
            raise ValueError("O motivo da reprovação só pode ser informado ao reprovar o cadastro.")
        return valor

    @field_validator("documentos_reenvio")
    @classmethod
    def validar_documentos_reenvio(
        cls,
        valor: list[DocumentoReenvioSolicitadoDTO] | None,
        info: ValidationInfo,
    ) -> list[DocumentoReenvioSolicitadoDTO] | None:
        status = info.data.get("status_cadastro")
        if status is None:
            return valor
        if status == StatusCadastroEnum.REJEITADO:
            if not valor:
                raise ValueError("Informe ao menos um documento para o aluno reenviar, com o motivo.")
        elif valor:
            raise ValueError("Os documentos para reenvio só podem ser informados ao reprovar o cadastro.")
        return valor


class AprovacaoAlunoResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    aluno_id: int
    status_cadastro: str
    motivo_reprovacao: str | None = None
    documentos_reenvio: list[DocumentoReenvioRespostaDTO] | None = None
    mensagem: str


class AprovarAlunoResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    aluno_id: int
    status_cadastro: str
    mensagem: str


class CadastroDataDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    nome: str
    email: str
    status_cadastro: str = "pendente"


class CadastroSucessoDTO(BaseModel):
    success: Literal[True] = True
    message: str = "Cadastro enviado para análise da coordenação"
    data: CadastroDataDTO


class CadastroValidationDetailDTO(BaseModel):
    field: str | None = None
    message: str

class ValidacaoSucessoDTO(BaseModel):
    success: Literal[True] = True
    message: str = "Validação ocorrida com sucesso"
    data: CadastroValidationDetailDTO  

class CadastroErrorDTO(BaseModel):
    code: str
    message: str
    details: list[CadastroValidationDetailDTO] | None = None


class CadastroErrorResponseDTO(BaseModel):
    success: Literal[False] = False
    error: CadastroErrorDTO


class PerfilAlunoResponseDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    nome: str
    email: str
    telefone: str | None = None
    data_criacao: datetime
    status_cadastro: str
    faculdade_id: int | None = None
    faculdade: str | None = None
    nome_faculdade: str | None = None
    sigla: str | None = None
    sigla_faculdade: str | None = None
    campus: str | None = None
    bairro: str | None = Field(default=None, validation_alias="bairro_id")
    curso: str | None = None
    semestre_atual: int | None = None
    periodo_ingresso: str | None = None
    turno_curso: str | None = None
    data_nascimento: str | int | float | date | datetime | None = None
    identificacao_genero: IdentificacaoGeneroEnum | None = None
    transgenero: SimNaoPrefiroEnum | None = None
    raca: RacaEnum | None = None
    identificacao_sexual: str | None = None
    tem_filhos: bool | None = None
    raca: str | None = None
    identificacao_sexual: str | None = None
    tem_filhos: str | bool | None = None
    id_foto_aluno: str | None = None
    validade_acesso: datetime | None = None
    acesso_expirado: bool = False
    motivo_reprovacao: str | None = None
    id_comprovante_matricula: str | None = None
    id_comprovante_residencia: str | None = None
    nome_comprovante_matricula: str | None = None
    nome_comprovante_residencia: str | None = None


class AdminAlunoDetalhesResponseDTO(PerfilAlunoResponseDTO):
    """Dados seguros e completos de um aluno para consulta administrativa."""

    transgenero: SimNaoPrefiroEnum | str | None = None
    documentos_reenvio: list[DocumentoReenvioRespostaDTO] | None = None
    data_hora_envio_analise: datetime | None = None
    data_hora_ultima_renovacao_matricula: datetime | None = None
    termos_de_uso: bool | None = None
    consentimento_lgpd_em: datetime | None = None
    versao_termos: str | None = None


class RedefinirEmailDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    novo_email: EmailStr
    senha: str = Field(..., description="Senha atual do usuário para validação")


class AtualizarAlunoDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    telefone: str | None = Field(default=None, max_length=20, description="Novo telefone do aluno")
    bairro_id: int | str | None = Field(default=None, max_length=20, description="Novo ID do bairro")
