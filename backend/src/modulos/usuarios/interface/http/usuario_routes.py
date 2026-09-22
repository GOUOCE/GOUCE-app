from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from src.shared.infrastructure.db import get_session
from src.shared.auth.dependencies import verify_any_user
from src.shared.auth.jwt_service import JWTService
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum

from src.modulos.usuarios.application.dtos.usuario_dto import (
    CadastroUsuarioDTO,
    CadastroSucessoDTO,
    AtualizarStatusAlunoDTO,
    AprovacaoAlunoResponseDTO,
    PerfilAlunoResponseDTO,
    RedefinirEmailDTO,
    UsuarioResponseDTO,
    AtualizarAlunoDTO,
)
from src.modulos.usuarios.application.use_cases.criar_usuario_use_case import CriarUsuarioUseCase, ValidacaoMultiplaError
from src.modulos.usuarios.application.use_cases.listar_usuarios_use_case import ListarUsuariosUseCase
from src.modulos.usuarios.application.use_cases.aprovar_aluno_use_case import AprovarAlunoUseCase
from src.modulos.usuarios.application.use_cases.obter_perfil_aluno_use_case import ObterPerfilAlunoUseCase
from src.modulos.usuarios.application.use_cases.redefinir_email_use_case import RedefinirEmailUseCase
from src.modulos.usuarios.application.use_cases.atualizar_aluno_use_case import AtualizarAlunoUseCase
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
    CadastroDuplicadoError,
)
from src.shared.validators.turno_curso_validator import TurnoCursoValidator

from src.modulos.arquivos.infrastructure.repositories.arquivo_repository import SQLAlchemyArquivoRepository
from src.modulos.arquivos.infrastructure.services.minio_storage import MinioStorageService
from src.modulos.arquivos.application.use_cases.salvar_arquivo_use_case import SalvarArquivoUseCase

router = APIRouter(prefix="/usuarios", tags=["Usuários e Alunos"])


def get_repository(session: Annotated[Session, Depends(get_session)]):
    return SQLAlchemyUsuarioRepository(session)


def get_arquivo_repository(session: Annotated[Session, Depends(get_session)]):
    return SQLAlchemyArquivoRepository(session)


def get_hasher():
    return Argon2PasswordHasher()


def get_token_service():
    return JWTService()


def get_storage_service():
    return MinioStorageService()


@router.get(
    "/",
    response_model=list[dict],
    summary="Listar Todos os Usuários e Alunos",
    description="Retorna a lista completa de usuários e alunos cadastrados. Requer autenticação por token JWT."
)
async def listar_usuarios(
    repository=Depends(get_repository),
    current_user: Annotated[dict, Depends(verify_any_user)] = None,
):
    try:
        use_case = ListarUsuariosUseCase(repository)
        return use_case.execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários e alunos: {str(e)}")


@router.get(
    "/alunos",
    response_model=list[dict],
    summary="Listar Todos os Alunos",
    description="Alias para listar todas as informações dos alunos. Requer autenticação por token JWT."
)
async def listar_alunos(
    repository=Depends(get_repository),
    current_user: Annotated[dict, Depends(verify_any_user)] = None,
):
    return await listar_usuarios(repository, current_user)


