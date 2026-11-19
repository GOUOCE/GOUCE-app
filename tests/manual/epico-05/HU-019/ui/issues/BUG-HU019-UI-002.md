# Na volta, os detalhes da viagem mostram "Horário de Saída" com o horário de retorno

| Campo | Valor |
|---|---|
| **Tipo** | Bug de interface (UX) |
| **Severidade** | 🟢 Baixa |
| **Ambiente** | Branch `test/execucao-ui-hu-019` — navegador web (versão web do app), URL do front `http://localhost:3121`, API `http://localhost:8121`, commit `6059f33bc0afb6a935e5bdf345716a06f92bbfb7` |
| **Caso relacionado** | `CT-HU019-UI-003` |
| **Documentação** | [HU-019 — Testes manuais de UI](../UI-HU-019.md#ct-hu019-ui-003--detalhes-ônibus-rota-motorista-horário-ponto-e-faculdade-por-turno) |
| **Issue relacionada** | Mesmo padrão da [#524](https://github.com/GOUOCE/GOUCE-app/issues/524) (HU-017), já corrigida na tela de alocação do administrador. |

---

### Pré-condição

Aluna Alice Almeida (`alice@qa.gouce.app`), com reserva de ida e volta em 20/11/2026 já alocada (ida no V1 e volta no V3).

### Passos para reproduzir

1. Entrar como a Alice, abrir Agenda → Próximas viagens e tocar em "Ver detalhes" no cartão de 20/11/2026.
2. Olhar o rótulo do horário na seção "Ida" e na seção "Volta".

### ✅ Resultado esperado

Na ida o rótulo é "Horário de Saída" com o horário de saída da rota (06:30); na volta o rótulo é "Horário de Retorno" com o horário de retorno (17:30), como no BDD da HU-019 e no README do épico 05.

### ❌ Resultado obtido

Os dois turnos usam o rótulo "Horário de Saída"; na volta ele mostra 17:30, que é o horário de retorno. O valor está certo (igual ao da API); só o rótulo da volta está inconsistente.

### ⚠️ Impacto

- O aluno pode ler 17:30 como horário de saída da volta; não impede a consulta.

### Causa aparente

`frontend/src/app/(aluno)/agendamento-detalhes.tsx`, linhas 93, 166 e 172: o rótulo "Horário de Saída" é fixo para qualquer turno.

### Critérios de aceite

- A volta mostra "Horário de Retorno" e a ida continua com "Horário de Saída".
- Reexecutar `CT-HU019-UI-003`.

### 📎 Evidência

Reproduzido por Cauan Ricardo em 19/11/2026, ambiente local `atu-exec-hu019` (stack Docker isolada, banco novo, fuso America/Fortaleza). Prints do testador a anexar na issue, sem tokens nem dados pessoais.
