# Seletor de ônibus mostra a capacidade sem rótulo, e a prévia a chama de "Capacidade Máxima"

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

Administrador autenticado. Rota Centro - UFC em 19/11/2026 com a escala distribuída.

### Passos para reproduzir

1. Abrir Logística → Distribuição Logística, escolher 19/11/2026 e abrir a alocação da Rota Centro - UFC.
2. Olhar o campo "Ônibus Vinculado" de um veículo, por exemplo "V1 - ABC-1D23 (3 sentados + 2 em pé)".
3. Descer até a "Prévia da distribuição" e comparar com "Quantidade Atual" e "Capacidade Máxima".

### ✅ Resultado esperado

O texto do seletor deixa claro que "(3 sentados + 2 em pé)" é a capacidade do ônibus, com o mesmo nome usado na prévia.

### ❌ Resultado obtido

No seletor, os números aparecem entre parênteses sem rótulo; na prévia o mesmo dado chama "Capacidade Máxima" e "Quantidade Atual" é a ocupação. O administrador que viu o seletor perguntou se aquilo era a capacidade.

### ⚠️ Impacto

- Informação ambígua para quem escolhe o ônibus; não impede a escala.

### Causa aparente

`frontend/src/app/(administrador)/logistica/alocar.tsx`: o rótulo das opções de ônibus vem de `logisticaService` sem a palavra "capacidade"; a prévia usa "Capacidade Máxima" (linha ~532).

### Critérios de aceite

- O seletor identifica os números como capacidade (por exemplo, "capacidade: 3 sentados + 2 em pé").
- Reexecutar `CT-HU017-UI-001`.

### 📎 Evidência

Reproduzido por Cauan Ricardo em 18/11/2026, ambiente local `atu-exec-hu017` (stack Docker isolada, banco novo, fuso America/Fortaleza). Prints do testador a anexar na issue, sem tokens nem dados pessoais.

### Reteste

| Campo | Valor |
|---|---|
| **Data** | 18/11/2026 |
| **Build** | branch `fix/hu017-issues-522-525`, web `http://localhost:3118`, API `http://localhost:8118` |
| **Issue** | #525 |
| **Resultado** | ✅ Corrigido — O seletor mostra “(capacidade: 3 sentados + 2 em pé)”. Observação do Cauan: a organização do campo pode melhorar depois, como melhoria de UX. |
