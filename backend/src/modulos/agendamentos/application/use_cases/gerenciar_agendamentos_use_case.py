import os
from datetime import date, datetime, timedelta

from sqlalchemy.exc import IntegrityError

from src.modulos.agendamentos.application.errors import AgendamentoError
from src.modulos.agendamentos.infrastructure.repositories.agendamento_repository import (
    AgendamentoRepository,
)
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM


class GerenciarAgendamentosUseCase:
    def __init__(self, repository: AgendamentoRepository):
        self.repository = repository
        self.window_days = int(os.getenv("AGENDAMENTO_JANELA_DIAS", "30"))
        self.active_limit = int(os.getenv("AGENDAMENTO_LIMITE_ATIVOS", "22"))

    def _bounds(self):
        today = datetime.now().astimezone().date()
        return today, today + timedelta(days=self.window_days - 1)

    def validate_date(self, target: date):
        today, last = self._bounds()
        if target < today or target > last:
            raise AgendamentoError(
                "DATA_FORA_DA_JANELA", "A data está fora da janela de agendamento.", 422
            )
        holiday = self.repository.holiday(target)
        if holiday:
            raise AgendamentoError(
                "DATA_INDISPONIVEL", f"Data indisponível: {holiday.descricao}.", 422
            )

    def _validate_reference(self, value, field, model):
        item = self.repository.reference(model, value)
        if item is None or not item.ativo:
            raise AgendamentoError(
                "ITEM_INATIVO_OU_INEXISTENTE",
                f"O campo {field} informa um cadastro inexistente ou inativo.",
                422,
                [field],
            )
        return item

    def _validate_route(self, point_id, faculty_id, direction, complementary_id):
        point_field = "ponto_embarque_id" if direction == "ida" else "ponto_desembarque_id"
        faculty_field = "ies_destino_id" if direction == "ida" else "ies_origem_id"
        point = self._validate_reference(point_id, point_field, PontoDeParadaORM)
        faculty = self._validate_reference(faculty_id, faculty_field, FaculdadeORM)
        complementary = (
            self.repository.active_complementary(complementary_id)
            if complementary_id is not None
            else None
        )
        complementary_field = (
            "rota_complementar_ida_id"
            if direction == "ida"
            else "rota_complementar_volta_id"
        )
        if complementary_id is not None and (complementary is None or not complementary.ativo):
            raise AgendamentoError(
                "ITEM_INATIVO_OU_INEXISTENTE",
                f"A rota complementar {complementary_id} não existe ou está inativa.",
                422,
                [complementary_field],
            )
        route = self.repository.route_for(
            point,
            faculty,
            direction,
            complementary.rota_principal_id if complementary else None,
        )
        if route is None:
            raise AgendamentoError(
                "FA-002",
                f"Não foi possível criar o agendamento: não há rota principal ativa "
                f"para o ponto '{point.nome}' e a faculdade '{faculty.nome_faculdade}'.",
                422,
                [point_field, faculty_field],
            )
        if complementary_id is None:
            return

    def _validate_payload(self, aluno_id, data, exclude_id=None):
        if not data.usa_ida and not data.usa_volta:
            raise AgendamentoError(
                "FA-003", "Selecione pelo menos um trecho: ida ou volta.", 422,
                ["usa_ida", "usa_volta"],
            )
        self.validate_date(data.data)
        if data.usa_ida:
            missing = [
                field for field, value in (
                    ("ponto_embarque_id", data.ponto_embarque_id),
                    ("ies_destino_id", data.ies_destino_id),
                ) if value is None
            ]
            if missing:
                raise AgendamentoError(
                    "FA-003", "Informe os campos obrigatórios da ida.", 422, missing
                )
        if data.usa_volta:
            missing = [
                field for field, value in (
                    ("ies_origem_id", data.ies_origem_id),
                    ("ponto_desembarque_id", data.ponto_desembarque_id),
                ) if value is None
            ]
            if missing:
                raise AgendamentoError(
                    "FA-003", "Informe os campos obrigatórios da volta.", 422, missing
                )
        if self.repository.active_for_day(aluno_id, data.data, exclude_id):
            raise AgendamentoError(
                "FA-001", "Já existe agendamento ativo para este dia.", 409
            )
        if exclude_id is None:
            today, _ = self._bounds()
            if len(self.repository.active_from(aluno_id, today)) >= self.active_limit:
                raise AgendamentoError(
                    "LIMITE_AGENDAMENTOS",
                    "Limite de agendamentos ativos atingido.",
                    422,
                )
        if data.usa_ida:
            self._validate_route(
                data.ponto_embarque_id, data.ies_destino_id, "ida",
                data.rota_complementar_ida_id,
            )
        if data.usa_volta:
            self._validate_route(
                data.ponto_desembarque_id, data.ies_origem_id, "volta",
                data.rota_complementar_volta_id,
            )

    def create(self, aluno_id: int, data):
        self._validate_payload(aluno_id, data)
        try:
            return self.repository.create(aluno_id, data)
        except IntegrityError as error:
            self.repository.rollback()
            raise AgendamentoError(
                "FA-001", "Já existe agendamento ativo para este dia.", 409
            ) from error

    def update(self, aluno_id: int, item_id: int, data):
        item = self.repository.get_active(aluno_id, item_id)
        if item is None:
            raise AgendamentoError("RESOURCE_NOT_FOUND", "Agendamento não encontrado.", 404)
        if not data.usa_ida and not data.usa_volta:
            # HU-013 CA-16: ida=Não e volta=Não equivale ao cancelamento (HU-014).
            return self.cancel(aluno_id, item_id)
        self._validate_payload(aluno_id, data, item_id)
        return self.repository.update(aluno_id, item, data)

    def _get_owned(self, aluno_id: int, item_id: int):
        item = self.repository.get_active(aluno_id, item_id)
        if item is None:
            raise AgendamentoError(
                "RESOURCE_NOT_FOUND", "Agendamento não encontrado.", 404
            )
        return item

    def cancel(self, aluno_id: int, item_id: int):
        """Cancela (logicamente) um agendamento futuro, sem prazo mínimo (RN-005)."""
        item = self._get_owned(aluno_id, item_id)
        today, _ = self._bounds()
        if item.data < today:
            raise AgendamentoError(
                "AGENDAMENTO_PASSADO",
                "Não é possível cancelar agendamento de data já passada.",
                422,
            )
        return self.repository.cancel(aluno_id, item)

    def summary(self, aluno_id: int):
        today, _ = self._bounds()
        return {
            "ativos": self.repository.count_active_from(aluno_id, today),
            "limite": self.active_limit,
        }

    def detail(self, aluno_id: int, item_id: int):
        item = self._get_owned(aluno_id, item_id)
        return self._detail(item)

    def detail_by_date(self, aluno_id: int, data: str):
        try:
            target = date.fromisoformat(data)
        except ValueError:
            raise AgendamentoError(
                "VALIDATION_ERROR", "Data deve estar no formato YYYY-MM-DD.", 422
            )
        item = self.repository.get_active_by_date(aluno_id, target)
        if item is None:
            raise AgendamentoError(
                "RESOURCE_NOT_FOUND", "Nenhum agendamento ativo para esta data.", 404
            )
        return self._detail(item)

    def my_bookings(self, aluno_id: int):
        today, _ = self._bounds()
        items = self.repository.list_active_from(aluno_id, today)
        return {
            "agendamentos": [self._detail(item) for item in items],
            "ativos": len(items),
            "limite": self.active_limit,
        }

    def _complementary_for(self, complementary_id):
        if complementary_id is None:
            return None
        return self.repository.reference(RotaComplementarORM, complementary_id)

    def _point_for(self, point_id):
        if point_id is None:
            return None
        return self.repository.reference(PontoDeParadaORM, point_id)

    def _faculty_for(self, faculty_id):
        if faculty_id is None:
            return None
        return self.repository.reference(FaculdadeORM, faculty_id)

    def _principal_for(self, point, faculty, direction, complementary):
        """Resolve a rota principal do trecho reaproveitando ``route_for``,
        a mesma consulta usada na validação/criação do agendamento (RN-010).

        Recebe ``point``/``faculty`` já carregados (não ids) para não repetir
        a busca que ``_detail`` já fez para montar os campos ``*_nome``.
        """
        if point is None or faculty is None:
            return None
        route_id = complementary.rota_principal_id if complementary else None
        return self.repository.route_for(point, faculty, direction, route_id)

    @staticmethod
    def _complementary_summary(rota):
        if rota is None:
            return None
        return {
            "id": rota.id,
            "nome": rota.nome,
            "horario_saida": rota.horario_saida.strftime("%H:%M"),
            "horario_retorno": rota.horario_retorno.strftime("%H:%M"),
            "ponto_conexao": rota.ponto_conexao,
        }

    @staticmethod
    def _principal_summary(rota, direction):
        if rota is None:
            return None
        faculdades = rota.faculdades_ida if direction == "ida" else rota.faculdades_volta
        return {
            "id": rota.id,
            "nome": rota.nome,
            "horario_saida": rota.horario_saida.strftime("%H:%M"),
            "horario_retorno": rota.horario_retorno.strftime("%H:%M"),
            "faculdades": sorted(
                (
                    {"id": faculdade.id_faculdade, "nome": faculdade.nome_faculdade}
                    for faculdade in faculdades
                ),
                key=lambda item: (item["nome"].casefold(), item["id"]),
            ),
        }

    @staticmethod
    def _version(item, *rotas):
        """Maior updated_at entre o agendamento e as rotas resolvidas (ETag do cache offline)."""
        candidatos = [item.updated_at] + [
            rota.updated_at for rota in rotas if rota is not None
        ]
        return max(candidatos)

    def _detail(self, item):
        today, _ = self._bounds()
        future = item.data >= today

        complementar_ida = self._complementary_for(item.rota_complementar_ida_id)
        complementar_volta = self._complementary_for(item.rota_complementar_volta_id)
        ponto_embarque = self._point_for(item.ponto_embarque_id)
        ies_destino = self._faculty_for(item.ies_destino_id)
        ponto_desembarque = self._point_for(item.ponto_desembarque_id)
        ies_origem = self._faculty_for(item.ies_origem_id)
        principal_ida = self._principal_for(
            ponto_embarque, ies_destino, "ida", complementar_ida
        )
        principal_volta = self._principal_for(
            ponto_desembarque, ies_origem, "volta", complementar_volta
        )

        return {
            "id": item.id,
            "aluno_id": item.aluno_id,
            "data": item.data,
            "usa_ida": item.usa_ida,
            "usa_volta": item.usa_volta,
            "ponto_embarque_id": item.ponto_embarque_id,
            "ies_destino_id": item.ies_destino_id,
            "rota_complementar_ida_id": item.rota_complementar_ida_id,
            "ies_origem_id": item.ies_origem_id,
            "ponto_desembarque_id": item.ponto_desembarque_id,
            "rota_complementar_volta_id": item.rota_complementar_volta_id,
            "status": item.status,
            "ponto_embarque_nome": ponto_embarque.nome if ponto_embarque else None,
            "ies_destino_nome": ies_destino.nome_faculdade if ies_destino else None,
            "rota_complementar_ida_nome": complementar_ida.nome if complementar_ida else None,
            "ies_origem_nome": ies_origem.nome_faculdade if ies_origem else None,
            "ponto_desembarque_nome": (
                ponto_desembarque.nome if ponto_desembarque else None
            ),
            "rota_complementar_volta_nome": (
                complementar_volta.nome if complementar_volta else None
            ),
            "rota_complementar_ida": self._complementary_summary(complementar_ida),
            "rota_complementar_volta": self._complementary_summary(complementar_volta),
            "rota_principal_ida": self._principal_summary(principal_ida, "ida"),
            "rota_principal_volta": self._principal_summary(principal_volta, "volta"),
            "atualizado_em": self._version(
                item, complementar_ida, complementar_volta, principal_ida, principal_volta
            ),
            "pode_remover": future,
            "pode_editar": future,
        }

    def calendar_view(self, aluno_id: int, month: str):
        days = self.calendar(aluno_id, month)
        return {
            "mes": month,
            "dias": days,
            **self.summary(aluno_id),
        }

    def calendar(self, aluno_id: int, month: str):
        try:
            year, month_number = (int(value) for value in month.split("-"))
            first = date(year, month_number, 1)
        except (ValueError, TypeError):
            raise AgendamentoError(
                "VALIDATION_ERROR", "Mês deve estar no formato YYYY-MM.", 422
            )
        today, last = self._bounds()
        next_month = date(year + (month_number == 12), month_number % 12 + 1, 1)
        start, end = first, min(next_month - timedelta(days=1), last)
        if start > end:
            return []
        bookings = {
            item.data: item
            for item in self.repository.bookings_between(aluno_id, start, end)
        }
        has_route = self.repository.has_active_route()
        result = []
        current = start
        while current <= end:
            past = current < today
            if past and current not in bookings:
                # Dias passados só aparecem se tiveram agendamento (histórico).
                current += timedelta(days=1)
                continue
            holiday = None if past else self.repository.holiday(current)
            booking = bookings.get(current)
            state = (
                holiday.tipo if holiday else
                "AGENDADO" if booking else
                "DISPONIVEL" if has_route else "INDISPONIVEL"
            )
            result.append({
                "data": current,
                "estado": state,
                "descricao": holiday.descricao if holiday else None,
                "pode_agendar": not past and not holiday and not booking and has_route,
                "agendamento_id": booking.id if booking else None,
                "pode_remover": bool(booking) and not past,
                "pode_editar": bool(booking) and not past,
            })
            current += timedelta(days=1)
        return result

    def options(self, target: date):
        routes = self.repository.active_routes()
        return {
            "data": target,
            "horarios_ida": sorted({r.horario_saida.strftime("%H:%M") for r in routes}),
            "horarios_volta": sorted({r.horario_retorno.strftime("%H:%M") for r in routes}),
            "pontos": [
                {"id": p.ponto_id, "nome": p.nome, "bairro_id": p.bairro_id}
                for route in routes for bairro in getattr(route, "bairros", [])
                for p in getattr(bairro, "pontos_de_parada", []) if p.ativo
            ],
            "ies_ida": [
                {"id": f.id_faculdade, "nome": f.nome_faculdade, "campus": f.campus_faculdade}
                for route in routes for f in route.faculdades_ida if f.ativo
            ],
            "ies_volta": [
                {"id": f.id_faculdade, "nome": f.nome_faculdade, "campus": f.campus_faculdade}
                for route in routes for f in route.faculdades_volta if f.ativo
            ],
        }

    def active_for_day(self, aluno_id: int, target: date):
        return self.repository.active_for_day(aluno_id, target)

    def holiday(self, target: date):
        return self.repository.holiday(target)
