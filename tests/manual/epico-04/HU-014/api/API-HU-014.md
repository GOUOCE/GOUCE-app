# Testes manuais de API — HU-014 — Visualização e Cancelamento de Agendamentos

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-014 — Meus Agendamentos |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, autorização e integridade — baseado em risco |
| Endpoints | Base `/transporte/agendamentos`: `GET /meus`, `GET /calendario?mes=YYYY-MM`, `GET /{id}` e `DELETE /{id}`. Apoio: `POST` e `PUT /{id}` da HU-013 |
| Ambiente | A preencher — URL, SHA testado, banco e fuso; base analisada `develop` `3e3bb13c` |
| Total de casos | 10 |
| Última execução | Não realizada |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 10 | 0 | 0 | 0 | 0 | 10 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e PostgreSQL reais em stack isolada, migrations aplicadas e acesso de leitura a `agendamento` e `log_auditoria`. [Guia de execução](README.md). |
| PC-02 | Alunos A e B aprovados, ativos e com vínculo válido; A é o executor padrão. Token de administrador e de aluno pendente ou com vínculo vencido para CT-008. |
| PC-03 | D = data local do servidor; anotar hora e fuso. D−1, D e D+1 representam ontem, hoje e amanhã. Se houver feriado em D/D+1, usar fixture isolada para tornar esses dias válidos; não trocar o significado do limite. |
| PC-04 | Bairro, ponto P e IES F atendidos por rota principal ativa na ida e na volta. Preparar pela API da HU-013 reservas A1 (A, D+1, ida e volta), A2 (A, outro dia futuro válido, só ida), A3 (A, outro dia futuro válido, só volta) e B1 (B, D+1). CT-001 começa antes das reservas de A. |
| PC-05 | AP (A, D−1, status ATIVO) e feriado/recesso em dia futuro dentro da janela preparados por fixture/seed documentada somente no banco isolado. `ATIVO` no passado é histórico, não deve entrar no contador futuro. |
| PC-06 | Reservas extras de hoje são criadas no CT-005; massa de 22 reservas no CT-009 é independente. Não reutilizar registro já cancelado como se ainda estivesse ativo. |
| PC-07 | Alocação veículo/dia real e mecanismo de falha transacional controlada para CT-010. Na base analisada, `remove_allocations` não faz alterações; registrar o bloqueio da comprovação dessa integração. |

## Resumo da execução

Todas as chamadas usam token de A, salvo indicação. Criar a massa conforme a ordem dos casos. Os códigos HTTP abaixo refletem o contrato analisado; as regras de negócio vêm dos requisitos.

### Seção A — Consulta e calendário

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU014-API-001 | Lista vazia e reservas do próprio aluno | GET `/meus` antes/depois da massa | 200; zero antes; depois somente ativos de A desde D, ordenados e com contador correto | ⏳ PENDENTE | Não executado. |
| CT-HU014-API-002 | Estados e mudança de mês | GET `/calendario`; mês válido e inválido | 200 com estados/ids/flags reais e limite 22; inválido 422 | ⏳ PENDENTE | Não executado. |
| CT-HU014-API-003 | Detalhes e proteção de propriedade | A1, A2, A3, AP, B1 e inexistente | 200 com dados reais dos próprios registros; 404 para B1 e inexistente | ⏳ PENDENTE | Não executado. |

