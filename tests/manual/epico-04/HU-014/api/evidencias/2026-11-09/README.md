# Execução de API — HU-014 — 09/11/2026

**Resultado: 9 casos passaram e 1 ficou parcial.** Foram registradas **130 requisições HTTP** (incluindo preparação via API) e **216 verificações satisfeitas**. Nenhuma falha funcional foi reproduzida nas partes verificadas. O CT-010 não foi aprovado integralmente: a alocação veículo/dia das HU-016/018 não existe nesta base.

## Ambiente e rastreabilidade

- Branch: `feature/testes-api-hu-014`, criada da `develop` em `e498c651c326038ccc1c613a7c6896acb30fc1bc`. O planejamento já estava integrado nessa base.
- Código de produto testado: backend desse mesmo commit, sem alterações. Árvore Git do backend: `65df87b14c0d04a52f54fda2d036dd6ecdb4a8d7`.
- Containers da rodada: projeto **`atu-qa-hu014-oficial`**, com rede e volumes próprios. API em **`http://127.0.0.1:8014`**; cliente de execução em processo separado dentro do container, via TCP para o Uvicorn real em `127.0.0.1:8000`.
- PostgreSQL **15.17**, Python **3.11.17**, FastAPI **0.115.6**, SQLAlchemy **2.0.38**, Pydantic **2.10.6**, Alembic **1.14.0**. Detalhes em [ambiente.json](ambiente.json).
- D = **09/11/2026** no fuso **America/Fortaleza**. A janela observada termina em **08/12/2026**. Cada chamada registra sua duração; cada caso registra o horário de conclusão.
- Banco novo, migrado desde `000_schema_inicial` até `80_remove_horarios_agendamento`, sem `create_all`, `stamp` ou reaproveitamento de banco de demonstração. [Migrations e marca da falha controlada](migrations-e-falha-controlada.txt).
- [Contrato OpenAPI coletado](contrato.json), [mapa de massa](massa.json), [preparação e perfis confirmados no login](preparacao.json) e [manifesto SHA-256](manifesto.json).

Uma rodada piloto foi usada para calibrar o executor (domínio de e-mail sintético aceito pelo validador e leitura do tipo físico de `log_auditoria.entidade_id`). A rodada oficial partiu de **novos volumes e banco limpo**; o piloto não foi contado como execução dos casos e não gerou relato de bug de produto.

## Resultado por caso

| Caso | Resultado | HTTP registrados | Verificações | Evidência |
| --- | --- | ---: | ---: | --- |
| CT-001 — lista e isolamento | ✅ Passou | 11 | 16 | [JSON](CT-HU014-API-001.json) |
| CT-002 — calendário | ✅ Passou | 8 | 23 | [JSON](CT-HU014-API-002.json) |
| CT-003 — detalhes e propriedade | ✅ Passou | 7 | 15 | [JSON](CT-HU014-API-003.json) |
| CT-004 — cancelamento futuro | ✅ Passou | 15 | 34 | [JSON](CT-HU014-API-004.json) |
| CT-005 — hoje sem corte de horário | ✅ Passou | 15 | 27 | [JSON](CT-HU014-API-005.json) |
| CT-006 — proteção do passado | ✅ Passou | 4 | 9 | [JSON](CT-HU014-API-006.json) |
| CT-007 — repetição/dono/id inválido | ✅ Passou | 8 | 12 | [JSON](CT-HU014-API-007.json) |
| CT-008 — autenticação e autorização | ✅ Passou | 23 | 24 | [JSON](CT-HU014-API-008.json) |
| CT-009 — limite e reagendamento | ✅ Passou | 31 | 40 | [JSON](CT-HU014-API-009.json) |
| CT-010 — integridade | ⚠️ Parcial | 8 | 16 | [JSON](CT-HU014-API-010.json) |
| **Total** | **9 passaram; 1 parcial** | **130** | **216** | **Sem pendências de execução nas partes disponíveis** |

Os números de verificações são subitens de conferência do executor, não casos adicionais. Cada JSON contém método/caminho, ator, corpo sem credenciais, HTTP, resposta, tempo, checagens e snapshots. Login e tokens não são armazenados. Um HTTP 500 foi **provocado intencionalmente** no CT-010 e é o resultado esperado daquela variação, sem ser contabilizado como bug inesperado.

## Preparação e limites da conclusão

Contas A/B, pendente e vínculo vencido são fixtures sintéticas com criptografia/hash reais, autenticadas pelo endpoint real. Documentos da fixture são apenas referências sintéticas exigidas pelo modelo, sem conteúdo pessoal. Bairro/ponto/IES/rota e reservas futuras foram criados por HTTP. Histórico de ontem e feriado/recesso foram preparados diretamente somente no PostgreSQL isolado, conforme as pré-condições.

O cenário sem rota do CT-002 foi coletado antes da criação da rota; a mudança de mês foi verificada com reserva temporária em 01/12. Para o CT-005, mudou-se o horário da rota de teste pela API: primeiro 23:30 (ainda futuro na hora da chamada), depois 00:00 (já passado). As duas reservas de hoje foram canceladas com 200 e os horários da rota foram restaurados, sem mudar o relógio do sistema.

No CT-010, um trigger temporário na auditoria levantou uma exceção antes do commit do cancelamento. Novas consultas ao banco comprovaram rollback da reserva/log/contador; depois de remover trigger e função, o mesmo DELETE persistiu com sucesso. A ausência da instrumentação foi conferida. Essa evidência comprova a atomicidade disponível para **reserva e auditoria**, mas não comprova liberação/rollback de **alocação real**, porque `remove_allocations` é um gancho sem efeito e não há tabela de alocação nessa base. Essa parte permanece bloqueada dentro do caso parcial.

Tempos de referência: **GET 24,354 ms** e **DELETE 31,269 ms**, em HTTP local. Ambos estão abaixo de 3 s nessa condição; não são teste de carga nem medição completa de renderização móvel. UI e falha de rede no dispositivo não foram executadas; pertencem à suíte manual de Cauan.

Os esperados da [suíte](../../API-HU-014.md) foram preservados. Não foram abertas issues para riscos de leitura nem para a dependência de alocação já identificada. [Roteiro de reprodução](../../execucao/README.md). Os containers de QA foram parados ao final, com os volumes preservados para revisão; os outros ambientes da máquina não foram alterados.