@router.post(
    "/cadastrar",
    response_model=CadastroSucessoDTO,
    status_code=201,
    summary="Cadastrar Usuário / Aluno com Upload Direto de Comprovantes (Opção 1)",
    description="Recebe os dados do aluno e os arquivos de comprovante de matrícula e residência via multipart/form-data. Faz upload automático para o MinIO, gera registros de arquivos com UUID e realiza o cadastro."
)
async def cadastrar_usuario_com_arquivos(
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    faculdade_id: str = Form(...),
    curso: str = Form(...),
    data_nascimento: str = Form(...),
    termos_de_uso: bool = Form(...),
    comprovante_matricula: UploadFile = File(..., description="Arquivo PDF ou Imagem do comprovante de matrícula"),
    comprovante_residencia: UploadFile = File(..., description="Arquivo PDF ou Imagem do comprovante de residência"),
    telefone: Optional[str] = Form(None),
    bairro_id: Optional[str] = Form(None),
    identificacao_genero: Optional[str] = Form(None),
    tem_filhos: Optional[bool] = Form(None),
    semestre_atual: Optional[int] = Form(None),
    periodo_ingresso: Optional[str] = Form(None),
    turno_curso: Optional[str] = Form(None),
    raca: Optional[str] = Form(None),
    identificacao_sexual: Optional[str] = Form(None),
    foto_perfil: UploadFile | str | None = File(None, description="Foto de perfil do aluno"),
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
    hasher=Depends(get_hasher),
    token_service=Depends(get_token_service),
    storage_service=Depends(get_storage_service),
):
    try:
        salvar_arquivo_uc = SalvarArquivoUseCase(arquivo_repository, storage_service)

        # Normaliza campos opcionais para evitar strings vazias vindas do Swagger/FormData
        telefone = telefone.strip() if isinstance(telefone, str) and telefone.strip() else None
        bairro_id = bairro_id.strip() if isinstance(bairro_id, str) and bairro_id.strip() else None
        identificacao_genero = identificacao_genero.strip() if isinstance(identificacao_genero, str) and identificacao_genero.strip() else None
        raca = raca.strip() if isinstance(raca, str) and raca.strip() else None
        identificacao_sexual = identificacao_sexual.strip() if isinstance(identificacao_sexual, str) and identificacao_sexual.strip() else None
        periodo_ingresso = periodo_ingresso.strip() if isinstance(periodo_ingresso, str) and periodo_ingresso.strip() else None
        turno_curso = TurnoCursoValidator().validar_e_formatar(turno_curso) if turno_curso is not None else None

        # 1. Upload do comprovante de matrícula
        conteudo_mat = await comprovante_matricula.read()
        res_mat = salvar_arquivo_uc.execute(
            conteudo_mat,
            comprovante_matricula.filename or "comprovante_matricula",
            comprovante_matricula.content_type,
        )

        # 2. Upload do comprovante de residência
        conteudo_res = await comprovante_residencia.read()
        res_res = salvar_arquivo_uc.execute(
            conteudo_res,
            comprovante_residencia.filename or "comprovante_residencia",
            comprovante_residencia.content_type,
        )

        # 3. Upload da foto de perfil (se fornecida)
        foto_id = None
        if foto_perfil is not None and getattr(foto_perfil, "filename", None):
            conteudo_foto = await foto_perfil.read()
            res_foto = salvar_arquivo_uc.execute(
                conteudo_foto,
                foto_perfil.filename or "foto_perfil",
                foto_perfil.content_type,
            )
            foto_id = res_foto.id

        # 4. Montar DTO de cadastro com os UUIDs gerados
        dto = CadastroUsuarioDTO(
            nome=nome,
            email=email,
            senha=senha,
            telefone=telefone,
            status_cadastro=StatusCadastroEnum.PENDENTE,
            faculdade_id=faculdade_id,
            bairro_id=bairro_id,
            id_comprovante_matricula=res_mat.id,
            id_comprovante_residencia=res_res.id,
            data_nascimento=data_nascimento,
            identificacao_genero=identificacao_genero,
            tem_filhos=tem_filhos,
            curso=curso,
            semestre_atual=semestre_atual,
            periodo_ingresso=periodo_ingresso,
            turno_curso=turno_curso,
            raca=raca,
            identificacao_sexual=identificacao_sexual,
            id_foto_aluno=foto_id,
            termos_de_uso=termos_de_uso,
        )

        use_case = CriarUsuarioUseCase(repository, hasher, token_service, arquivo_repository=arquivo_repository)
        return use_case.execute(dto)
    except CadastroDuplicadoError:
        raise HTTPException(
            status_code=409,
            detail="E-mail, telefone, faculdade ou bairro já cadastrado"
        )
    except ValidacaoMultiplaError as e:
        raise HTTPException(status_code=400, detail={"erros": e.erros})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao cadastrar usuário: {str(e)}")


@router.post(
    "/cadastrar-json",
    response_model=CadastroSucessoDTO,
    status_code=201,
    summary="Cadastrar Usuário via JSON (com UUIDs de arquivos já enviados)",
    description="Permite cadastrar usuário enviando JSON contendo os UUIDs dos comprovantes já carregados."
)
async def cadastrar_usuario_json(
    data: CadastroUsuarioDTO,
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
    hasher=Depends(get_hasher),
    token_service=Depends(get_token_service),
):
    try:
        use_case = CriarUsuarioUseCase(repository, hasher, token_service, arquivo_repository=arquivo_repository)
        return use_case.execute(data)
    except CadastroDuplicadoError:
        raise HTTPException(
            status_code=409,
            detail="E-mail, telefone, faculdade ou bairro já cadastrado"
        )
    except ValidacaoMultiplaError as e:
        raise HTTPException(status_code=400, detail={"erros": e.erros})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao cadastrar usuário: {str(e)}")


# Aliases para retrocompatibilidade
@router.post("/cadastro", response_model=CadastroSucessoDTO, status_code=201, include_in_schema=False)
@router.post("/register", response_model=CadastroSucessoDTO, status_code=201, include_in_schema=False)
async def cadastrar_usuario_alias(
    data: CadastroUsuarioDTO,
    repository=Depends(get_repository),
    arquivo_repository=Depends(get_arquivo_repository),
    hasher=Depends(get_hasher),
    token_service=Depends(get_token_service),
):
    return await cadastrar_usuario_json(data, repository, arquivo_repository, hasher, token_service)