### Seção B — Cancelamento e limites

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU014-API-004 | Cancelar reserva futura e persistir | DELETE A1, A2 e A3, um por vez | 200; CANCELADO com data do cancelamento; contador diminui uma vez por reserva; calendário atualizado | ⏳ PENDENTE | Não executado. |
| CT-HU014-API-005 | Cancelar hoje sem horário limite | Reserva de D antes e após o horário de saída | 200 nas duas condições; não exigir antecedência | ⏳ PENDENTE | Não executado. |
| CT-HU014-API-006 | Bloquear cancelamento de ontem | DELETE AP e PUT AP com ambos os trechos false | 422 AGENDAMENTO_PASSADO; histórico preservado | ⏳ PENDENTE | Não executado. |
| CT-HU014-API-007 | Repetição, outro dono e id inválido | DELETE cancelado, B1, inexistente e texto | 404 nos três primeiros; 422 em texto; nenhum efeito colateral | ⏳ PENDENTE | Não executado. |
| CT-HU014-API-008 | Autenticação e autorização | Sem token, token inválido, administrador, aluno sem acesso regular | 401 sem token/inválido; 403 para perfis sem permissão; nenhuma alteração | ⏳ PENDENTE | Não executado. |
| CT-HU014-API-009 | Liberar limite e reagendar | 22 ativos → cancelar um → novo POST no mesmo dia | 22 → 21 → 22; novo id ativo; antigo permanece cancelado | ⏳ PENDENTE | Não executado. |

### Seção C — Integridade da alocação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU014-API-010 | Alocação e cancelamento na mesma transação | Reserva alocada; falha antes do commit; depois sucesso | Falha não altera reserva/alocação/contador; sucesso libera só a vaga correspondente | ⏳ PENDENTE | Depende de HU-016/018 e mecanismo de falha controlada. |

## Detalhamento dos casos

### Seção A — Consulta e calendário

#### CT-HU014-API-001 — Lista vazia e reservas do próprio aluno

**Técnica/tipo:** partição de equivalência; limites zero/um; funcional positivo e isolamento entre alunos.

**Dados de entrada:** GET `/transporte/agendamentos/meus`; A sem reservas futuras, B com B1; depois A1/A2/A3 e histórico AP.

**Passos**

1. Antes de criar reservas futuras para A, consultar `/meus` e guardar o corpo.
2. Criar A1; consultar novamente (limite de um item).
3. Preparar A2, A3 e AP; consultar novamente e comparar com o banco. Consultar também como B.

**Resultado esperado**

- HTTP 200 com `{ "agendamentos": [], "ativos": 0, "limite": 22 }` no primeiro passo; a mensagem do estado vazio cabe à UI (AC-02, FA-001).
- Após A1, exatamente um item e `ativos: 1`; após A2/A3, exatamente três ativos futuros de A, ordenados por data. B1 e AP não entram na lista nem na contagem de A.
- Cada item tem id, dono, data, trechos, status, nomes das referências e flags `pode_remover`/`pode_editar`. Consulta como B retorna somente B1 (AC-01, RF-016).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU014-API-002 — Estados e mudança de mês

**Técnica/tipo:** partição de equivalência e valor-limite; funcional positivo/negativo.

**Dados de entrada:** `/calendario?mes=<mês de D>`; mês adjacente; `mes=2026-1`, `2026-13`, ausência de `mes`; AP, A1, feriado/recesso e dia sem reserva dentro da janela.

**Passos**

1. Consultar os meses que contêm a massa e conferir datas/ids no banco. Usar fixture de data controlada no ambiente de teste se necessário para cobrir virada de mês, documentando o mecanismo.
2. Conferir o dia de AP e os dias futuros agendado, disponível e feriado/recesso.
3. Em cenário isolado sem reservas futuras, deixar a base sem rota ativa e consultar um dia futuro; depois restaurar a massa.
4. Enviar as variações de mês inválido.

**Resultado esperado**

- Válidos: 200, `mes`, `dias`, `ativos` e `limite: 22`; datas reais, sem 31 em mês de 30 dias nem duplicidade na virada do mês (AC-01).
- A1: `AGENDADO`, id real, `pode_agendar: false`, `pode_remover/pode_editar: true`. AP: histórico com `pode_remover/pode_editar: false` (AC-07).
- Feriado/recesso: `FERIADO`/`RECESSO`, descrição e `pode_agendar: false`; dia livre atendido por rota: `DISPONIVEL`; sem rota ativa: `INDISPONIVEL`.
- Mesma contagem de `/meus`, sem incluir AP nem B1. Mês inválido/ausente: 422 com erro compreensível.
- Registrar a janela devolvida pela API: a implementação analisada limita dias ao fim da janela de 30 dias e omite passado sem reserva. A UI deve compor um calendário mensal válido sem inventar disponibilidade para datas ausentes.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU014-API-003 — Detalhes e proteção de propriedade

