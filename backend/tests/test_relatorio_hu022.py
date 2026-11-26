import asyncio
import os
import unittest
from datetime import date, time
from typing import Any

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")

from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.alocacao_diaria.model.entities.alocacao import (
    AlocacaoAlunoORM,
    AlocacaoDiariaORM,
)
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.relatorios.application.services.relatorio_service import (
    MENSAGEM_SEM_DADOS,
    RelatorioService,
)
from src.modulos.relatorios.interface.http import relatorio_routes
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.shared.infrastructure.db import Base, get_session
from tests.rota_principal_support import asgi_request


async def asgi_request_raw(app: FastAPI, metodo: str, caminho: str, corpo: Any = None):
    from urllib.parse import urlsplit

    corpo_bruto = b"" if corpo is None else __import__("json").dumps(corpo).encode("utf-8")
    mensagens = []
    enviado = False

    async def receive():
        nonlocal enviado
        if enviado:
            return {"type": "http.disconnect"}
        enviado = True
        return {"type": "http.request", "body": corpo_bruto, "more_body": False}

    async def send(mensagem):
        mensagens.append(mensagem)

    partes = urlsplit(caminho)
    escopo = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.3"},
        "http_version": "1.1",
        "method": metodo,
        "scheme": "http",
        "path": partes.path,
        "raw_path": partes.path.encode(),
        "query_string": partes.query.encode(),
        "headers": [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(corpo_bruto)).encode()),
        ],
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
        "root_path": "",
        "state": {},
    }
    await app(escopo, receive, send)
    inicio = next(m for m in mensagens if m["type"] == "http.response.start")
    resposta = b"".join(
        m.get("body", b"") for m in mensagens if m["type"] == "http.response.body"
    )
    headers = {
        chave.decode("latin-1").lower(): valor.decode("latin-1")
        for chave, valor in inicio["headers"]
    }
    return inicio["status"], headers, resposta