@router.patch(
    "/alunos/{aluno_id}/aprovar",
    response_model=AprovacaoAlunoResponseDTO,
    summary="Aprovar Cadastro de Aluno por ID",
    description="Altera o status do aluno para 'ativado', permitindo o acesso à plataforma. Requer autenticação."
)
async def aprovar_aluno(
    aluno_id: int,
    repository=Depends(get_repository),

):
    try:
        use_case = AprovarAlunoUseCase(repository)
        return use_case.execute(aluno_id=aluno_id, novo_status=StatusCadastroEnum.ATIVADO)
    except ValueError as e:
        msg = str(e)
        if "não encontrado" in msg.lower():
            raise HTTPException(status_code=404, detail=msg)
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao aprovar cadastro do aluno: {str(e)}")


@router.patch(
    "/alunos/{aluno_id}/status",
    response_model=AprovacaoAlunoResponseDTO,
    summary="Atualizar Status do Cadastro do Aluno (Ativado, Pendente ou Inativado)",
    description="Permite alterar o status do aluno para 'ativado', 'inativado' ou 'pendente', com suporte a motivo de reprovação. Requer autenticação."
)
async def atualizar_status_aluno(
    aluno_id: int,
    data: AtualizarStatusAlunoDTO,
    repository=Depends(get_repository),
    current_user: Annotated[dict, Depends(verify_any_user)] = None,
):
    try:
        use_case = AprovarAlunoUseCase(repository)
        return use_case.execute(
            aluno_id=aluno_id,
            novo_status=data.status_cadastro,
            motivo_reprovacao=data.motivo_reprovacao
        )
    except ValueError as e:
        msg = str(e)
        if "não encontrado" in msg.lower():
            raise HTTPException(status_code=404, detail=msg)
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar status do aluno: {str(e)}")


@router.get(
    "/me",
    response_model=PerfilAlunoResponseDTO,
    summary="Consultar Perfil do Aluno Autenticado",
    description="Retorna os dados do perfil do aluno autenticado extraído do token JWT, omitindo informações sensíveis de sistema."
)
async def obter_meu_perfil(
    current_user: Annotated[dict, Depends(verify_any_user)],
    repository=Depends(get_repository),
):
    try:
        user_id_str = current_user.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Sessão inválida: identificador de usuário não encontrado no token")
        
        user_id = int(user_id_str)
        use_case = ObterPerfilAlunoUseCase(repository)
        return use_case.execute(user_id)
    except ValueError as e:
        msg = str(e)
        if "não encontrado" in msg.lower():
            raise HTTPException(status_code=404, detail=msg)
        raise HTTPException(status_code=400, detail=msg)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar perfil: {str(e)}")


@router.patch(
    "/me/email",
    response_model=UsuarioResponseDTO,
    summary="Redefinir E-mail do Aluno Autenticado",
    description="Permite alterar o e-mail da conta se a senha atual for fornecida e estiver correta."
)
async def atualizar_email_autenticado(
    data: RedefinirEmailDTO,
    current_user: Annotated[dict, Depends(verify_any_user)],
    repository=Depends(get_repository),
    hasher=Depends(get_hasher),
):
    try:
        user_id_str = current_user.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Sessão inválida")

        user_id = int(user_id_str)
        use_case = RedefinirEmailUseCase(repository, hasher)
        return use_case.execute(user_id, data)
    except ValueError as e:
        msg = str(e)
        if "não encontrado" in msg.lower():
            raise HTTPException(status_code=404, detail=msg)
        raise HTTPException(status_code=400, detail=msg)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar e-mail: {str(e)}")


@router.patch(
    "/me",
    response_model=AtualizarAlunoDTO,
    summary="Atualizar Perfil do Aluno",
    description="Permite que o aluno autenticado atualize parcialmente seus dados (bairro e telefone)."
)
async def atualizar_meu_perfil(
    data: AtualizarAlunoDTO,
    current_user: Annotated[dict, Depends(verify_any_user)],
    repository=Depends(get_repository),
):
    try:
        user_id_str = current_user.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Sessão inválida")

        user_id = int(user_id_str)
        use_case = AtualizarAlunoUseCase(repository)
        return use_case.execute(user_id, data)
    except ValueError as e:
        msg = str(e)
        if "não encontrado" in msg.lower():
            raise HTTPException(status_code=404, detail=msg)
        raise HTTPException(status_code=400, detail=msg)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar perfil do aluno: {str(e)}")