**Técnica/tipo:** tabela de decisão (dono × data); funcional e autorização por objeto.

**Dados de entrada:** GET `/transporte/agendamentos/{id}` para A1/A2/A3/AP, B1 e id numérico comprovadamente inexistente.

**Passos**

1. Consultar cada id com token de A, antes dos cancelamentos.
2. Comparar trechos, pontos, IES e nomes com a massa; medir uma consulta em conexão normal.
3. Consultar B1 como B para confirmar que ele existe e reler o banco após a tentativa de A.

**Resultado esperado**

- Próprios: 200 com os dados efetivos; só ida/só volta não ganham trecho inexistente. AP continua consultável como histórico, com as duas flags false; futuros têm flags true (AC-03, AC-07).
- B1 e inexistente: 404 com `error.code: RESOURCE_NOT_FOUND`, mensagem “Agendamento não encontrado.”, sem expor dados de B.
- Nenhuma consulta muda dados. Registrar duração; referência RNF-001: até 3 s em conexão normal, observando que o tempo HTTP sozinho não mede a renderização móvel.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Cancelamento e limites

#### CT-HU014-API-004 — Cancelar reserva futura e persistir

**Técnica/tipo:** transição ATIVO → CANCELADO; integração com persistência; partições ida/volta/ambos.

**Dados de entrada:** DELETE `/transporte/agendamentos/{id}` de A1, A2 e A3, sem corpo.

**Passos**

1. Antes de cada DELETE, guardar contador, calendário e estado da reserva; medir um cancelamento em conexão normal.
2. Enviar DELETE e consultar `/meus`, `/calendario` e o detalhe do id cancelado.
3. Conferir `agendamento` e `log_auditoria` em nova consulta ao banco após a resposta. Consultar B1 para conferir ausência de efeito colateral.

**Resultado esperado**

- 200 com `mensagem: "Agendamento cancelado com sucesso"`, `estado_dia: "DISPONIVEL"`, `ativos` reduzido em um e `limite: 22` (AC-05/06).
- Reserva deixa `/meus` e o destaque AGENDADO; com rota ativa e dia regular, o dia fica disponível. Detalhe do id cancelado retorna 404 conforme o contrato atual.
- Registro preservado como `CANCELADO`, `cancelled_at` preenchido; dono/data/trechos preservados, B1 intacto. Um log `CANCELAR` por operação efetiva, com id e aluno corretos; não exigir exclusão física do histórico.
- Em ida e volta, contar **um agendamento por dia**, não dois. Limite de referência de resposta: 3 s (RNF-001); registrar tempo observado.
- Liberação da alocação é verificada no CT-010; sem essa dependência, registrar que esta parte do AC-06 permanece sem comprovação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU014-API-005 — Cancelar hoje sem horário limite

**Técnica/tipo:** valor-limite D−1/D/D+1 e tabela de decisão por horário; funcional positivo.

**Dados de entrada:** reserva própria ativa em D, antes e depois do horário de saída da rota (duas reservas sucessivas no mesmo dia, nunca simultâneas).

**Passos**

1. Criar reserva para D e cancelar antes da saída. Criar uma nova reserva para D e cancelar após a saída.
2. Anotar hora local do servidor e horário da rota em cada variação; não alterar relógio do sistema. Se necessário, preparar rotas/massa de teste com horários em torno da hora atual, registrando a preparação.
3. Conferir contador, status e log como no CT-004.

**Resultado esperado**

