# Aviso de excedentes continua visível depois da realocação

| Campo | Valor |
|---|---|
| **Tipo** | Divergência de requisito |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `test/reteste-ui-hu-016` — navegador Brave 1.86.148 (Chromium 144.0.7559.133, 64 bits, Linux), front `http://localhost:8081`, API `http://localhost:8216`, commit `82eac441835d6bc2e2e17acd3b3b163067d6322f` |
| **Caso relacionado** | `CT-HU016-UI-007` |
| **Documentação** | [HU-016 — Testes manuais de UI](../UI-HU-016.md#ct-hu016-ui-007--realocar-excedentes-manualmente) |
| **Issue relacionada** | [#517](https://github.com/GOUOCE/GOUCE-app/issues/517) |

---

### Pré-condição

Administrador autenticado; 27/11/2026, agendamento 30 (aluno H Um Farias) como excedente da Rota 1 (P1), com V1/M1 distribuídos e V2/M2 reativados para servir de ônibus com vaga (Rota 2, `DEF4G56`, 3 vagas).

### Passos para reproduzir

1. Abrir a tela de Alunos Excedentes de 27/11, com o aluno excedente ainda listado.
2. Selecionar o aluno, escolher o ônibus com vaga (Rota 2, `DEF4G56`) e tocar em "Confirmar realocação".
3. Observar a tela depois do popup de sucesso ("Aluno realocado"), sem navegar para outra tela.

### ✅ Resultado esperado

Depois da realocação bem-sucedida, a tela deve refletir que não há mais aluno excedente nesta data — sem repetir, ao mesmo tempo, um aviso de que ainda há excedente.

### ❌ Resultado obtido

O texto "1 aluno(s)... ultrapassam a capacidade dos veículos alocados" continua visível na tela, ao mesmo tempo que aparece "Nenhum aluno excedente para esta data." — as duas mensagens contraditórias ficam juntas na tela depois da realocação.

### ⚠️ Impacto

- Confunde o administrador sobre se a realocação de fato resolveu o excedente; é só cosmético, não bloqueia nem desfaz a realocação (confirmada no banco).

### Causa aparente

Hipótese: em `frontend/src/app/(administrador)/logistica/excedentes.tsx:242-244`, o texto "ultrapassam a capacidade" é condicionado a `totalExcedentes > 0`, enquanto o texto "Nenhum aluno excedente" (linha 289) é condicionado a `alunos.length === 0`. Depois de `carregar()` recarregar a tela, `alunos` (vindo de `excedentes_globais`) já vem vazio, mas `totalExcedentes` (`rota?.excedentes ?? alunos.length`, calculado a partir de `linhas`/`montarLinha`) pode não ter sido recalculado para 0 no mesmo ciclo — não foi confirmado qual dos dois valores fica desatualizado.

### Critérios de aceite

- Depois de realocar o único excedente de uma rota, a tela mostra só uma das duas mensagens (a correspondente ao estado atual), nunca as duas juntas.
- Caso de teste a reexecutar: `CT-HU016-UI-007`.

### 📎 Evidência

Reproduzido por Radlei em 18/11/2026, ambiente local `atu-ui016`, durante o reteste do build `82eac441`.

### Reteste

| Campo | Valor |
|---|---|
| **Data** | 18/11/2026 (reteste à noite) |
| **Build** | `f9cde78e` (commit "fix: corrige excedentes apos realocacao issue #517", `dev-mariab`, branch `fix/issues-hu16e17`, ainda fora da `develop`) |
| **Issue** | #517 |
| **Resultado** | ✅ Corrigido — em 27/11, realocando o aluno H Um Farias para o ônibus com vaga (Rota 2, `DEF4G56`) pela tela de Excedentes, o `POST /alocacao-diaria/distribuicao` retornou 201 e, depois da realocação, a tela passou a mostrar só "Nenhum aluno excedente para esta data.", sem repetir "1 aluno(s)... ultrapassam a capacidade dos veículos alocados". Backend testado continua no `82eac441` (a correção só alterou o frontend). `CT-HU016-UI-007`: ✅. |

**Observação:** a ponta da branch `fix/issues-hu16e17` está em `457f0fec`, que traz uma mudança extra de backend (HU-017) ainda **não testada** neste reteste — fora do escopo da #517.
