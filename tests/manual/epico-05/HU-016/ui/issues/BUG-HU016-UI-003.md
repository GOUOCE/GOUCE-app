# Depois de recarregar, a tela de Distribuição não mostra o dia como distribuído e exibe a sugestão automática no lugar do que está gravado

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `test/execucao-ui-hu-016` — navegador Brave 1.86.148 (Chromium 144.0.7559.133, 64 bits, Linux), front `http://localhost:8081`, API `http://localhost:8216`, commit `0f90c961e484ed1045017d04b1bad15d09b0818c` |
| **Caso relacionado** | `CT-HU016-UI-004` |
| **Documentação** | [HU-016 — Testes manuais de UI](../UI-HU-016.md#ct-hu016-ui-004--confirmar-a-distribuição-e-ver-o-dia-como-distribuído) |
| **Issue relacionada** | [#506](https://github.com/GOUOCE/GOUCE-app/issues/506) |

---

### Pré-condição

Administrador autenticado; 18/11/2026 com 5 reservas (P1 com 4 lugares, P2 com 1), frota V1/V2/V3 e motoristas M1/M2/M3 ativos, sem linhas em `alocacao_diaria` nem `alocacao_aluno`.

### Passos para reproduzir

1. Abrir Distribuição Logística, semana 16–22 de novembro, dia 18/11.
2. Tocar em "Confirmar distribuição" e confirmar no popup. A tela mostra "Distribuição confirmada" e "Status logístico: DISTRIBUIDO". `POST /alocacao-diaria/distribuicao` retorna 201 e o banco fica com 3 linhas em `alocacao_diaria` e 5 em `alocacao_aluno`.
3. Apertar F5 e reabrir 18/11.
4. (Variação) Regravar P1 ida em V3 `HIJ7K89` / M3 por `POST` manual na API (201, `DISTRIBUIDO`; banco com P1 ida e volta em V3/M3), apertar F5, reabrir 18/11 e abrir o lápis de P1.

### ✅ Resultado esperado

- O popup "Confirmar distribuição?" cita a data; desistir não grava nada.
- Confirmar mostra "Distribuição realizada com sucesso" em popup padrão, sem toast preto, e o status logístico do dia passa a distribuído.
- Depois de recarregar (ou em outra sessão), a tela mostra a distribuição **gravada** e não uma nova sugestão automática.

### ❌ Resultado obtido

- Passo 3: a linha "Status logístico: DISTRIBUIDO" não aparece e o botão "Confirmar distribuição" volta ativo; P1/P2 com selo "Alocada". Reproduzido de novo depois de esperar 3 s e ao trocar para 19/11 e voltar para 18/11.
- Passo 4: o lápis de P1 mostra Veículo 1 (Ida) = ABC-1D23 + Carlos Um Silva, que é a sugestão automática; o banco tem HIJ7K89 + Pedro Tres Lima.

```json
{
  "data": "...",
  "demanda_por_rota": [...],
  "alocacoes": [...],
  "excedentes_globais": [...],
  "alertas": [...]
}
```

Chaves da resposta de `GET /alocacao-diaria/distribuicao-automatica?data=2026-11-18`; não há campo `status`, `distribuido` nem `confirmado`.

### ⚠️ Impacto

- O administrador vê a sugestão como se fosse o planejamento gravado, pode confirmar de novo por cima do que já estava distribuído (a API aceitou nova distribuição manual e substituiu as linhas), e não sabe se o dia foi distribuído depois de recarregar.

### Causa aparente

Em `frontend/src/app/(administrador)/logistica/distribuicao.tsx`, `statusLogistico` é `useState('')` preenchido só com a resposta do POST (linha ~185) e renderizado só enquanto não é `''`; `carregarLinhas` (linha ~192) chama sempre a prévia automática, que recalcula do zero. A API não expõe status do dia nem leitura da distribuição gravada na prévia. Pode envolver front e API.

### Critérios de aceite

- O dia distribuído continua marcado como distribuído depois do F5; a tela exibe os ônibus e motoristas gravados e não a sugestão; o botão deixa de sugerir nova distribuição ou avisa que o dia já está distribuído (ajuste ao que o CT/AC permitirem).

### 📎 Evidência

Reproduzido por Radlei em 17/11/2026, ambiente local `atu-ui016`. Prints: popup de confirmação; mensagem de sucesso; Network com `POST` 201; tela de 18/11 depois do F5; lápis de P1 antes e depois da troca manual.

### Segunda reprodução (CT-006, 30/11/2026)

Mesmo defeito reproduzido de novo durante a execução do `CT-HU016-UI-006`, em 30/11/2026:

- Confirmação de P1 (`HIJ-7K89` + Pedro) com `POST` 201 `DISTRIBUIDO`.
- Ao voltar para a lista, o botão de confirmação reaparece e o status some.
- Depois do F5 em 30/11, a tela mostra a sugestão automática (Carlos + Pedro / `ABC1D23` + `HIJ7K89`) em vez do que está gravado.
- No banco, 30/11 ficou com P1 ida V3/M3, P1 volta V3/M3 e P2 ida V2/M2 (ids de `alocacao_diaria` 8, 9 e 10).
- Sintoma adicional: o status "DISTRIBUIDO" fica preso ao trocar de dia, porque `statusLogistico` é um `useState('')` (`distribuicao.tsx:104`) que nunca é resetado ao mudar de data. O risco de sobrescrita não foi testado.

### Reteste

| Campo | Valor |
|---|---|
| **Data** | 18/11/2026 |
| **Build** | `82eac441` (branch `fix/issues-hu16e17`) |
| **Issue** | #506 |
| **Resultado** | ✅ Corrigido — depois do F5 e reabertura de 18/11, a tela mostra "Status logístico: DISTRIBUIDO" e os ônibus/motoristas gravados no banco (confirmado também pela API: `status_logistico`, `distribuicao_persistida: true` e `alocacoes` batendo com `alocacao_diaria`/`alocacao_aluno`). `CT-HU016-UI-004`: 3/3 verificações ✅. O risco de sobrescrita ao trocar de dia sem recarregar não foi testado neste reteste. |