- Ambas retornam 200 e cancelam, sem exigência de antecedência ou horário de corte (AC-05, RN-005).
- O dia D é distinto de D−1: não deve ser barrado como passado apenas porque a hora da saída passou.
- Se uma faixa não puder ser montada/executada, registrar a variação pendente/bloqueada, sem aprovar as duas por uma única chamada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU014-API-006 — Bloquear cancelamento de ontem

**Técnica/tipo:** valor-limite ontem/hoje; funcional negativo e integridade do histórico.

**Dados de entrada:** AP; DELETE `/transporte/agendamentos/{AP}` e PUT no mesmo id com `{ "data": "<D−1>", "usa_ida": false, "usa_volta": false }`.

**Passos**

1. Guardar status, trechos, histórico e logs de AP.
2. Enviar DELETE; depois PUT (caminho alternativo de cancelamento da HU-013).
3. Reler detalhe, calendário e banco.

**Resultado esperado**

- 422 com `error.code: AGENDAMENTO_PASSADO` e mensagem “Não é possível cancelar agendamento de data já passada.” nas duas chamadas (AC-07, FA-003).
- AP preservado, flags de remoção/edição false; nenhum log de cancelamento efetivo nem alteração de alocação/histórico. PUT não pode contornar a proteção de DELETE.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU014-API-007 — Repetição, outro dono e id inválido

**Técnica/tipo:** tabela de decisão (dono × status) e partição de ids; funcional negativo e autorização.

**Dados de entrada:** DELETE A1 já cancelado, B1 ativo, id numérico inexistente e `/transporte/agendamentos/abc`.

**Passos**

1. Guardar contador e quantidade de logs de A; estado e logs de B1.
2. Enviar cada variação como A e consultar ambos os alunos novamente.

**Resultado esperado**

- Cancelado, outro dono e inexistente: 404 `RESOURCE_NOT_FOUND`; não revelar qual pertence a B. Texto no id: 422 de validação.
- Repetir não reduz contador nem duplica log. B1 permanece ativo, sem mudança em alocação ou contador de B (AC-06, RNF-012).
- Sem erro 500 nem sucesso falso para reserva inexistente.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU014-API-008 — Autenticação e autorização

**Técnica/tipo:** partição de equivalência por credencial/perfil; segurança de acesso.

**Dados de entrada:** sem token; token malformado/inválido; token de administrador; token de aluno pendente ou com vínculo vencido. Reserva de A ativa preparada para o caso.

**Passos**

1. Para cada credencial, chamar GET `/meus`, GET `/calendario?mes=<mês de D>`, GET `/{id de A}` e DELETE `/{id de A}`.
2. Conferir que o token realmente representa o perfil/status indicado. Se não for possível obter uma credencial, registrar essa variação bloqueada.
3. Reler reserva e contador como A.

**Resultado esperado**

- Sem token ou token inválido: 401; administrador e aluno sem acesso regular: 403, conforme proteção `verify_student_standard_access`.
- Nenhuma consulta revela reservas; nenhuma recusa cancela, muda contador ou gera log de cancelamento. O recurso é pessoal do aluno com acesso regular (RF-016, integração com controle de acesso).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU014-API-009 — Liberar limite e reagendar

**Técnica/tipo:** valores-limite 22/21 e transição cancelado → nova reserva; regressão de integração HU-013.

**Dados de entrada:** A com exatamente 22 reservas ativas em datas válidas distintas dentro da janela, incluindo uma em D+1; B com massa independente.

**Passos**

1. Preparar massa independente das reservas canceladas; conferir `/meus` com `ativos: 22`. Se necessário, usar fixture de calendário para haver 22 datas válidas, sem aumentar o limite configurado.
2. Cancelar a reserva de D+1; consultar contador e calendário.
3. Fazer novo POST válido para D+1; anotar o novo id e consultar lista/calendário/banco.

**Resultado esperado**

