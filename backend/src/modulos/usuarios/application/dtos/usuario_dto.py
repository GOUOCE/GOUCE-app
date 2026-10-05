from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.enums.tipo_documento_reenvio_enum import TipoDocumentoReenvioEnum
from src.shared.enums.turno_curso_enum import TurnoCursoEnum
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

    bairro_id: str = Field(min_length=1, max_length=20)
    telefone: str = Field(min_length=1, max_length=20)
    faculdade_id: str = Field(min_length=1, max_length=150)
    curso: str = Field(min_length=1, max_length=150)
    campus: str | None = Field(default=None, max_length=150)
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
    faculdade_id: str = Field(min_length=1, max_length=150)
    campus: str = Field(min_length=1, max_length=150)
    bairro_id: str = Field(min_length=1, max_length=20)
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
    model_config = ConfigDict(populate_by_name=True)

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
        description="Motivo geral da rejeição. Use junto com status_cadastro=rejeitado.",
    )
    documentos_reenvio: list[DocumentoReenvioSolicitadoDTO] | None = Field(
        default=None,
        description=(
            "Documentos específicos que o aluno deverá reenviar. "
            "Obrigatório quando status_cadastro=rejeitado."
        ),
    )

    @model_validator(mode="after")
    def validar_dados_de_rejeicao(self):
        if self.status_cadastro == StatusCadastroEnum.REJEITADO:
            if not self.motivo_reprovacao or not self.motivo_reprovacao.strip():
                raise ValueError(
                    "motivo_reprovacao é obrigatório quando status_cadastro é rejeitado."
                )
            if not self.documentos_reenvio:
                raise ValueError(
                    "documentos_reenvio é obrigatório quando status_cadastro é rejeitado."
                )
        elif self.motivo_reprovacao or self.documentos_reenvio:
            raise ValueError(
                "motivo_reprovacao e documentos_reenvio só devem ser informados "
                "quando status_cadastro é rejeitado."
            )
        return self


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
    faculdade_id: str | None = None
    campus: str | None = None
    bairro_id: str | None = None
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
    bairro_id: str | None = Field(default=None, max_length=20, description="Novo ID do bairro")
