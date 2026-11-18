# Tela de excedentes não permite realocar o aluno para um ônibus com vaga; os cards são apenas informativos

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito |
| **Severidade** | 🟠 Alta |
| **Ambiente** | Branch `test/execucao-ui-hu-016` — navegador Brave 1.86.148 (Chromium 144.0.7559.133, 64 bits, Linux), front `http://localhost:8081`, API `http://localhost:8216`, commit `0f90c961e484ed1045017d04b1bad15d09b0818c` |
| **Caso relacionado** | `CT-HU016-UI-007` |
| **Documentação** | [HU-016 — Testes manuais de UI](../UI-HU-016.md#ct-hu016-ui-007--realocar-excedentes-manualmente) |
| **Issue relacionada** | [#509](https://github.com/GOUOCE/GOUCE-app/issues/509) (relato); contexto: #473, decisão do PO sobre realocação, fechada sem resposta registrada |

---

### Pré-condição

Administrador autenticado; 27/11/2026, P1 com 6 alunos agendados e só o V1 ativo (V2 e V3 inativados para o excedente voltar à sugestão); a sugestão devolve `excedentes_globais` com agendamento 30, turno ida.

### Passos para reproduzir

1. Abrir Distribuição Logística, semana 23-29 Nov, SEX 27.
2. Tocar no ícone vermelho de excedentes do card de P1.
3. Tocar no card do Agendamento #30.
4. Procurar uma ação para realocar o aluno.

### ✅ Resultado esperado

- O administrador seleciona os excedentes e os realoca para um ônibus com vaga (AC-09).

### ❌ Resultado obtido

- A tela mostra o card estático; tocar não abre nada.
- O único botão é "Voltar para a distribuição".
- Na Network só há GETs, nenhuma chamada de escrita.

### ⚠️ Impacto

- Não há como o administrador realocar excedentes pela interface; só pela API (`CT-HU016-API-008`).

### Causa aparente

Em `frontend/src/app/(administrador)/logistica/excedentes.tsx` (241 linhas), os cards são `Surface` sem `onPress` (linhas 100-122) e o único botão do arquivo está nas linhas 129-137 ("Voltar para a distribuição"). Busca por "realoca" no frontend só encontra telas do aluno (`home.tsx`, `agenda.tsx`, `agendamento-detalhes.tsx`), nenhuma do administrador.

### Critérios de aceite

- A tela permite selecionar o aluno, escolher um ônibus com vaga e confirmar.
- Se recusar, mostra a causa e não altera a distribuição.

### 📎 Evidência

Reproduzido por Radlei em 18/11/2026, ambiente local `atu-ui016`. Prints anexados na issue: card de P1 com "1 aluno(s) excedente(s)"; tela de excedentes; tela depois de tocar no card.

### Reteste

| Campo | Valor |
|---|---|
| **Data** | 18/11/2026 |
| **Build** | `82eac441` (branch `fix/issues-hu16e17`) |
| **Issue** | #509 |
| **Resultado** | ✅ Corrigido — a tela de Excedentes (`excedentes.tsx`) agora permite selecionar o aluno, lista o ônibus com vaga (Rota 2, `DEF4G56`, 3 vagas) e, ao confirmar, mostra "Aluno realocado"; o aluno viu "Atenção: Você foi realocado. Seu ônibus para hoje é o veículo Placa DEF4G56". Recusa testada com o ônibus inativado: a tela mostrou a causa ("ônibus DEF4G56 inexistente ou inativo", 422 `DISTRIBUICAO_INVALIDA`) e o banco não foi alterado. `CT-HU016-UI-007`: 3/3 verificações ✅. Novo defeito cosmético encontrado neste reteste: [BUG-HU016-UI-007](BUG-HU016-UI-007.md). |
