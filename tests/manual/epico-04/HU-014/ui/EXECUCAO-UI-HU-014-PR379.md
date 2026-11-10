# Execução dos testes de UI — HU-014 — front do PR #379

Complementa a suíte [UI-HU-014](UI-HU-014.md), executada antes no [PR #378](https://github.com/GOUOCE/GOUCE-app/pull/378). Os 11 casos e os resultados esperados são os mesmos da suíte; aqui ficam só os resultados obtidos no front do [PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379) (`feature/front-hu015`), cuja `agenda.tsx` liga o calendário, os detalhes e o cancelamento à API.

## Identificação

| Campo | Valor |
| --- | --- |
| Funcionalidade | HU-014 — Meus Agendamentos |
| Camada | UI — versão web |
| Front | PR #379, `feature/front-hu015`, commit `4ac87b46` (sem contorno local) |
| API | `develop` `7c302a8c`, `http://localhost:8014`, banco limpo, fuso America/Fortaleza |
| Navegador | Versão web em `http://localhost:3114` |
| Data da execução | 10/11/2026 |
| Testador | Cauan Ricardo — execução manual; Claude Code — massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | 🚫 Bloqueados |
| --- | ---: | ---: | ---: | ---: |
| ❌ Reprovada | 11 | 7 | 4 | 0 |

## Resultados por caso

| ID | Cenário | Status | Observações |
| --- | --- | --- | --- |
| CT-HU014-UI-001 | Acesso e estado vazio | ❌ FALHOU | A aba **Agenda** abre a tela com a mensagem exata; o atalho **Meus Agendamentos** do Início não faz nada. ISS1 |
| CT-HU014-UI-002 | Calendário mensal e contador reais | ✅ PASSOU | Novembro/2026 com 11 e 13 agendados, o 02/12 no mês seguinte, 16 feriado e 17 recesso; “3 de 22” igual à API; histórico de ontem fora do contador. |
| CT-HU014-UI-003 | Menu, detalhes e entrada da edição | ❌ FALHOU | O menu não tem **Editar agendamento**; rótulos da volta trocados nos detalhes; a seta de voltar vai ao painel; cards com texto cortado. ISS2, ISS3, ISS4, ISS6 |
| CT-HU014-UI-004 | Modal e desistência | ✅ PASSOU | Modal correto; desistir não alterou nada. |
| CT-HU014-UI-005 | Confirmar e persistir após reabrir | ✅ PASSOU | `DELETE` com o id real; só a reserva escolhida cancelada; persistiu. Mensagem de sucesso em toast preto (ISS5). |
| CT-HU014-UI-006 | Cancelar hoje sem prazo mínimo | ✅ PASSOU | Cancelamento aceito antes e depois do horário de saída. |
| CT-HU014-UI-007 | Proteger o histórico de ontem | ✅ PASSOU | O dia 09/11 só oferece **Ver detalhes** e fica fora do contador. |
| CT-HU014-UI-008 | Falha ao confirmar cancelamento | ✅ PASSOU | Mensagem de falha correta, reserva intacta, repetição funcionou; toast preto fora do padrão (ISS5). |
| CT-HU014-UI-009 | Falha ao carregar e recusa do servidor | ❌ FALHOU | Offline sem dados guardados, faixa de “dados salvos” e “sem agendamentos” juntas; recusa 404 mostra “verifique sua conexão” e não atualiza a tela. ISS7, ISS8 |
| CT-HU014-UI-010 | Sessão e isolamento entre contas | ❌ FALHOU | Fluxo principal correto; offline, a conta B vê as reservas da conta A guardadas no aparelho. ISS9 |
| CT-HU014-UI-011 | Contador no limite e última reserva | ✅ PASSOU | 22 → 21 → 22 e estado vazio ao cancelar a última. Reagendamento feito pela API. |

## Detalhamento do que foi observado

### CT-HU014-UI-001
- Entrando como A, sem reservas futuras, a aba **Agenda** mostra **Meus agendamentos** com “Você ainda não possui agendamentos futuros.” e sem a faixa offline.
- O atalho **Meus Agendamentos** do Início não abre nada. No `home.tsx` da `develop` e deste PR, o `QuickAction` não tem `onPress`; a ligação existe só no PR #378.
- Status: ❌ Falhou. Issue: ISS1.

### CT-HU014-UI-002
- Massa: R1 (11/11, ida e volta), R2 (13/11, só ida) e R3 (02/12, só volta); feriado em 16/11 e recesso em 17/11.
- Cabeçalho do mês correto, setas funcionam entre o mês atual e o seguinte, legenda e contador “3 de 22” corretos; 16 e 17 e dias sem reserva não abrem ação; os cartões de **Próximas viagens** correspondem à API.
- Status: ✅ Passou.

### CT-HU014-UI-003
- O menu dos dias azuis tem **Ver detalhes** e **Cancelar agendamento**; falta **Editar agendamento** (AC-03 pede as três ações).
- Nos detalhes, R1 mostra ida e volta, R2 só ida e R3 só volta, com data e dia da semana certos. Na **volta**, o campo **“Origem (IES)”** mostra o ponto de desembarque do bairro (Praça José de Barros), e a IES aparece em “Ponto de Embarque”.
- A seta de voltar dos detalhes leva ao painel, não à Agenda.
- Nos cartões da lista, “Universidade Fe…” e “Praç…” aparecem cortados.
- Status: ❌ Falhou. Issues: ISS2, ISS3, ISS4, ISS6.

### CT-HU014-UI-004 e CT-HU014-UI-005
- Popup com título “Cancelar agendamento?”, aviso “Esta ação não poderá ser desfeita.” e botões **Cancelar** e **Confirmar**; desistir manteve a reserva e o contador.
- O cancelamento confirmado usou `DELETE /transporte/agendamentos/{id}` com o id de banco (106), cancelou só essa reserva e persistiu depois de recarregar; as demais reservas, a do histórico e a da outra conta ficaram intactas. A alocação não existe (EP-005): parcela bloqueada, ver API-010. Tempo até a atualização da tela não foi medido.
- A mensagem de sucesso aparece em toast preto, sem título, ícone nem botão (ISS5).
- Status: ✅ Passou (observação visual em ISS5).

### CT-HU014-UI-006 e CT-HU014-UI-007
- Reserva de hoje cancelada antes da saída (rota com saída às 23:00) e depois da saída (rota com saída às 06:30): em ambas, a opção existe e o cancelamento foi aceito.
- No dia 09/11 (histórico), o menu só oferece **Ver detalhes**, que abre normalmente; o dia não entra no contador.
- Status: ✅ Passou os dois.

### CT-HU014-UI-008
- Com o navegador offline, ao confirmar o cancelamento o app mostrou “Não foi possível cancelar. Verifique sua conexão...”, a reserva e o contador ficaram intactos e nenhum `DELETE` chegou à API; com a rede ligada, a repetição funcionou (`DELETE` 200).
- A mensagem aparece em toast preto, fora do padrão de popup do app (ISS5).
- Status: ✅ Passou (observação visual em ISS5).

### CT-HU014-UI-009
- **Offline com dados guardados:** a Agenda mostra a faixa “Visualização Offline” e a última lista; ao religar, volta ao normal (não é um erro explícito).
- **Offline sem dados guardados:** a faixa diz “Dados salvos no dispositivo” e, junto, o texto “Você ainda não possui agendamentos futuros.”, embora a A tivesse uma reserva (ISS7).
- **Reserva cancelada em outra sessão:** com o popup aberto, a reserva foi cancelada pela API; ao confirmar, o servidor respondeu `404` e o app mostrou a mensagem de falha de conexão, sem atualizar o calendário (o dia continuou azul) até sair e voltar à Agenda (ISS8).
- Status: ❌ Falhou. Issues: ISS7, ISS8.

### CT-HU014-UI-010
- A viu as próprias reservas (“2 de 22”); B viu só a sua (“1 de 22”); sem sessão, `/agenda` pediu login; o administrador recebeu acesso negado.
- Variação offline: A abriu a Agenda online e saiu; B entrou e, com o navegador offline, abriu a Agenda e viu as reservas da A (11/11 e 13/11, “2 de 22”) com a faixa offline. Na API, a B só tem a reserva de 12/11.
- Código: as chaves do cache (`@GOUOCE:meus_agendamentos`, `@GOUOCE:calendario_<mês>`, `@GOUOCE:detalhes_viagem_<data>`) não têm o id do usuário, e o `signOut` não as apaga.
- Status: ❌ Falhou. Issue: ISS9.

### CT-HU014-UI-011
- Com a A em 22 reservas ativas (o 23º agendamento, tentado pela API, recebeu `422 LIMITE_AGENDAMENTOS`): “22 de 22” → cancelar uma → “21 de 22” → reagendar pela API → “22 de 22”, com o destaque de volta. O reagendamento foi feito pela API porque a tela de agendar (HU-013) não está neste build; a navegação de criação não foi verificada.
- Com uma única reserva ativa, ao cancelá-la a tela mostrou “Você ainda não possui agendamentos futuros.”, e a API devolveu `ativos: 0`.
- Status: ✅ Passou.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-001 | O atalho **Meus Agendamentos** do Início não abre a Agenda. | ISS1 |
| CT-003 | O menu do dia agendado não tem **Editar agendamento**. | ISS2 |
| CT-003 | A seta de voltar da tela de detalhes leva ao painel, não à Agenda. | ISS3 |
| CT-003 | Na volta, o rótulo “Origem (IES)” mostra o ponto de desembarque. | ISS4 |
| CT-005, 008 | O sucesso e a falha do cancelamento aparecem em toast preto fora do padrão de popup. | ISS5 |
| CT-003 | Os cartões de **Próximas viagens** cortam os nomes do ponto e da instituição. | ISS6 |
| CT-009 | Offline sem dados guardados, a tela mostra “dados salvos” e “sem agendamentos” juntos. | ISS7 |
| CT-009 | Quando o servidor recusa o cancelamento (404), o app diz “verifique sua conexão” e não atualiza a tela. | ISS8 |
| CT-010 | O cache de agenda não é separado por usuário e o logout não o limpa: a conta seguinte vê as reservas da anterior offline. | ISS9 |

## Observações gerais

- O front do PR #378 (HU-014) e o deste PR (#379) alteram a mesma `agenda.tsx` e o `home.tsx` de formas diferentes: o atalho do Início está ligado só no #378, e o calendário real só no #379. A decisão sobre qual versão vale cabe ao time.
- Ao recarregar a página em `/home` (web), apareceu a tela “Acesso Negado”; a causa provável é a rota `home` existir em três grupos (aluno, administrador e representante), e a URL não indicar o grupo. Ocorre também na `develop`, fora do escopo desta HU, e não foi investigado.
- Massa feita por API e fixture no banco isolado: alunas A e B aprovadas, rotas e instituições, feriado, recesso e histórico de ontem; reagendamento do CT-011 e cancelamento em outra sessão do CT-009 feitos pela API.
