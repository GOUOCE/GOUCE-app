# No turno de volta, a prévia da alocação mostra "Horário de Saída" da ida junto com o horário de volta

| Campo | Valor |
|---|---|
| **Tipo** | Bug de interface (UX) |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `test/execucao-ui-hu-017` — navegador web (versão web do app), URL do front `http://localhost:3117`, API `http://localhost:8117`, commit `a4606b39c93ae4cce16fc0d1551815c51a24803d` |
| **Caso relacionado** | `CT-HU017-UI-001` |
| **Documentação** | [HU-017 — Testes manuais de UI](../UI-HU-017.md#ct-hu017-ui-001--abrir-a-alocação-da-rota-com-ônibus-e-motorista-no-mesmo-formulário) |
| **Issue relacionada** | Nenhuma identificada |

---

### Pré-condição

Administrador autenticado. Rota Centro - UFC em 19/11/2026 com ida e volta distribuídas (horário de saída 06:30 e de retorno 17:30).

### Passos para reproduzir

1. Abrir Logística → Distribuição Logística, escolher 19/11/2026 e abrir a alocação da Rota Centro - UFC.
2. Descer até o veículo do turno Volta (selo "Volta") e olhar a "Prévia da distribuição".
3. Comparar com o veículo do turno Ida.

### ✅ Resultado esperado

Cada turno mostra o horário que lhe corresponde: a ida usa o horário de saída e a volta usa o horário de retorno, como na consulta do aluno (BDD da HU-019 e README do épico 05).

### ❌ Resultado obtido

Todos os veículos mostram os dois campos, "Horário de Saída 06:30" e "Horário de Volta 17:30", mesmo no veículo do turno Volta; o 06:30 não é um horário da volta.

### ⚠️ Impacto

- O administrador pode ler o horário da manhã como se fosse do veículo de volta.
- Não impede a escala; é só clareza da informação.

### Causa aparente

`frontend/src/app/(administrador)/logistica/alocar.tsx`, linhas 541–546: sempre `rota?.horario_saida` e `rota?.horario_retorno`, sem considerar o turno do formulário. O BDD da HU-017 não define esses campos, por isso o relato é de UX.

### Critérios de aceite

- O veículo da ida mostra só o horário de saída e o da volta só o horário de retorno (ou os rótulos deixam claro a que turno cada um pertence).
- Reexecutar `CT-HU017-UI-001`.

### 📎 Evidência

Reproduzido por Cauan Ricardo em 18/11/2026, ambiente local `atu-exec-hu017` (stack Docker isolada, banco novo, fuso America/Fortaleza). Prints do testador a anexar na issue, sem tokens nem dados pessoais.

### Reteste

| Campo | Valor |
|---|---|
| **Data** | 18/11/2026 |
| **Build** | branch `fix/hu017-issues-522-525`, web `http://localhost:3118`, API `http://localhost:8118` |
| **Issue** | #524 |
| **Resultado** | ✅ Corrigido — Cada veículo mostra um horário só, centralizado: “Horário de Saída” na ida e “Horário de Retorno” na volta. |
