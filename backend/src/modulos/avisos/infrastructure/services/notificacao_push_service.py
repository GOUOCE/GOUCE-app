"""Serviço desacoplado de disparo de notificações push para o Mural de Avisos (HU-024)."""

from collections import deque
from datetime import datetime, timezone
from threading import Lock

APP_NOME_NOTIFICACAO = "GOUOCE"


def _normalizar_data_utc(valor: datetime | None) -> datetime:
    if valor is None:
        return datetime.now(timezone.utc)
    if valor.tzinfo is None:
        return valor.replace(tzinfo=timezone.utc)
    return valor



class NotificacaoPushService:
    """Gerencia o disparo e o buffer de eventos de notificação push (Seção 5.5 da Arquitetura)."""

    _lock = Lock()
    _eventos: deque[dict] = deque(maxlen=100)
    _sequencia_id: int = 1_000_000

    def disparar_novo_aviso(self, aviso: dict) -> dict:
        """Registra e dispara uma notificação push a partir de um aviso recém-publicado."""
        aviso_id = int(aviso["id"])
        evento = {
            "id": aviso_id,
            "tipo": "aviso",
            "app_nome": APP_NOME_NOTIFICACAO,
            "titulo": str(aviso["titulo"]),
            "mensagem": str(aviso["descricao"]),
            "aviso_id": aviso_id,
            "data_criacao": _normalizar_data_utc(aviso.get("data_criacao")),
        }
        with self._lock:
            self._eventos.appendleft(evento)
        return evento

    def disparar_realocacao_onibus(
        self,
        numero_onibus: str,
        titulo: str = "Você foi realocado",
    ) -> dict:
        """Registra uma notificação push de realocação de ônibus (HU-024)."""
        with self._lock:
            NotificacaoPushService._sequencia_id += 1
            evento_id = NotificacaoPushService._sequencia_id
            evento = {
                "id": evento_id,
                "tipo": "realocacao",
                "app_nome": APP_NOME_NOTIFICACAO,
                "titulo": titulo.strip() or "Você foi realocado",
                "mensagem": f"Seu ônibus para hoje é o ônibus {numero_onibus.strip()}. Toque para ver os detalhes.",
                "aviso_id": None,
                "data_criacao": datetime.now(timezone.utc),
            }
            self._eventos.appendleft(evento)
        return evento

    def listar_eventos_recentes(
        self,
        avisos_persistidos: list[dict],
        apos_id: int | None = None,
        limite: int = 10,
    ) -> list[dict]:
        """Combina eventos em memória com avisos persistidos no banco, ordenados do mais recente."""
        por_chave: dict[tuple[str, int], dict] = {}

        with self._lock:
            eventos_memoria = list(self._eventos)

        for evento in eventos_memoria:
            chave = (evento["tipo"], int(evento["id"]))
            por_chave[chave] = evento

        for aviso in avisos_persistidos:
            aviso_id = int(aviso["id"])
            chave = ("aviso", aviso_id)
            if chave not in por_chave:
                evento_persistido = {
                    "id": aviso_id,
                    "tipo": "aviso",
                    "app_nome": APP_NOME_NOTIFICACAO,
                    "titulo": str(aviso["titulo"]),
                    "mensagem": str(aviso["descricao"]),
                    "aviso_id": aviso_id,
                    "data_criacao": _normalizar_data_utc(aviso.get("data_criacao")),
                }
                por_chave[chave] = evento_persistido
                with self._lock:
                    if not any(
                        e["tipo"] == "aviso" and int(e["id"]) == aviso_id
                        for e in self._eventos
                    ):
                        self._eventos.append(evento_persistido)

        itens = list(por_chave.values())
        if apos_id is not None:
            itens = [
                item
                for item in itens
                if (item["tipo"] == "aviso" and int(item["id"]) > apos_id)
                or (item["tipo"] != "aviso" and int(item["id"]) > apos_id)
            ]

        itens.sort(
            key=lambda item: (
                _normalizar_data_utc(item.get("data_criacao")),
                int(item["id"]),
            ),
            reverse=True,
        )
        return itens[: max(1, min(limite, 50))]

    def possui_eventos_em_memoria(self) -> bool:
        """Indica se o buffer em memória já está aquecido, evitando queries desnecessárias ao banco."""
        with self._lock:
            return len(self._eventos) > 0

    @classmethod
    def limpar_eventos_memoria(cls) -> None:
        """Utilitário para isolamento em testes automatizados."""
        with cls._lock:
            cls._eventos.clear()
            cls._sequencia_id = 1_000_000
