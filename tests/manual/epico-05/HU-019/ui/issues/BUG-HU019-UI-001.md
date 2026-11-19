# Quando a consulta de alocação falha, a Agenda mostra "Aguardando alocação do veículo" para o aluno que já está alocado

| Campo | Valor |
|---|---|
| **Tipo** | Bug funcional |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `test/execucao-ui-hu-019` — navegador web (versão web do app), URL do front `http://localhost:3121`, API `http://localhost:8121`, commit `6059f33bc0afb6a935e5bdf345716a06f92bbfb7` |
| **Caso relacionado** | `CT-HU019-UI-008` |
| **Documentação** | [HU-019 — Testes manuais de UI](../UI-HU-019.md#ct-hu019-ui-008--falha-na-consulta-da-alocação-offline-e-troca-de-conta) |
| **Issue relacionada** | Nenhuma identificada. |

---

### Pré-condição

Aluna Alice Almeida (`alice@qa.gouce.app`), com reserva em 20/11/2026 já alocada (ida e volta no V3 HIJ7K89, motorista Mauro Beta) e a Agenda já sincronizada. Para derrubar só a consulta de alocação, a tabela `alocacao_diaria` do banco local foi renomeada por alguns segundos: `GET /alocacao-diaria/minha-viagem` passa a devolver 500, e `GET /transporte/agendamentos/meus` continua em 200.

### Passos para reproduzir

1. Entrar como a Alice e abrir a Agenda, confirmando "Alocação confirmada" no cartão de 20/11/2026.
2. Com a rede ligada, fazer a consulta de alocação falhar (500), como descrito na pré-condição.
3. Recarregar a Agenda e olhar o cartão de 20/11/2026.

### ✅ Resultado esperado

A tela não afirma "Aguardando alocação do veículo" para um aluno que já está alocado: informa que a consulta está indisponível ou mantém os dados já sincronizados com indicação (HU-019, AC-02 e AC-04; CT-HU019-UI-008).

### ❌ Resultado obtido

O cartão de 20/11/2026 mostra "Aguardando alocação do veículo" na ida e na volta, sem nenhum aviso de falha. Com a tabela restaurada e a Agenda recarregada, a alocação voltou (V3 - Placa HIJ7K89, Mauro Beta). Offline (API parada) a Agenda mostra o banner "Visualização Offline (Dados salvos no dispositivo)" e mantém a alocação; o problema ocorre só quando a API responde com erro.

```json
{
  "GET /alocacao-diaria/minha-viagem?data=2026-11-20": "500 Internal Server Error",
  "GET /transporte/agendamentos/meus": "200 OK"
}
```

### ⚠️ Impacto

- O aluno que já tem ônibus passa a acreditar que ainda não foi alocado e pode perder a viagem; é o único momento em que a consulta de alocação é decisiva.
- O mesmo texto aparece para quem realmente não foi alocado, então o aluno não distingue falha de ausência de alocação.
- O resultado errado é gravado no cache da Agenda (`@GOUOCE:meus_agendamentos`), podendo persistir até a próxima consulta bem-sucedida.

### Causa aparente

Em `frontend/src/services/agendamentoService.ts`, `obterMinhaViagem` captura qualquer erro e devolve `null`; `enriquecerDetalheComMinhaViagem` devolve a reserva sem alocação quando recebe `null`, e a tela interpreta isso como "Aguardando alocação do veículo". O resultado é salvo no cache da Agenda logo depois.

### Critérios de aceite

- Falha na consulta de alocação (erro de servidor ou rede) não mostra "Aguardando alocação do veículo" para quem já está alocado: a tela informa indisponibilidade ou mantém o último dado sincronizado com indicação.
- O dado errado não é gravado no cache da Agenda.
- Reexecutar `CT-HU019-UI-008`, partes 1 a 3.

### 📎 Evidência

Reproduzido por Cauan Ricardo em 19/11/2026, ambiente local `atu-exec-hu019` (stack Docker isolada, banco novo, fuso America/Fortaleza). Prints do testador a anexar na issue, sem tokens nem dados pessoais.

### Reteste

| Campo | Valor |
|---|---|
| **Data** | 19/11/2026 |
| **Build** | branch `fix/hu019-issue-530-falha-consulta-alocacao`, web `http://localhost:3122`, API `http://localhost:8121` |
| **Issue** | #530 |
| **Resultado** | ✅ Corrigido — Com a consulta de alocação quebrada (`minha-viagem` 500) e a Agenda recarregada, os dias alocados mostram “Não foi possível consultar a alocação agora” em selo âmbar, e não “Aguardando alocação do veículo”; o 23/11, que de fato não tem distribuição, continua “Aguardando alocação do veículo”. Com a consulta restaurada a alocação volta, e o cache offline mantém a alocação já sincronizada (relato de Cauan; build `fix/hu019-issue-530-falha-consulta-alocacao`, web `http://localhost:3122`). |