- Contador 22 → 21 após DELETE; o dia fica disponível (AC-01/06).
- POST aceito (HTTP 200 no contrato atual da HU-013), novo registro ativo com id diferente; contador 22, antigo preservado cancelado. Não permanecer bloqueado por duplicidade do registro cancelado nem contar cancelados.
- B e seus totais intactos. Falha de criação por dependência da HU-013 deve ser descrita separadamente do resultado do cancelamento.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Integridade da alocação

#### CT-HU014-API-010 — Alocação e cancelamento na mesma transação

**Técnica/tipo:** transição de estado, injeção controlada de falha e integração transacional (RNF-012).

**Dados de entrada:** reserva futura de A alocada em veículo/dia; reserva de B no mesmo veículo; snapshots de reserva, alocação, contador e logs.

**Passos**

1. Identificar o modelo real de alocação e registrar as consultas usadas. Sem implementação real, registrar o impedimento e não simular aprovação.
2. Com mecanismo controlado de teste, provocar falha depois da tentativa de remover a alocação e antes do commit do cancelamento. Enviar DELETE e reler o banco em nova sessão.
3. Retirar a falha e repetir o DELETE; conferir reserva, alocação, lista de embarque/ocupação disponível e log.

**Resultado esperado**

- Falha: resposta de erro, sem sucesso; rollback integral mantém reserva ATIVO, alocação, contador e nenhum log CANCELAR efetivo. Não pode liberar só a vaga nem cancelar só a reserva (AC-08, RNF-012).
- Sucesso: 200, reserva CANCELADO, alocação ativa de A removida/desativada conforme o modelo, ocupação reduzida e B intacto. As alterações são persistidas juntas (AC-06).
- A base analisada tem `remove_allocations` sem efeito: liberação de vaga e atomicidade com a alocação dependem de HU-016/018. Manter pendente no planejamento; na execução, marcar partes sem dependência como verificadas e partes impossíveis como bloqueadas. Teste unitário com mock não substitui esta evidência.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério/regra | Casos API | Complemento na UI |
| --- | --- | --- |
| AC-01 — calendário e contador | 001, 002, 009 | UI-002, UI-011 |
| AC-02 / FA-001 — estado vazio | 001 | UI-001 valida a mensagem |
| AC-03 — opções do dia e detalhes | 003 | UI-003 valida o menu e navegação |
| AC-04 / FA-002 — modal e desistência | Não se aplica ao HTTP | UI-004 |
| AC-05 / RN-005 — sem horário limite | 004, 005 | UI-006 |
| AC-06 — cancelar, liberar alocação, atualizar | 004, 009, 010 | UI-005, UI-011 |
| AC-07 / FA-003 — proteger passado | 002, 003, 006 | UI-007 |
| AC-08 / FA-004 — falha sem cancelamento parcial | 010 (falha transacional) | UI-008, UI-009 (comunicação) |
| RF-016 — consulta pessoal e cancelamento | 001, 003, 004, 007, 008 | UI-010 |
| RNF-001 — até 3 s em conexão normal | 003, 004, medição básica HTTP | UI-005, medição completa percebida |
| RNF-012 — consistência | 004, 006, 007, 010 | UI-005, UI-008 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Riscos de leitura constam no índice do épico. | — |

## Observações gerais

- Referências: [HU-014, seção 7.5.2 e regras gerais](../../../../../docs/requisitos.md), [índice e versões](../../README.md) e [UI](../ui/UI-HU-014.md).
- DELETE faz cancelamento lógico; “remover” no requisito não deve ser interpretado como apagar histórico. Não há campo `success` obrigatório no DTO de sucesso atual: conferir `mensagem`, `estado_dia`, `ativos` e `limite`.
- Falha de rede antes do envio é coberta na UI; falha dentro da transação é CT-010. Perda apenas da resposta após commit requer reconciliação por GET, sem presumir rollback.
- Nenhum caso executado nesta entrega. Preencher os resultados por variação; não confundir defeito reproduzido, risco de código e dependência ausente.