class RelatorioHu022Test(unittest.TestCase):
    def setUp(self):
        tabelas = [
            BairroORM.__table__,
            PontoDeParadaORM.__table__,
            FaculdadeORM.__table__,
            ArquivoORM.__table__,
            UsuarioORM.__table__,
            RotaPrincipalORM.__table__,
            RotaComplementarORM.__table__,
            OnibusORM.__table__,
            MotoristaORM.__table__,
            AlunoORM.__table__,
            AgendamentoORM.__table__,
            AlocacaoDiariaORM.__table__,
            AlocacaoAlunoORM.__table__,
        ]
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine, tables=tabelas)
        self.session = sessionmaker(bind=self.engine)()
        self._semear()
        self.app = FastAPI()
        self.app.include_router(relatorio_routes.router)
        self.app.dependency_overrides[get_session] = lambda: self.session
        self.app.dependency_overrides[relatorio_routes.admin_required] = lambda: {
            "current_user_id": "42",
            "current_roles": ["administrador"],
        }

    def tearDown(self):
        self.app.dependency_overrides.clear()
        self.session.close()
        self.engine.dispose()

    def _semear(self):
        self.session.add_all(
            [
                BairroORM(bairro_id=1, nome="Centro", ativo=True),
                BairroORM(bairro_id=2, nome="Campo Velho", ativo=True),
                PontoDeParadaORM(ponto_id=1, nome="Praça Matriz", bairro_id=1, ativo=True),
                PontoDeParadaORM(ponto_id=2, nome="Terminal IFCE", bairro_id=2, ativo=True),
                FaculdadeORM(
                    id_faculdade=1,
                    nome_faculdade="UFC",
                    sigla="UFC",
                    campus_faculdade="Quixadá",
                    ativo=True,
                ),
                FaculdadeORM(
                    id_faculdade=2,
                    nome_faculdade="IFCE",
                    sigla="IFCE",
                    campus_faculdade="Quixadá",
                    ativo=True,
                ),
                RotaPrincipalORM(
                    id=10,
                    nome="Rota Centro - UFC",
                    horario_saida=time(6, 30),
                    horario_retorno=time(17, 30),
                    ativo=True,
                ),
                MotoristaORM(
                    id=1,
                    nome_completo="João da Silva",
                    telefone="85999999999",
                    telefone_hash="motorista-1",
                    ativo=True,
                ),
            ]
        )
        for aluno_id in (101, 102, 103):
            self.session.add(
                AlunoORM(
                    aluno_id=aluno_id,
                    status_cadastro="ATIVADO",
                    faculdade_id=1,
                    bairro_id=1,
                    id_comprovante_matricula=f"matricula-{aluno_id}",
                    id_comprovante_residencia=f"residencia-{aluno_id}",
                    data_nascimento=0,
                    identificacao_genero="Não informado",
                    tem_filhos=False,
                    curso="Ciência da Computação",
                    raca="Não informada",
                    transgenero="Não",
                    termos_de_uso=True,
                )
            )
        self.session.add_all(
            [
                AgendamentoORM(
                    id=1,
                    aluno_id=101,
                    data=date(2026, 11, 16),
                    usa_ida=True,
                    usa_volta=True,
                    ponto_embarque_id=1,
                    ies_destino_id=1,
                    ies_origem_id=1,
                    ponto_desembarque_id=2,
                    status="ATIVO",
                    presenca_status="PRESENTE",
                ),
                AgendamentoORM(
                    id=2,
                    aluno_id=102,
                    data=date(2026, 11, 16),
                    usa_ida=True,
                    usa_volta=False,
                    ponto_embarque_id=1,
                    ies_destino_id=1,
                    status="ATIVO",
                    presenca_status="FALTA",
                ),
                AgendamentoORM(
                    id=3,
                    aluno_id=103,
                    data=date(2026, 11, 17),
                    usa_ida=False,
                    usa_volta=True,
                    ies_origem_id=2,
                    ponto_desembarque_id=1,
                    status="ATIVO",
                    presenca_status="PRESENTE",
                ),
                AgendamentoORM(
                    id=4,
                    aluno_id=103,
                    data=date(2026, 12, 1),
                    usa_ida=True,
                    usa_volta=False,
                    ponto_embarque_id=1,
                    ies_destino_id=1,
                    status="CANCELADO",
                    presenca_status="PENDENTE",
                ),
            ]
        )
        self.session.add_all(
            [
                AlocacaoDiariaORM(
                    id=1,
                    rota_id=10,
                    onibus_id="ABC1D23",
                    data=date(2026, 11, 16),
                    motorista_id=1,
                    turno="ida",
                ),
                AlocacaoDiariaORM(
                    id=2,
                    rota_id=10,
                    onibus_id="ABC1D23",
                    data=date(2026, 11, 17),
                    motorista_id=1,
                    turno="volta",
                ),
            ]
        )
        self.session.add_all(
            [
                AlocacaoAlunoORM(
                    id=1,
                    alocacao_diaria_id=1,
                    agendamento_id=1,
                    turno="ida",
                    tipo_lugar="sentado",
                    status="ALOCADO",
                ),
                AlocacaoAlunoORM(
                    id=2,
                    alocacao_diaria_id=1,
                    agendamento_id=2,
                    turno="ida",
                    tipo_lugar="em_pe",
                    status="ALOCADO",
                ),
                AlocacaoAlunoORM(
                    id=3,
                    alocacao_diaria_id=2,
                    agendamento_id=3,
                    turno="volta",
                    tipo_lugar="sentado",
                    status="ALOCADO",
                ),
            ]
        )
        self.session.commit()

    def _get(self, caminho: str):
        return asyncio.run(asgi_request(self.app, "GET", caminho))

    def _post(self, caminho: str, corpo: Any):
        return asyncio.run(asgi_request(self.app, "POST", caminho, corpo))

    def test_consolida_agendamentos_presencas_e_rotas(self):
        status, corpo = self._get(
            "/transporte/relatorios?tipo=agendamentos"
            "&data_inicio=2026-11-16&data_fim=2026-11-17"
        )
        self.assertEqual(status, 200)
        self.assertEqual(corpo["consolidado"]["totalAgendamentos"], 3)
        self.assertEqual(corpo["consolidado"]["totalEmbarques"], 2)
        self.assertEqual(corpo["consolidado"]["totalFaltas"], 1)
        self.assertEqual(corpo["consolidado"]["comparecimento"], "66,7%")
        self.assertEqual(corpo["consolidado"]["porcentagemFaltas"], "33,3%")
        self.assertEqual(corpo["consolidado"]["rotaMaiorDemanda"], "Rota Centro - UFC")
        self.assertEqual(corpo["filtrosResumo"]["faculdadeLabel"], "Todas as faculdades")
        self.assertEqual(corpo["filtrosResumo"]["bairroLabel"], "Todos os bairros")
        self.assertEqual(len(corpo["detalhamento"]), 2)
        self.assertEqual(corpo["detalhamento"][0]["agendados"], 2)
        self.assertEqual(corpo["detalhamento"][0]["embarques"], 1)
        self.assertEqual(corpo["detalhamento"][0]["faltas"], 1)
        self.assertEqual(corpo["detalhamento"][0]["faculdade"], "UFC")
        self.assertEqual(corpo["detalhamento"][0]["bairro"], "Centro")

    def test_relatorio_motoristas_soma_dias_e_rotas_por_motorista(self):
        status, corpo = self._get(
            "/transporte/relatorios?tipo=motoristas"
            "&data_inicio=2026-11-16&data_fim=2026-11-17"
        )
        self.assertEqual(status, 200)
        self.assertEqual(len(corpo["motoristas"]), 1)
        motorista = corpo["motoristas"][0]
        self.assertEqual(motorista["nome"], "João da Silva")
        self.assertEqual(motorista["diasTrabalhados"], 2)
        self.assertEqual(motorista["rotas"], ["Rota Centro - UFC"])
        self.assertEqual(len(motorista["escalas"]), 2)

    def test_filtro_faculdade_ida_e_volta(self):
        status, corpo = self._get(
            "/transporte/relatorios?data_inicio=2026-11-16&data_fim=2026-11-17"
            "&faculdade_id=1"
        )
        self.assertEqual(status, 200)
        self.assertEqual(corpo["consolidado"]["totalAgendamentos"], 2)
        self.assertEqual(corpo["filtrosResumo"]["faculdadeLabel"], "UFC")

        status_volta, corpo_volta = self._get(
            "/transporte/relatorios?data_inicio=2026-11-16&data_fim=2026-11-17"
            "&faculdade_id=2"
        )
        self.assertEqual(status_volta, 200)
        self.assertEqual(corpo_volta["consolidado"]["totalAgendamentos"], 1)
        self.assertEqual(corpo_volta["filtrosResumo"]["faculdadeLabel"], "IFCE")

    def test_filtro_bairro_embarque_e_desembarque(self):
        status, corpo = self._get(
            "/transporte/relatorios?data_inicio=2026-11-16&data_fim=2026-11-17"
            "&bairro_id=1"
        )
        self.assertEqual(status, 200)
        self.assertEqual(corpo["consolidado"]["totalAgendamentos"], 3)
        self.assertEqual(corpo["filtrosResumo"]["bairroLabel"], "Centro")

        status_campo, corpo_campo = self._get(
            "/transporte/relatorios?data_inicio=2026-11-16&data_fim=2026-11-17"
            "&bairro_id=2"
        )
        self.assertEqual(status_campo, 200)
        self.assertEqual(corpo_campo["consolidado"]["totalAgendamentos"], 1)

    def test_periodo_invertido_retorna_422_com_campos(self):
        status, corpo = self._get(
            "/transporte/relatorios?data_inicio=2026-11-20&data_fim=2026-11-16"
        )
        self.assertEqual(status, 422)
        locais = [item["loc"] for item in corpo["detail"]]
        self.assertIn(["query", "data_fim"], locais)
        self.assertIn(["query", "data_inicio"], locais)

    def test_sem_dados_retorna_mensagem_oficial(self):
        status, corpo = self._get(
            "/transporte/relatorios?data_inicio=2026-10-01&data_fim=2026-10-20"
        )
        self.assertEqual(status, 200)
        self.assertEqual(corpo["mensagem"], MENSAGEM_SEM_DADOS)
        self.assertEqual(corpo["consolidado"]["totalAgendamentos"], 0)
        self.assertEqual(corpo["consolidado"]["comparecimento"], "0,0%")

    def test_exportacao_csv_e_pdf(self):
        relatorio = RelatorioService(self.session).gerar(
            tipo="agendamentos",
            data_inicio=date(2026, 11, 16),
            data_fim=date(2026, 11, 17),
        )

        status_csv, headers_csv, conteudo_csv = asyncio.run(
            asgi_request_raw(
                self.app,
                "POST",
                "/transporte/relatorios/exportar?formato=csv",
                relatorio,
            )
        )
        self.assertEqual(status_csv, 200)
        self.assertIn("text/csv", headers_csv["content-type"])
        self.assertIn('filename="relatorio-agendamentos.csv"', headers_csv["content-disposition"])
        texto_csv = conteudo_csv.decode("utf-8-sig")
        self.assertIn("Relatório de Agendamentos", texto_csv)
        self.assertIn("Rota Centro - UFC", texto_csv)
        self.assertIn("João da Silva", texto_csv)

        status_pdf, headers_pdf, conteudo_pdf = asyncio.run(
            asgi_request_raw(
                self.app,
                "POST",
                "/transporte/relatorios/exportar?formato=pdf",
                relatorio,
            )
        )
        self.assertEqual(status_pdf, 200)
        self.assertEqual(headers_pdf["content-type"], "application/pdf")
        self.assertTrue(conteudo_pdf.startswith(b"%PDF-1.4"))
        self.assertTrue(conteudo_pdf.rstrip().endswith(b"%%EOF"))

    def test_acesso_negado_para_perfil_nao_administrador(self):
        def negado():
            raise HTTPException(status_code=403, detail="Acesso negado")

        self.app.dependency_overrides[relatorio_routes.admin_required] = negado
        status, _ = self._get(
            "/transporte/relatorios?data_inicio=2026-11-16&data_fim=2026-11-17"
        )
        self.assertEqual(status, 403)


if __name__ == "__main__":
    unittest.main()
