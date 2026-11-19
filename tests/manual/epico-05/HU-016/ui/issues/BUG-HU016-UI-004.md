# Aviso de alunos excedentes mostra "Agendamento #30" em vez do nome do aluno

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `test/execucao-ui-hu-016` — navegador Brave 1.86.148 (Chromium 144.0.7559.133, 64 bits, Linux), front `http://localhost:8081`, API `http://localhost:8216`, commit `0f90c961e484ed1045017d04b1bad15d09b0818c` |
| **Caso relacionado** | `CT-HU016-UI-005` |
| **Documentação** | [HU-016 — Testes manuais de UI](../UI-HU-016.md#ct-hu016-ui-005--confirmar-com-excedentes-aviso-com-a-lista-dos-alunos) |
| **Issue relacionada** | [#507](https://github.com/GOUOCE/GOUCE-app/issues/507) (relato); [#475](https://github.com/GOUOCE/GOUCE-app/issues/475) (API, confirmação não informa os excedentes) e `BUG-HU016-UI-003` (tela lê a prévia recalculada) |

---

### Pré-condição

Administrador autenticado; dia 27/11/2026 com 6 reservas de P1 na ida (alunos A, B, C, R1, R_inativo e Aluno H Um Farias, id 17, agendamento 30); só V1 `ABC1D23` e M1 Carlos Um Silva ativos (V2, V3, M2 e M3 inativados pela API); sem linhas em `alocacao_diaria` e `alocacao_aluno` no dia.

### Passos para reproduzir

1. Abrir Distribuição Logística em 27/11.
2. Abrir o lápis de P1 e tocar em "Ver alunos excedentes".
3. Voltar, tocar em Confirmar distribuição e confirmar.
4. Abrir de novo a tela de excedentes pelo ícone vermelho do card.

### ✅ Resultado esperado

- O aviso lista os alunos excedentes com nome legível, não só com o número do agendamento.

### ❌ Resultado obtido

- O card mostra "Superlotada" e "1 aluno(s) excedente(s)".
- A tela "Alunos Excedentes" (`/logistica/excedentes?linhaId=1&dataIso=2026-11-27`) lista "Agendamento #30 — Turno de ida" com avatar "ID". O aluno é Aluno H Um Farias, mas o nome não aparece.
- Depois de confirmar, a tela continua igual e o popup de sucesso não cita o excedente (resposta do `POST` com `excedentes: []`, já registrado na #475).
- Banco: 5 linhas `ALOCADO` em `alocacao_aluno` (ag.25 a 29) e nenhuma para o ag.30.

```json
{
  "excedentes_globais": [
    {"agendamento_id": "...", "turno": "..."}
  ]
}
```

Chaves de `excedentes_globais` na resposta de `GET /alocacao-diaria/distribuicao-automatica?data=2026-11-27`; não há campo de nome do aluno — a causa não é só do front.

### ⚠️ Impacto

- O administrador não identifica quem ficou de fora e precisa disso para realocar o aluno.

### Causa aparente

Hipótese: em `frontend/src/services/logisticaService.ts:348`, `obterExcedentes` monta `nome: \`Agendamento #${item.agendamento_id}\``; `excedentes.tsx:44` chama `obterExcedentes`, que lê a prévia (`GET /alocacao-diaria/distribuicao-automatica`, `logisticaService.ts:194`), não o que foi gravado. Como a prévia não traz o nome do aluno em `excedentes_globais` (bloco acima), a causa também é da API.

### Critérios de aceite

- O aviso e a tela de excedentes mostram o nome do aluno (e o turno) em vez do id do agendamento.

### 📎 Evidência

Reproduzido por Radlei em 17/11/2026, ambiente local `atu-ui016`. Prints: do card de P1 com excedente, da tela de Excedentes ("Agendamento #30"), do popup de confirmação ("6 aluno(s)"), do sucesso e do corpo do POST.

### Reteste

| Campo | Valor |
|---|---|
| **Data** | 18/11/2026 |
| **Build** | `82eac441` (branch `fix/issues-hu16e17`) |
| **Issue** | #507 |
| **Resultado** | ✅ Corrigido — a tela de Excedentes e a prévia da API mostram "Aluno H Um Farias" em vez de "Agendamento #30" (backend enriquece `excedentes_globais` com `nome_aluno`). Verificação 3 ("Aguardando alocação do veículo") também executada e passou. O `POST` de confirmação continua com `excedentes: []` (lacuna da #475, fora do escopo). `CT-HU016-UI-005`: 3/3 verificações ✅. |
