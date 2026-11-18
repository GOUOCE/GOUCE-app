# Histórico mostra botões para editar e confirmar a distribuição de dias passados

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito |
| **Severidade** | 🟡 Média |
| **Ambiente** | Branch `test/execucao-ui-hu-016` — navegador Brave 1.86.148 (Chromium 144.0.7559.133, 64 bits, Linux), front `http://localhost:8081`, API `http://localhost:8216`, commit `0f90c961e484ed1045017d04b1bad15d09b0818c` |
| **Caso relacionado** | `CT-HU016-UI-002` |
| **Documentação** | [HU-016 — Testes manuais de UI](../UI-HU-016.md#ct-hu016-ui-002--selecionar-o-dia-e-ver-a-demanda-por-rota) |
| **Issue relacionada** | [#505](https://github.com/GOUOCE/GOUCE-app/issues/505) |

---

### Pré-condição

Administrador autenticado. A massa foi criada direto no banco por não haver outra forma de ter um dia passado com demanda: tabela `agendamento`, `aluno_id=2`, `data=2026-11-10`, `usa_ida=true`, `usa_volta=false`, `ponto_embarque_id=1`, `ies_destino_id=1`, `status=ATIVO` (id 10). A API devolve P1 com 1 aluno para 10/11.

### Passos para reproduzir

1. Abrir Distribuição Logística, aba Histórico.
2. Abrir os dias 10/11 e 11/11.
3. Observar os cards.
4. Tocar no lápis de P1 em 10/11.
5. Observar a tela aberta.

### ✅ Resultado esperado

- Cada rota mostra nome, faculdades atendidas, horários de saída e retorno e o total de alunos agendados, iguais aos da API.
- O dia sem reservas mostra "Nenhum aluno agendado para este dia."
- A aba Histórico lista dias passados sem permitir alterar a distribuição (consulta).

### ❌ Resultado obtido

- No Histórico (10/11 e 11/11), os cards mostram o lápis de edição e o botão "Confirmar distribuição".
- O lápis abre `/logistica/alocar?linhaId=1&dataIso=2026-11-10` com o botão "Confirmar alocação" ativo.
- Não foi tocado em confirmar.

### ⚠️ Impacto

- É possível tentar editar ou confirmar a distribuição de um dia que já passou.

### Causa aparente

Hipótese: em `frontend/src/app/(administrador)/logistica/distribuicao.tsx`, o ícone de edição (linhas 391-401, `router.push` para `/(administrador)/logistica/alocar`) e o botão "Confirmar distribuição" (linhas 423-435) são renderizados sempre que `linhas.length > 0`, sem checar `tipoTab` (linha 86). A aba Histórico reaproveita o card e as ações da aba Próximos.

### Critérios de aceite

- O Histórico é somente leitura (sem lápis e sem "Confirmar distribuição"), ou a regra do CT/AC que permitir a edição está documentada.

### 📎 Evidência

Reproduzido por Radlei em 17/11/2026, ambiente local `atu-ui016`. Prints: do Histórico em 10/11 e 11/11 e da tela de alocação aberta pelo lápis.
