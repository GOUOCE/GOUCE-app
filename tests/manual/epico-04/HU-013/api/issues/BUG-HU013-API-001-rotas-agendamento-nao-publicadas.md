# API da HU-013 retorna 404 em todas as operações de agendamento

| Campo | Valor |
| --- | --- |
| Status | ✅ Corrigido — publicado como [#399](https://github.com/GOUOCE/GOUCE-app/issues/399); correção no commit `305ca252` da `feature/front-hu013`; CT-001 reexecutado e aprovado em 10/11/2026 no commit `0c0a079c` |
| Tipo | Bug de integração funcional |
| Severidade | 🟠 Alta — bloqueia a execução funcional da HU-013 |
| Ambiente | Backend `feature/front-hu013`, commit `ee305857954fcb23f3919f3ebfe7e163fcbc167a`; Docker isolado `atu-qa-hu013`, `http://127.0.0.1:8013` |
| Branch do relato | `feature/testes-api-hu-013`, criada da develop `4e44913d` |
| Caso relacionado | CT-HU013-API-001; CT-002 a CT-012 bloqueados |
| Documentação | [Suíte HU-013](../API-HU-013.md#ct-hu013-api-001--api-publicada-na-aplicação-real) |
| Evidência | [Resumo JSON](../EVIDENCIAS-HU-013.json) |

### Pré-condição

API iniciada pelo `main:app` real da feature indicada, com todas as migrations aplicadas em banco vazio até `80_remove_horarios_agendamento`. `/health` e `/openapi.json` retornam 200. Aluno A sintético aprovado, ativo e com vínculo válido, autenticado por `/auth/login` (200). Bairro/ponto/IES e rota principal ativa preparados pela API administrativa (201), atendendo ida e volta.

### Passos para reproduzir

1. Subir o backend exato de `feature/front-hu013` `ee305857`, sem modificações, e autenticar o aluno aprovado.
2. Com o token retornado, enviar `GET /transporte/agendamentos/meus` e `GET /transporte/agendamentos/calendario?mes=2026-11`.
3. Enviar POST válido para `/transporte/agendamentos`, usando data útil na janela e ids reais de ponto/IES atendidos pela rota. Na massa desta rodada:

   ```json
   {
     "data": "2026-11-10",
     "usa_ida": true,
     "usa_volta": true,
     "ponto_embarque_id": 1,
     "ies_destino_id": 1,
     "ies_origem_id": 1,
     "ponto_desembarque_id": 1
   }
   ```

4. Conferir os caminhos da HU-013 no OpenAPI e a quantidade de registros em `agendamento`.

### ✅ Resultado esperado

As operações do módulo de agendamentos estão publicadas na aplicação real: GETs retornam 200 e o POST válido cria a reserva com 200 e “Agendamento realizado com sucesso”, conforme RF-015, HU-013 e o contrato do módulo.

### ❌ Resultado obtido

As sete chamadas de diagnóstico retornaram **HTTP 404** com:

```json
{
  "detail": "Not Found"
}
```

| Método | Caminho | HTTP |
| --- | --- | ---: |
| GET | `/transporte/agendamentos/meus` | 404 |
| GET | `/transporte/agendamentos/calendario?mes=2026-11` | 404 |
| GET | `/transporte/agendamentos/999999999` | 404 |
| POST | `/transporte/agendamentos` | 404 |
| PUT | `/transporte/agendamentos/999999999` | 404 |
| GET | `/agendamentos/opcoes` (caminho usado pelo front) | 404 |
| GET | `/transporte/agendamentos/opcoes` | 404 |

Nenhuma rota contendo `agendamento` aparece no OpenAPI. A tabela `agendamento` permanece com zero registros antes/depois, assim como a auditoria dessa entidade. O 404 em id inexistente foi interpretado junto à ausência da operação no OpenAPI; não foi contado como proteção de recurso aprovada.

### ⚠️ Impacto

- O aluno não consegue agendar pela API desse commit, mesmo com autenticação e referências válidas.
- Os testes de regras de negócio, janela, limite, concorrência e edição ficam bloqueados antes de atingir a lógica do módulo.
- A indisponibilidade foi agrupada em um defeito de integração, sem tratar cada regra bloqueada como uma nova falha.

### Causa aparente

No commit testado, `backend/main.py` não importa nem registra `agendamento_router` em `app.include_router(...)`, embora o arquivo `backend/src/modulos/agendamentos/interface/http/agendamento_routes.py` exista. O caminho de opções consumido pelo front também precisa ser conferido no contrato final. Nenhuma correção foi aplicada nesta execução de QA.

### Critérios de aceite

- A aplicação real publica as operações da HU-013 e o OpenAPI as apresenta.
- Um aluno aprovado consegue consultar a agenda e criar reserva válida por HTTP, com persistência real.
- O caminho de opções usado pelo front corresponde a uma operação efetivamente disponível.
- Reexecutar CT-HU013-API-001 e, com a integração disponível, CT-002 a CT-012. Os casos bloqueados não estão aprovados por este relato.

### 📎 Evidência

Reproduzido pela LLM em 09/11/2026, America/Fortaleza. Respostas relevantes, estado do banco e precondições estão no JSON vinculado. Relato local para revisão de Cauan; nenhuma issue foi publicada no GitHub nesta entrega.
