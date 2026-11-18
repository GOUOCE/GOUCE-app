# Tela de alocação não avisa ônibus/motorista já usados por outra rota no mesmo turno; o conflito só é recusado ao confirmar, com mensagem técnica

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `test/execucao-ui-hu-016` — navegador Brave 1.86.148 (Chromium 144.0.7559.133, 64 bits, Linux), front `http://localhost:8081`, API `http://localhost:8216`, commit `0f90c961e484ed1045017d04b1bad15d09b0818c` |
| **Caso relacionado** | `CT-HU016-UI-006` |
| **Documentação** | [HU-016 — Testes manuais de UI](../UI-HU-016.md#ct-hu016-ui-006--trocar-ônibus-e-motorista-antes-de-confirmar) |
| **Issue relacionada** | [#508](https://github.com/GOUOCE/GOUCE-app/issues/508) |

---

### Pré-condição

Administrador autenticado; 30/11/2026 sem nada gravado (`alocacao_diaria` e `alocacao_aluno` em 0/0); sugestão automática com P1 ida V1/M1, P1 volta V3/M3 e P2 ida V2/M2.

### Passos para reproduzir

1. Abrir `/logistica/alocar?linhaId=1&data=2026-11-30`.
2. Abrir a lista de ônibus e a de motoristas da Ida.
3. Escolher `HIJ-7K89` e Marcos Dois Souza.
4. Tocar em "Confirmar alocação" e depois em "Confirmar".

### ✅ Resultado esperado

- Ônibus e motorista já alocados a outra rota no mesmo turno não aparecem como disponíveis (RN-003 e RN-002) ou geram o alerta de indisponibilidade.

### ❌ Resultado obtido

- As listas mostram `DEF-4G56` e Marcos Dois Souza, usados por P2 na ida; nenhum alerta ao escolher; o botão fica ativo.
- Ao confirmar aparece "Erro na alocação: alocação 2: motorista 2 conflitante no turno ida."
- `POST /alocacao-diaria/distribuicao` responde 409 com `code: DISTRIBUICAO_INVALIDA`.
- Nada é gravado: `alocacao_diaria` e `alocacao_aluno` em 0/0.

```json
{
  "success": false,
  "error": {
    "code": "DISTRIBUICAO_INVALIDA",
    "message": "alocação 2: motorista 2 conflitante no turno ida."
  }
}
```

### ⚠️ Impacto

- O administrador só descobre o conflito no final, depois de montar toda a seleção.
- A mensagem mostra posição no array e id ("alocação 2: motorista 2"), não nomes de rota e de motorista.
- O backend protege a integridade: nada é gravado quando há conflito.

### Causa aparente

Em `frontend/src/app/(administrador)/logistica/alocar.tsx:115-125`, a tela filtra só a rota aberta (`linhaId`); `obterOpcoesOnibus`/`obterOpcoesMotoristas` (linhas 168-186) só descontam o que já está usado dentro desse conjunto filtrado, sem ver a alocação de P2. A validação do dia inteiro só existe no backend, em `backend/src/modulos/alocacao_diaria/application/services/alocacao_service.py:149` (índice da alocação) e `162-166` (mensagens de conflito de ônibus/motorista).

### Critérios de aceite

- A lista de ônibus/motoristas não oferece recurso já usado por outra rota no mesmo turno, ou avisa ao escolher.
- A mensagem de erro cita a rota e o nome do recurso, não o índice do array e o id.

### 📎 Evidência

Reproduzido por Radlei em 18/11/2026, ambiente local `atu-ui016`.

Observação: o passo 3 do CT (gravar V3 e M2 para P1) não era executável porque M2 está em P2 na ida; foi verificado em seguida com V3 e M3 (201, grava P1 ida e volta em V3/M3 e mantém P2 em V2/M2).

Prints anexados na issue: listas de ônibus e de motoristas da Ida abertas (DEF-4G56 e Marcos Dois Souza visíveis); tela com HIJ-7K89 e Marcos escolhidos, sem alerta e com o botão ativo; pop-up Erro na alocação; Response do 409; Network com 409, 401, refresh e 201.
