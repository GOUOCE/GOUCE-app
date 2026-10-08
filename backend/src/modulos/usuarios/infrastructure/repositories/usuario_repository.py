from datetime import date, datetime, time, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import inspect, or_, text

from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.modulos.usuarios.model.entities.tipo import TipoORM
from src.modulos.usuarios.model.entities.usuario_tipo import UsuarioTipoORM
from src.shared.enums.cargo_enum import CargoEnum
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.shared.infrastructure.audit_model import LogAuditoriaORM
from src.shared.security.lgpd_encryption import hash_email


class CadastroDuplicadoError(Exception):
    pass


class EmailDuplicadoError(CadastroDuplicadoError):
    pass


class SQLAlchemyUsuarioRepository:
    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _normalizar_valor(valor) -> str | None:
        if valor is None:
            return None
        return str(getattr(valor, "value", valor)).lower().strip()

    @staticmethod
    def normalizar_documentos_reenvio(documentos_reenvio) -> list[dict] | None:
        if documentos_reenvio is None:
            return None

        if isinstance(documentos_reenvio, list):
            itens = documentos_reenvio
        elif isinstance(documentos_reenvio, dict):
            itens = []
            for tipo, dados in documentos_reenvio.items():
                if isinstance(dados, dict):
                    motivo = dados.get("motivo") or dados.get("mensagem") or "Motivo não informado"
                    itens.append({"tipo": str(tipo), "motivo": str(motivo).strip()})
                elif dados is not None:
                    itens.append({"tipo": str(tipo), "motivo": str(dados).strip()})
        else:
            return None

        itens_validos = []
        for item in itens:
            if hasattr(item, "model_dump"):
                item = item.model_dump()
            if not isinstance(item, dict):
                continue
            tipo_valor = item.get("tipo") or item.get("documento") or ""
            tipo = str(getattr(tipo_valor, "value", tipo_valor)).strip()
            motivo = str(item.get("motivo") or item.get("mensagem") or "").strip()
            if not tipo or not motivo:
                continue
            itens_validos.append({"tipo": tipo, "motivo": motivo})
        return itens_validos or None

    def _buscar_flag_perfil_opcional(
        self,
        tabela: str,
        coluna_id: str,
        coluna_ativo: str,
        user_id: int,
    ) -> tuple[bool, bool] | None:
        """Busca um perfil auxiliar somente quando sua tabela é utilizável.

        Administrador e Representante não fazem parte do metadata carregado pelo
        aplicativo atual. A reflexão evita que uma tabela ausente quebre todas as
        requisições e não cria schema implicitamente.
        """
        try:
            inspector = inspect(self.session.get_bind())
            if tabela not in inspector.get_table_names():
                return None

            colunas = {coluna["name"] for coluna in inspector.get_columns(tabela)}
            if coluna_id not in colunas or coluna_ativo not in colunas:
                return None

            resultado = self.session.execute(
                text(
                    f'SELECT "{coluna_id}", "{coluna_ativo}" '
                    f'FROM "{tabela}" WHERE "{coluna_id}" = :user_id'
                ),
                {"user_id": user_id},
            ).mappings().first()

            if not resultado:
                return False, False

            return True, bool(resultado[coluna_ativo])
        except Exception:
            # Perfil auxiliar incompleto/indisponível não pode virar autorização
            # baseada apenas no claim do JWT. Nesse caso, o perfil não é aceito.
            return None

    def _buscar_tipo_associado(self, user_id: int) -> str | None:
        """Retorna o tipo relacional quando o schema novo estiver disponível."""
        try:
            resultado = (
                self.session.query(TipoORM.tipo_usuario)
                .join(UsuarioTipoORM, UsuarioTipoORM.id_tipo == TipoORM.id)
                .filter(UsuarioTipoORM.id_usuario == user_id)
                .first()
            )
            return resultado[0] if resultado else None
        except Exception:
            return None

    def buscar_contexto_autenticacao_por_id(self, user_id: int) -> dict | None:
        """Retorna o perfil e o estado atual usados na validação de sessão."""
        usuario, aluno = self.buscar_com_detalhes_por_id(user_id)
        if not usuario:
            return None

        agora = datetime.now(timezone.utc)
        candidatos: list[dict] = []

        if aluno:
            status_cadastro = self._normalizar_valor(aluno.status_cadastro)
            # O aluno rejeitado ainda pode logar para reenviar documentos.
            ativo = status_cadastro in {"ativado", "analise_renovacao", "rejeitado"}
            motivo = None

            if status_cadastro == "pendente":
                motivo = "Sua conta está pendente de aprovação pela coordenação."
            elif status_cadastro == "analise_renovacao":
                motivo = "Sua renovação de vínculo está em análise."
            elif status_cadastro == "rejeitado":
                motivo = "Existem documentos pendentes de reenvio. Consulte o motivo na área de cadastro."
            elif status_cadastro != "ativado":
                motivo_reprovacao = aluno.motivo_reprovacao or ""
                complemento = f": {motivo_reprovacao}" if motivo_reprovacao else ""
                motivo = f"Sua conta está inativada{complemento}."

            validade_acesso = aluno.validade_acesso
            if ativo and validade_acesso:
                if validade_acesso.tzinfo is None:
                    validade_acesso = validade_acesso.replace(tzinfo=timezone.utc)
                if agora >= validade_acesso:
                    ativo = False
                    motivo = "A validade de acesso da sua conta expirou."

            candidatos.append({
                "role": CargoEnum.ALUNO.value,
                "ativo": ativo,
                "status": status_cadastro,
                "motivo": motivo,
                "aluno": aluno,
            })

        administrador = self._buscar_flag_perfil_opcional(
            tabela="administrador",
            coluna_id="administrador_id",
            coluna_ativo="is_administrador_ativo",
            user_id=user_id,
        )
        tipo_associado = self._buscar_tipo_associado(user_id)
        if administrador and administrador[0]:
            candidatos.append({
                "role": CargoEnum.ADMINISTRADOR.value,
                "ativo": administrador[1],
                "status": "ativado" if administrador[1] else "inativado",
                "motivo": None if administrador[1] else "Usuário administrativo inativo.",
                "aluno": None,
            })

        representante = self._buscar_flag_perfil_opcional(
            tabela="representante",
            coluna_id="administrador_id",
            coluna_ativo="is_representante_ativo",
            user_id=user_id,
        )
        if representante and representante[0]:
            # "supervisor" é o valor legado presente no CargoEnum e no JWT
            # atual para o perfil operacional equivalente a Representante.
            candidatos.append({
                "role": CargoEnum.SUPERVISOR.value,
                "ativo": representante[1],
                "status": "ativado" if representante[1] else "inativado",
                "motivo": None if representante[1] else "Usuário representante inativo.",
                "aluno": None,
            })

        candidatos_ativos = [candidato for candidato in candidatos if candidato["ativo"]]
        if not candidatos_ativos:
            contexto_inativo = next(
                (
                    candidato
                    for candidato in candidatos
                    if candidato["role"] == tipo_associado
                ),
                candidatos[0] if candidatos else None,
            )
            if contexto_inativo:
                return {
                    "usuario": usuario,
                    **contexto_inativo,
                    "roles": [candidato["role"] for candidato in candidatos],
                }
            return {
                "usuario": usuario,
                "role": None,
                "roles": [],
                "ativo": False,
                "status": None,
                "motivo": "Perfil de usuário não identificado.",
                "aluno": aluno,
            }

        contexto = next(
            (
                candidato
                for candidato in candidatos_ativos
                if candidato["role"] == tipo_associado
            ),
            candidatos_ativos[0],
        )
        roles = [
            contexto["role"],
            *(
                candidato["role"]
                for candidato in candidatos_ativos
                if candidato["role"] != contexto["role"]
            ),
        ]

        limite_de_bloqueio = usuario.limite_de_bloqueio
        if contexto["ativo"] and limite_de_bloqueio:
            if limite_de_bloqueio.tzinfo is None:
                limite_de_bloqueio = limite_de_bloqueio.replace(tzinfo=timezone.utc)
            if agora < limite_de_bloqueio:
                contexto["ativo"] = False
                contexto["motivo"] = "Conta temporariamente bloqueada."

        return {
            "usuario": usuario,
            **contexto,
            "roles": roles,
        }

    def buscar_contexto_autenticacao_por_email(self, email: str) -> dict | None:
        usuario = self.buscar_por_email(email)
        if not usuario or not usuario.id:
            return None
        return self.buscar_contexto_autenticacao_por_id(usuario.id)

    def buscar_por_email(self, email: str):
        email_limpo = email.lower().strip()
        h = hash_email(email_limpo)
        return self.session.query(UsuarioORM).filter(
            or_(UsuarioORM.email_hash == h, UsuarioORM.email == email_limpo)
        ).first()

    def buscar_com_detalhes_por_email(self, email: str):
        email_limpo = email.lower().strip()
        h = hash_email(email_limpo)
        resultado = (
            self.session.query(UsuarioORM, AlunoORM)
            .outerjoin(AlunoORM, UsuarioORM.id == AlunoORM.aluno_id)
            .filter(or_(UsuarioORM.email_hash == h, UsuarioORM.email == email_limpo))
            .first()
        )
        if not resultado:
            return None, None
        return resultado[0], resultado[1]

    def listar_todos(self) -> list[dict]:
        resultados = (
            self.session.query(UsuarioORM, AlunoORM)
            .outerjoin(AlunoORM, UsuarioORM.id == AlunoORM.aluno_id)
            .all()
        )
        lista = []
        for usuario, aluno in resultados:
            # Serializa 100% de todas as colunas de UsuarioORM
            dados_usuario = {c.name: getattr(usuario, c.name) for c in usuario.__table__.columns}
            
            # Remove o hash da senha e email_hash por boas práticas de segurança
            dados_usuario.pop("senha", None)
            dados_usuario.pop("email_hash", None)

            # Serializa 100% de todas as colunas de AlunoORM se existir
            dados_aluno = {}
            if aluno:
                dados_aluno = {c.name: getattr(aluno, c.name) for c in aluno.__table__.columns}
            
            # Combina todas as informações de usuário e de aluno
            item_completo = {**dados_usuario, **dados_aluno}
            lista.append(item_completo)

        return lista

    @staticmethod
    def validar_ordem_data(ordem: str | None) -> str | None:
        if ordem is None:
            return None
        ordem_limpa = str(ordem).strip().lower()
        if ordem_limpa not in {"asc", "desc"}:
            raise ValueError("O parâmetro 'ordem' deve ser 'asc' ou 'desc'.")
        return ordem_limpa

    @staticmethod
    def validar_status_cadastro(status: str | None) -> str | None:
        if status is None:
            return None
        status_limpo = str(status).strip().lower()
        if not status_limpo:
            return None
        status_permitidos = {item.value for item in StatusCadastroEnum}
        if status_limpo not in status_permitidos:
            raise ValueError(
                "Status inválido. Informe um dos valores: "
                + ", ".join(sorted(status_permitidos))
            )
        return status_limpo

    def listar_usuarios_filtrados(
        self,
        status: str | None = None,
        ordem: str | None = None,
    ) -> list[dict]:
        ordem_aceita = self.validar_ordem_data(ordem)
        status_limpo = self.validar_status_cadastro(status)
        resultados = self.listar_todos()

        if status_limpo:
            resultados = [
                item for item in resultados
                if str(item.get("status_cadastro") or "").lower() == status_limpo
            ]

        if ordem_aceita:
            resultados.sort(
                key=lambda item: (item.get("data_hora_envio_analise") or datetime.min.replace(tzinfo=timezone.utc)).timestamp(),
                reverse=(ordem_aceita == "desc"),
            )

        return resultados

    def listar_nomes_e_emails_por_roles(self, roles: list[str] | None = None) -> list[dict]:
        query = self.session.query(
            UsuarioORM.nome_completo.label("nome"),
            UsuarioORM.email,
        )
        if roles:
            query = (
                query.join(UsuarioTipoORM, UsuarioTipoORM.id_usuario == UsuarioORM.id)
                .join(TipoORM, TipoORM.id == UsuarioTipoORM.id_tipo)
                .filter(TipoORM.tipo_usuario.in_(roles))
                .distinct()
            )

        return [
            {"nome": nome, "email": email}
            for nome, email in query.order_by(UsuarioORM.nome_completo).all()
        ]

    def listar_alunos_resumo(
        self,
        status: str | None = None,
        ordem: str | None = None,
    ) -> list[dict]:
        ordem_aceita = self.validar_ordem_data(ordem)
        status_limpo = self.validar_status_cadastro(status)
        resultados = (
            self.session.query(
                AlunoORM.aluno_id.label("id"),
                UsuarioORM.nome_completo.label("nome"),
                UsuarioORM.email,
                AlunoORM.faculdade_id.label("faculdade"),
                AlunoORM.campus,
                AlunoORM.status_cadastro,
                AlunoORM.data_hora_envio_analise,
                AlunoORM.data_hora_ultima_renovacao_matricula,
                AlunoORM.motivo_reprovacao,
                AlunoORM.documentos_reenvio,
            )
            .join(AlunoORM, AlunoORM.aluno_id == UsuarioORM.id)
            .order_by(UsuarioORM.nome_completo)
            .all()
        )

        lista = [
            {
                "id": aluno_id,
                "nome": nome_aluno,
                "email": email,
                "faculdade": faculdade,
                "campus": campus,
                "status_cadastro": status_cadastro,
                "data_hora_envio_analise": data_envio_analise,
                "data_hora_ultima_renovacao_matricula": data_ultima_renovacao,
                "motivo_reprovacao": motivo_reprovacao,
                "documentos_reenvio": self.normalizar_documentos_reenvio(documentos_reenvio),
            }
            for (
                aluno_id,
                nome_aluno,
                email,
                faculdade,
                campus,
                status_cadastro,
                data_envio_analise,
                data_ultima_renovacao,
                motivo_reprovacao,
                documentos_reenvio,
            ) in resultados
        ]

        if status_limpo:
            lista = [
                item for item in lista
                if str(item.get("status_cadastro") or "").lower() == status_limpo
            ]

        if ordem_aceita:
            lista.sort(
                key=lambda item: (item.get("data_hora_envio_analise") or datetime.min.replace(tzinfo=timezone.utc)).timestamp(),
                reverse=(ordem_aceita == "desc"),
            )

        return [
            {
                "id": item["id"],
                "nome": item["nome"],
                "email": item["email"],
                "faculdade": item["faculdade"],
                "campus": item["campus"],
                "status_cadastro": item["status_cadastro"],
                "data_hora_envio_analise": item["data_hora_envio_analise"],
                "data_hora_ultima_renovacao_matricula": item["data_hora_ultima_renovacao_matricula"],
                "motivo_reprovacao": item["motivo_reprovacao"],
                "documentos_reenvio": item["documentos_reenvio"],
            }
            for item in lista
        ]

    def criar_aluno(self, comando, senha_hash: str):
        status_str = StatusCadastroEnum.PENDENTE.value
        email_limpo = comando.email.lower().strip()

        usuario = UsuarioORM(
            nome_completo=comando.nome.strip(),
            email=email_limpo,
            email_hash=hash_email(email_limpo),
            telefone=comando.telefone,
            senha=senha_hash,
        )
        self.session.add(usuario)

        consentimento_dt = (
            getattr(comando, "consentimento_lgpd_em", None)
            or (datetime.now(timezone.utc) if comando.termos_de_uso else None)
        )
        versao_termos_val = getattr(comando, "versao_termos", "1.0") or "1.0"

        try:
            self.session.flush()
            agora = datetime.now(timezone.utc)
            self.session.add(AlunoORM(
                aluno_id=usuario.id,
                status_cadastro=status_str,
                faculdade_id=comando.faculdade_id,
                campus=comando.campus,
                bairro_id=comando.bairro_id,
                id_comprovante_matricula=comando.id_comprovante_matricula,
                id_comprovante_residencia=comando.id_comprovante_residencia,
                data_nascimento=comando.data_nascimento,
                identificacao_genero=comando.identificacao_genero,
                tem_filhos=comando.tem_filhos,
                transgenero=comando.transgenero,
                curso=comando.curso,
                semestre_atual=comando.semestre_atual,
                periodo_ingresso=comando.periodo_ingresso,
                turno_curso=comando.turno_curso,
                raca=comando.raca,
                validade_acesso=comando.validade_acesso,
                id_foto_aluno=comando.id_foto_aluno,
                identificacao_sexual=comando.identificacao_sexual,
                motivo_reprovacao=comando.motivo_reprovacao,
                data_hora_envio_analise=agora,
                termos_de_uso=comando.termos_de_uso,
                consentimento_lgpd_em=consentimento_dt,
                versao_termos=versao_termos_val,
            ))
            tipo_aluno = self.session.query(TipoORM).filter(
                TipoORM.tipo_usuario == CargoEnum.ALUNO.value
            ).first()
            if not tipo_aluno:
                self.session.rollback()
                raise RuntimeError("O tipo de usuário aluno não está inicializado.")
            self.session.add(UsuarioTipoORM(
                id_usuario=usuario.id,
                id_tipo=tipo_aluno.id,
            ))
            self.session.commit()
            self.session.refresh(usuario)
            return usuario
        except IntegrityError as error:
            self.session.rollback()
            try:
                if self.buscar_por_email(email_limpo):
                    raise EmailDuplicadoError from error
            except EmailDuplicadoError:
                raise
            except Exception:
                pass
            raise CadastroDuplicadoError from error

    def buscar_aluno_por_id(self, aluno_id: int) -> AlunoORM | None:
        return self.session.query(AlunoORM).filter(AlunoORM.aluno_id == aluno_id).first()

    def atualizar_status_aluno(
        self,
        aluno_id: int,
        novo_status: str,
        motivo_reprovacao: str | None = None,
        documentos_reenvio: list[dict] | None = None,
    ) -> AlunoORM | None:
        aluno = self.buscar_aluno_por_id(aluno_id)
        if not aluno:
            return None

        aluno.status_cadastro = novo_status
        if motivo_reprovacao is not None:
            aluno.motivo_reprovacao = motivo_reprovacao
        elif novo_status == StatusCadastroEnum.REJEITADO.value:
            aluno.motivo_reprovacao = None

        if novo_status == StatusCadastroEnum.REJEITADO.value:
            aluno.documentos_reenvio = documentos_reenvio or aluno.documentos_reenvio
        elif novo_status in {StatusCadastroEnum.PENDENTE.value, StatusCadastroEnum.ANALISE_RENOVACAO.value}:
            aluno.documentos_reenvio = None
        else:
            aluno.documentos_reenvio = None

        if novo_status in {StatusCadastroEnum.PENDENTE.value, StatusCadastroEnum.ANALISE_RENOVACAO.value}:
            aluno.data_hora_envio_analise = datetime.now(timezone.utc)
        if novo_status == StatusCadastroEnum.ANALISE_RENOVACAO.value:
            aluno.data_hora_ultima_renovacao_matricula = datetime.now(timezone.utc)

        self.session.add(LogAuditoriaORM(
            usuario_id=aluno.aluno_id,
            acao="UPDATE_STATUS",
            entidade="aluno",
            entidade_id=aluno.aluno_id,
            valor_anterior=str(aluno.status_cadastro),
            valor_novo=str(novo_status),
        ))

        self.session.commit()
        self.session.refresh(aluno)
        return aluno

    def atualizar_documentos_reenvio(
        self,
        aluno_id: int,
        documentos_reenvio: list[dict],
        ids_documentos: dict[str, str],
    ) -> AlunoORM | None:
        aluno = self.buscar_aluno_por_id(aluno_id)
        if not aluno:
            return None

        for documento in documentos_reenvio:
            arquivo_id = ids_documentos.get(documento["tipo"])
            if arquivo_id:
                documento["arquivo_id"] = arquivo_id

        if ids_documentos.get("comprovante_matricula"):
            aluno.id_comprovante_matricula = ids_documentos["comprovante_matricula"]
        if ids_documentos.get("comprovante_residencia"):
            aluno.id_comprovante_residencia = ids_documentos["comprovante_residencia"]
        if ids_documentos.get("foto_perfil"):
            aluno.id_foto_aluno = ids_documentos["foto_perfil"]

        aluno.documentos_reenvio = documentos_reenvio
        aluno.status_cadastro = StatusCadastroEnum.PENDENTE.value
        aluno.data_hora_envio_analise = datetime.now(timezone.utc)

        self.session.add(aluno)
        self.session.commit()
        self.session.refresh(aluno)
        return aluno

    def buscar_com_detalhes_por_id(self, user_id: int) -> tuple[UsuarioORM | None, AlunoORM | None]:
        resultado = (
            self.session.query(UsuarioORM, AlunoORM)
            .outerjoin(AlunoORM, UsuarioORM.id == AlunoORM.aluno_id)
            .filter(UsuarioORM.id == user_id)
            .first()
        )
        if not resultado:
            return None, None
        return resultado[0], resultado[1]

    def atualizar_email(self, user_id: int, novo_email: str) -> UsuarioORM | None:
        try:
            usuario = self.session.query(UsuarioORM).filter(UsuarioORM.id == user_id).first()
            if not usuario:
                return None

            email_limpo = novo_email.lower().strip()
            usuario.email = email_limpo
            usuario.email_hash = hash_email(email_limpo)

            self.session.commit()
            self.session.refresh(usuario)
            return usuario
        except Exception:
            self.session.rollback()
            raise

    def atualizar_dados_parciais(self, user_id: int, telefone: str | None = None, bairro_id: str | None = None):
        try:
            usuario, aluno = self.buscar_com_detalhes_por_id(user_id)
            if not usuario:
                return None, None

            if telefone is not None:
                usuario.telefone = telefone

            if aluno and bairro_id is not None:
                aluno.bairro_id = bairro_id

            self.session.commit()
            self.session.refresh(usuario)
            if aluno:
                self.session.refresh(aluno)

            return usuario, aluno
        except Exception:
            self.session.rollback()
            raise

    def atualizar_dados_renovacao(
        self,
        aluno_id: int,
        dados,
        id_comprovante_matricula: str,
        id_comprovante_residencia: str,
        id_foto_aluno: str | None,
        novo_status: str,
    ) -> AlunoORM | None:
        try:
            usuario, aluno = self.buscar_com_detalhes_por_id(aluno_id)
            if not usuario or not aluno:
                return None

            usuario.nome_completo = dados.nome.strip()
            usuario.telefone = dados.telefone

            aluno.raca = getattr(dados.raca, "value", dados.raca)
            aluno.identificacao_sexual = getattr(
                dados.identificacao_sexual, "value", dados.identificacao_sexual
            )
            aluno.identificacao_genero = getattr(
                dados.identificacao_genero, "value", dados.identificacao_genero
            )
            aluno.transgenero = getattr(dados.transgenero, "value", dados.transgenero)
            aluno.tem_filhos = dados.tem_filhos
            aluno.bairro_id = dados.bairro_id
            aluno.faculdade_id = dados.faculdade_id
            aluno.campus = dados.campus
            aluno.curso = dados.curso
            aluno.periodo_ingresso = dados.periodo_ingresso
            aluno.turno_curso = getattr(dados.turno_curso, "value", dados.turno_curso)
            aluno.semestre_atual = dados.semestre_atual
            aluno.id_comprovante_matricula = id_comprovante_matricula
            aluno.id_comprovante_residencia = id_comprovante_residencia
            if id_foto_aluno:
                aluno.id_foto_aluno = id_foto_aluno
            aluno.status_cadastro = novo_status

            self.session.commit()
            self.session.refresh(aluno)
            return aluno
        except Exception:
            self.session.rollback()
            raise
