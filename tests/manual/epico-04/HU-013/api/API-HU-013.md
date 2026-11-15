# Testes manuais de API — HU-013 — Agendamento de Transporte

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-013 — Agendamento de Transporte |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, autorização e persistência — baseado em risco |
| Operações | `GET /transporte/agendamentos/calendario?mes=YYYY-MM`, `GET /transporte/agendamentos/meus`, `GET /transporte/agendamentos/{id}`, `POST /transporte/agendamentos`, `PUT /transporte/agendamentos/{id}`; `GET /transporte/agendamentos/opcoes` (e `/agendamentos/opcoes`, usada pelo front), `DELETE /transporte/agendamentos/{id}` |
| Branch de resultados | `test/reteste-api-hu-013`, criada da `develop` `52f9433a` (a primeira execução ficou na `feature/testes-api-hu-013`, `4e44913d`) |
| Código a testar | `feature/front-hu013`, commit `0c0a079c87da54ac5f8cafbd4dbeffa57e84d972`, [PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377) (a primeira execução usou `ee305857`) |
| Ambiente | Docker isolado `atu-qa-hu013-reteste`; `http://127.0.0.1:8013` (e `8113`, com limite 5 e janela de 15 dias, para o CT-009); PostgreSQL 15; Alembic `82_updated_at_faculdade_ponto`; America/Fortaleza. [Resumo JSON](EVIDENCIAS-HU-013.json) |
| Total de casos | 12 |
| Última execução | 10/11/2026 — reteste após a correção da [#399](https://github.com/GOUOCE/GOUCE-app/issues/399): 12 casos passaram. Em 09/11/2026 (`ee305857`), CT-001 falhou e CT-002 a CT-012 ficaram bloqueados |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ✅ Todos os casos passaram | 12 | 12 | 0 | 0 | 0 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Executar o backend do commit da feature indicado acima, sem inserir routers, corrigir regras ou trocar pelo backend da develop. Aplicar migrations em PostgreSQL isolado vazio. |
| PC-02 | Contas sintéticas de A e B aprovadas, com vínculo válido, e login real. Administrador, pendente, reprovado e vínculo vencido para CT-011. Não versionar credenciais. |
| PC-03 | D = data local do servidor, fuso America/Fortaleza. Janela padrão D a D+29, limite de 22 ativos. Registrar datas concretas e recalcular a massa se a execução atravessar a meia-noite. |
| PC-04 | Pela API, preparar bairros/pontos e IES ativas; principal atendendo ponto/IES na ida e na volta; outra IES/ponto para conferir independência da volta; complementares C1/C2 ligadas às principais corretas. |
| PC-05 | Cadastros inativos/inexistentes e combinação sem rota para testes negativos. Feriado/recesso não será cobrado, conforme decisão do PO na #389. Sábado/domingo devem ser indisponíveis. |
| PC-06 | Contas e documentos sintéticos podem ser fixtures no banco isolado. Reservas e cadastros do fluxo passam pela API. Fixture específica de limite deve ser documentada quando necessária para isolar a contagem sem duplicidade. |
| PC-07 | CT-001 verifica a disponibilidade HTTP antes dos casos de negócio. Se as rotas não estiverem publicadas, registrar o defeito de integração uma vez e marcar os casos dependentes como bloqueados, sem simular aprovação por chamadas internas. |

## Resumo da execução

### Seção A — Contrato, calendário e criação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-API-001 | API publicada na aplicação real | Health, OpenAPI, GET/POST/PUT autenticados | Health 200; operações de agendamento presentes e acessíveis conforme contrato | ✅ PASSOU | Health, login e OpenAPI 200; as sete chamadas do diagnóstico anterior agora respondem 200 ou 404 de recurso; POST criou a reserva. Bug [#399](https://github.com/GOUOCE/GOUCE-app/issues/399) corrigido. |
| CT-HU013-API-002 | Calendário, opções e dias úteis | Mês de D/adjacente; dia útil/sábado/domingo; sem rota ativa | Estados coerentes, somente D a D+29 disponíveis; fim de semana/sem rota indisponíveis; opções reais ativas | ✅ PASSOU | Calendário sem divergências (janela D a D+29, fins de semana indisponíveis); opções só com cadastros ativos; sem rota ativa o dia fica indisponível. |
| CT-HU013-API-003 | Criar ida, volta e ambos | Três reservas válidas; IES/ponto da volta independentes; C1/C2 | 200, mensagem de sucesso, vínculo ao aluno e trechos corretos no banco | ✅ PASSOU | Ida, volta e ambos criados e persistidos; B não vê as reservas de A. Mensagem de sucesso sai como “criado” em vez de “realizado”: mesmo sentido. |
| CT-HU013-API-004 | Novo cadastro sem nenhum trecho | POST com `usa_ida=false` e `usa_volta=false` | 200, “Nenhum agendamento foi criado.”, sem nova reserva nem erro | ✅ PASSOU | Sem reserva nem auditoria. A API recusa com 422 FA-003 e a tela mostra “Nenhum agendamento foi criado.” sozinha: resultado equivalente para o aluno. |

### Seção B — Validações e limites

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-API-005 | Obrigatórios condicionais | Sim sem cada ponto/IES; Não sem campos do trecho | 422 FA-003 com campos para trecho utilizado; não exigir trecho não utilizado | ✅ PASSOU | Cada campo omitido do trecho Sim dá 422 FA-003 com o campo indicado; trecho Não não exige campos. |
| CT-HU013-API-006 | Referências e itinerário | Inativo/inexistente; id inválido; ponto/IES sem rota; complementar incompatível | 422; sem vínculo inválido; FA-002 na combinação não atendida | ✅ PASSOU | Onze variações recusadas com 422 (inativo/inexistente, ids inválidos, sem rota, complementar incompatível); nada persistido. |
| CT-HU013-API-007 | Duplicidade e concorrência | Mesmo aluno/data; duas chamadas simultâneas; outro aluno | 409 FA-001 orientando editar/cancelar; no máximo um ativo por aluno/data | ✅ PASSOU | 409 FA-001 na duplicidade, B reserva a mesma data, concorrência com uma só reserva e reagendamento após cancelar. Texto do 409 mais curto que o da #389. |
| CT-HU013-API-008 | Limites da janela | D−1, D, D+29, D+30 e data inválida | Datas permitidas aceitas se úteis; fora da janela/formato inválido 422 | ✅ PASSOU | D−1 e D+30 dão 422 DATA_FORA_DA_JANELA; D e D+29 aceitos; data inválida e fim de semana recusados. |
| CT-HU013-API-009 | Limite de ativos e configuração | 21 → 22; tentativa com 22; limite configurado 5 | Limite não ultrapassado; 422 LIMITE_AGENDAMENTOS; edição não acrescenta reserva | ✅ PASSOU | 22 ativos aceitos e 23ª recusada com 422 LIMITE_AGENDAMENTOS (fixture documentada); limite 5 e janela de 15 dias respeitados. |

### Seção C — Edição, acesso e integridade

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-API-010 | Editar e cancelar sem trechos | PUT válido, PUT para outro dia ocupado e PUT com ambos false | Mesmo id atualizado; conflito 409; sem trechos equivale a cancelamento persistido | ✅ PASSOU | Edição mantém o id, dia ocupado dá 409 sem alterar, PUT Não/Não cancela e persiste CANCELADO. |
| CT-HU013-API-011 | Autorização e propriedade | Sem token/inválido; admin; aluno sem acesso regular; outro dono | 401/403 conforme credencial; dados de outro aluno protegidos; sem mutação | ✅ PASSOU | 401 sem token/inválido; 403 para pendente, reprovado, vínculo vencido e administrador; outro dono recebe 404; `aluno_id` extra dá 422. |
| CT-HU013-API-012 | Persistência, rollback e tempo | Criação válida; recusa; falha controlada antes do commit | Banco consistente; sem gravação parcial; resposta de referência até 3 s | ✅ PASSOU | Persistência e auditoria corretas, recusa sem efeito, rollback na falha controlada e 23 a 31 ms por POST. |

## Detalhamento dos casos

### Seção A — Contrato, calendário e criação

#### CT-HU013-API-001 — API publicada na aplicação real

**Técnica/tipo:** integração e análise de contrato; teste de disponibilidade funcional.

**Dados de entrada:** aplicação real do commit indicado; aluno A autenticado; data útil válida; corpo com ponto/IES ativos e rota atendendo ambos os trechos.

**Passos**

1. Conferir health, OpenAPI, revisão Alembic e login real.
2. Procurar operações da HU-013 no OpenAPI e enviar GET `/meus`, GET `/calendario`, POST e PUT pelo prefixo real `/transporte/agendamentos`.
3. Conferir também o caminho de opções consumido pelo front, sem alterar o código para torná-lo acessível.

**Resultado esperado**

- Health e login funcionam; as operações do módulo estão registradas na aplicação HTTP real. GETs retornam 200; POST válido retorna 200 e pode fornecer id para o PUT válido (200).
- Id inexistente no PUT pode retornar 404 de recurso, mas somente se a operação existir no OpenAPI e for roteada. `404 {"detail":"Not Found"}` em todos os caminhos não comprova regra de negócio.
- Se o módulo não estiver publicado, registrar um defeito de integração e bloquear os demais casos dependentes; não adicionar o router em um app de teste e chamar isso de API integrada.

**Resultado obtido**

- Backend `0c0a079c` iniciado com as migrations aplicadas em banco vazio até a `82`. Health, OpenAPI e login do aluno A (ativado, vínculo válido) retornaram 200; bairro, ponto, IES e rotas preparados por HTTP 201.
- O OpenAPI lista `/transporte/agendamentos` (POST), `/calendario`, `/detalhes`, `/meus`, `/opcoes` e `/{id}` (GET, PUT, DELETE), além de `/agendamentos/opcoes` e `/agendamentos/meus`. As sete chamadas do diagnóstico anterior: GET `/meus` 200, GET `/calendario?mes=2026-11` 200, GET `/999999999` 404 `RESOURCE_NOT_FOUND`, POST válido 200 (reserva id 1 criada), PUT `/999999999` 404 `RESOURCE_NOT_FOUND`, GET `/agendamentos/opcoes` 200 e GET `/transporte/agendamentos/opcoes` 200.
- O 404 em id inexistente agora vem de operação publicada e roteada, sem o `Not Found` genérico.
- O [BUG-HU013-API-001](issues/BUG-HU013-API-001-rotas-agendamento-nao-publicadas.md) ([#399](https://github.com/GOUOCE/GOUCE-app/issues/399)) foi corrigido pelo commit `305ca252`, que registra o `agendamento_router` e o `router_legacy` no `main.py`. [Respostas e resumo JSON](EVIDENCIAS-HU-013.json).
- Status: ✅ Passou.

---

#### CT-HU013-API-002 — Calendário, opções e dias úteis

**Técnica/tipo:** partição por estado, tabela de decisão dia útil/rota ativa e valor-limite de mês.

**Dados de entrada:** D e mês adjacente; dias disponíveis, agendados, sábado e domingo; cenário sem rota ativa; cadastros ativos/inativos para as opções.

**Passos**

1. Consultar calendário e operações reais de opções com token de A.
2. Comparar datas/estados com reservas e rotas; conferir o último dia da janela e dias fora dela.
3. Tentar POST para sábado/domingo; conferir ausência de reserva. Conferir cenário sem rota em massa isolada.

**Resultado esperado**

- Calendário com AGENDADO, DISPONIVEL e INDISPONIVEL; somente dias úteis de D a D+29 podem ficar disponíveis. Sem rota ativa, não disponibilizar novos agendamentos.
- Sábado/domingo: indisponíveis e criação recusada com 422 conforme #389. Opções refletem cadastros ativos reais, sem exemplos ou referências inativas.
- Não cobrar feriados/recessos: o PO os retirou do escopo. Renderização, botão e navegação visual não são avaliados nesta suíte de API.

**Resultado obtido**

- Calendário de 11 e 12/2026 sem divergências contra o esperado calculado: dias úteis de D (10/11) a D+29 (09/12) DISPONIVEL, sábados, domingos e dias fora da janela INDISPONIVEL, 11/11 AGENDADO.
- `/transporte/agendamentos/opcoes` devolve só cadastros ativos: a IES e o ponto inativados na massa não aparecem.
- Sem rota ativa (complementares e principais inativadas pela API administrativa; é preciso inativar as complementares antes, senão 409 `CONFLICT`): os dias úteis ficam INDISPONIVEL e o POST responde 422 FA-002. Após reativar, voltam a DISPONIVEL.
- Status: ✅ Passou.

---

#### CT-HU013-API-003 — Criar ida, volta e ambos

**Técnica/tipo:** tabela de decisão ida/volta e integração com persistência.

**Dados de entrada:** POST em três datas úteis distintas: só ida, só volta e ambos; volta com IES/ponto distintos e atendidos por rota ativa; complementar de ida e volta independentes.

**Passos**

1. Preparar referências e enviar cada POST com token de A; anotar ids.
2. Consultar lista, detalhe e calendário; comparar com o banco em nova conexão.
3. Consultar lista como B e verificar ausência das reservas de A.

**Resultado esperado**

- 200, “Agendamento realizado com sucesso”, estado AGENDADO e reserva ATIVO vinculada a A.
- Cada trecho guarda somente suas escolhas; IES/ponto da volta podem diferir da ida; complementares correspondem às principais que atendem cada trecho.
- Uma reserva por aluno/data, persistida e refletida no calendário/contador; B não a visualiza.

**Resultado obtido**

- POST só ida em 12/11 (C1), só volta em 13/11 (IES 2, ponto 2, C2) e ida e volta em 16/11 (volta com IES e ponto diferentes da ida): 200, estado AGENDADO e reservas ATIVO vinculadas ao aluno A (ids 2, 3 e 4).
- O banco, em nova conexão, confirma os trechos e as referências de cada reserva. A lista as quatro reservas e B lista nenhuma.
- Observação: a mensagem de sucesso sai como “Agendamento criado com sucesso”, e o BDD descreve “realizado”. O sentido é o mesmo e a diferença é só de redação; mantida.
- Status: ✅ Passou.

---

#### CT-HU013-API-004 — Novo cadastro sem nenhum trecho

**Técnica/tipo:** tabela de decisão Não/Não; funcional positivo sem criação.

**Dados de entrada:** `POST /transporte/agendamentos` com data útil livre, `usa_ida=false`, `usa_volta=false` e sem campos de referência.

**Passos**

1. Guardar quantidade de reservas, contador e auditoria.
2. Enviar o POST e reler os mesmos dados.

**Resultado esperado**

- 200 com “Nenhum agendamento foi criado.”, `agendamento_criado=false` e estado DISPONIVEL; nenhuma nova reserva nem erro de validação.
- Contador e persistência permanecem iguais (AC-11; #389 item 4b). A existência dessa mensagem no código não substitui a resposta HTTP real.

**Resultado obtido**

- POST com `usa_ida=false` e `usa_volta=false` em 17/11: 422 `FA-003` “Selecione pelo menos um trecho: ida ou volta.”. Reservas ativas 4 antes e 4 depois, sem nova reserva nem auditoria.
- Observação: a suíte descreve 200 com “Nenhum agendamento foi criado.”. Na prática a tela (`configurar.tsx`) exibe essa mensagem sozinha, sem chamar a API, e o BDD AC-10 é um cenário de UI. O resultado para o aluno é o mesmo; mantida a recusa pela API.
- Status: ✅ Passou.

---

### Seção B — Validações e limites

#### CT-HU013-API-005 — Obrigatórios condicionais

**Técnica/tipo:** partição por campo e tabela de decisão trecho utilizado/dispensado; funcional negativo.

**Dados de entrada:** omitir individualmente ponto de embarque/IES de destino na ida e IES de origem/ponto de desembarque na volta; omitir campos do trecho marcado Não.

**Passos**

1. Enviar cada variação mantendo os demais dados válidos.
2. Conferir resposta, campos indicados e banco; usar data livre em cada criação aceita.

**Resultado esperado**

- Trecho Sim incompleto: 422, código FA-003, mensagem do trecho e campos pendentes identificados; nada criado.
- Trecho Não: não exigir seus campos. Os campos do trecho Sim continuam obrigatórios. Nenhuma alteração de contador em recusas.

**Resultado obtido**

- Omitir cada um dos campos do trecho Sim (ponto de embarque, IES de destino, IES de origem, ponto de desembarque): 422 `FA-003` (“Informe os campos obrigatórios da ida/volta”) com o campo indicado, sem criar reserva.
- Ida Sim e volta Não, sem os campos da volta: 200 (reserva id 5). Os campos do trecho Não não são exigidos.
- Status: ✅ Passou.

---

#### CT-HU013-API-006 — Referências e itinerário

**Técnica/tipo:** partições ativo/inativo/inexistente e combinação válida/incompatível; funcional negativo e integridade.

**Dados de entrada:** cada ponto/IES/complementar inativo ou inexistente; ids zero/negativo/texto; ponto e IES sem rota ativa no trecho; complementar ligada a principal que não atende a combinação.

**Passos**

1. Confirmar a massa e enviar um dado inválido por vez em data útil livre.
2. Consultar banco/contador depois das recusas e comparar com o estado anterior.

**Resultado esperado**

- 422 com campo e motivo; ITEM_INATIVO_OU_INEXISTENTE para referência indisponível e FA-002 para combinação sem rota ativa.
- Id fora do formato recusado; nenhuma reserva ou relação inválida persistida. Cadastro administrativo não é permissão de escrita a ser concedida ao aluno.

**Resultado obtido**

- Onze variações, todas 422 e sem criar reserva (ativos 5 antes e 5 depois): ponto e IES inexistentes, IES inativa e ponto inativo → `ITEM_INATIVO_OU_INEXISTENTE`; ids `0`, `-1` e `"abc"` → 422 de validação (formato padrão do FastAPI); IES e ponto sem rota ativa e complementar incompatível com a combinação → `FA-002`; complementar 9999 → `ITEM_INATIVO_OU_INEXISTENTE`.
- Status: ✅ Passou.

---

#### CT-HU013-API-007 — Duplicidade e concorrência

**Técnica/tipo:** partição por dono/data e concorrência sobre a restrição de unicidade.

**Dados de entrada:** reserva ativa de A; novo POST de A para a mesma data; B na mesma data; duas chamadas simultâneas de A em outro dia livre; dia anteriormente cancelado.

**Passos**

1. Repetir POST de A e enviar POST de B para a mesma data.
2. Em dia livre, enviar duas requisições simultâneas e conferir quantidade de registros ativos.
3. Após cancelamento real, reagendar a data como A.

**Resultado esperado**

- Duplicidade: 409 FA-001 e “Já existe um agendamento ativo para este dia. Edite ou cancele o agendamento existente.” (#389).
- Concorrência: somente uma criação efetiva; outra chamada recusada, sem erro 500 nem duas reservas ativas. B pode reservar sua própria vaga nessa data.
- Registro cancelado não bloqueia novo agendamento; id antigo preservado e novo id ativo.

**Resultado obtido**

- Duplicidade de A na mesma data: 409 `FA-001`. B na mesma data: 200 (reserva id 7). Duas chamadas simultâneas de A em 23/11: um 200 e um 409, com uma única reserva ativa (id 8).
- Cancelamento (DELETE do id 6) seguido de novo POST em 20/11: 200 com novo id 9; o id antigo fica CANCELADO.
- Observação: o texto do 409 é “Já existe agendamento ativo para este dia.”, mais curto que o da #389 (que acrescenta “Edite ou cancele o agendamento existente.”). Código e comportamento iguais; mantido.
- Status: ✅ Passou.

---

#### CT-HU013-API-008 — Limites da janela

**Técnica/tipo:** valor-limite D−1/D/D+29/D+30 e formato de data.

**Dados de entrada:** datas calculadas a partir de D; data inválida como `2026-02-30`; token de A com vagas disponíveis.

**Passos**

1. Conferir D, hora e fuso do servidor; enviar POSTs nos limites e consultar o calendário.
2. D e D+29 são aceitos se úteis; se um limite cair no fim de semana, conferir separadamente a janela e a indisponibilidade, sem tratar sábado como dia permitido.

**Resultado esperado**

- Janela padrão de 30 dias inclui hoje e termina em D+29. D−1 e D+30: 422 DATA_FORA_DA_JANELA; data inválida: 422 de validação.
- Não oferecer datas fora da janela como disponíveis. Alterar o relógio do host não faz parte da preparação.

**Resultado obtido**

- D−1 (09/11) e D+30 (10/12): 422 `DATA_FORA_DA_JANELA`. D (10/11) e D+29 (09/12, quarta): 200. `2026-02-30` e `10-11-2026`: 422 de validação (formato padrão do FastAPI). Sábado 14/11 e domingo 15/11: 422 `DATA_INDISPONIVEL`.
- Status: ✅ Passou.

---

#### CT-HU013-API-009 — Limite de ativos e configuração

**Técnica/tipo:** valor-limite 21/22 e 4/5; integração de configuração.

**Dados de entrada:** A com 21 e depois 22 ativos; dia útil livre e sem duplicidade; configuração alternativa `AGENDAMENTO_LIMITE_ATIVOS=5` e `AGENDAMENTO_JANELA_DIAS=15` em stack independente.

**Passos**

1. Montar massa documentada; criar a 22ª reserva e tentar outra em data válida livre. Se a janela não tiver dia útil livre para isolar o limite, usar fixture explícita de contagem, sem contabilizar a fixture como criação aceita pela API.
2. Repetir limite configurado 4 → 5 → recusa; conferir último dia de janela de 15 dias (D+14) e primeiro fora (D+15).
3. Editar reserva existente sem aumentar a quantidade.

**Resultado esperado**

- 21 → 22 aceito; nova criação com 22 recusada: 422 LIMITE_AGENDAMENTOS / “Limite de agendamentos ativos atingido.”, sem exceder a contagem.
- Configuração alternativa respeitada; edição não consome nova vaga. Contagem por reserva/dia, sem duplicar ida e volta.

**Resultado obtido**

- Janela padrão com exatamente 22 dias úteis. Aluno C: 21 e 22 reservas aceitas pela API (ativos 21 e 22). Para isolar o limite, uma reserva foi movida no banco para o sábado 14/11 (continua ATIVA) e liberou 09/12. Fixture documentada, não contada como criação pela API. A tentativa em 09/12 retornou 422 `LIMITE_AGENDAMENTOS` “Limite de agendamentos ativos atingido.”, com 22 ativos. O PUT de edição manteve 22.
- Configuração alternativa (segundo backend na porta 8113, mesmo banco, limite 5 e janela de 15 dias): aluno D teve 5 reservas aceitas e a 6ª foi recusada com `LIMITE_AGENDAMENTOS`. D+14 (24/11) foi aceito e D+15 (25/11) recusado com `DATA_FORA_DA_JANELA`.
- Status: ✅ Passou.

---

### Seção C — Edição, acesso e integridade

#### CT-HU013-API-010 — Editar e cancelar sem trechos

**Técnica/tipo:** transição de trechos e ATIVO → CANCELADO; integração HU-013/HU-014.

**Dados de entrada:** reserva própria ativa, outra data de A ocupada; PUT válido e PUT com `usa_ida=false`, `usa_volta=false`.

**Passos**

1. Alterar referências/trechos mantendo o id; tentar mover a reserva para a data ocupada.
2. Enviar PUT com ambos os trechos false e reler banco/lista/calendário.

**Resultado esperado**

- Edição válida 200 e mesmo id; conflito 409 preserva o estado anterior.
- Não/Não na edição: 200, “Agendamento cancelado com sucesso”, CANCELADO persistido e contador ajustado. A confirmação do modal é UI e não é testada aqui.
- Liberação de alocação real só pode ser aprovada se a dependência HU-016/018 existir; caso contrário registrar a limitação separada.

**Resultado obtido**

- Reserva id 2 (12/11): PUT válido (ida e volta) 200 com o mesmo id; PUT para o dia ocupado 13/11: 409 `FA-001` com a reserva preservada; PUT para dia livre (19/11): 200 com o mesmo id.
- PUT com `usa_ida=false` e `usa_volta=false`: 200 “Agendamento cancelado com sucesso”, status CANCELADO no banco, ativos de 9 para 8 e dia 19/11 de volta a DISPONIVEL. A liberação de alocação real depende da HU-016/018 e não foi avaliada.
- Status: ✅ Passou.

---

#### CT-HU013-API-011 — Autorização e propriedade

**Técnica/tipo:** partição de credenciais/perfis e autorização por objeto.

**Dados de entrada:** sem token/inválido; administrador; aluno pendente/reprovado/vínculo vencido; B tentando ler/editar id de A; tentativa de informar `aluno_id` de B no POST de A.

**Passos**

1. Confirmar perfis reais e enviar chamadas de criação, leitura e edição para cada credencial.
2. Consultar estado e contador como o dono legítimo.

**Resultado esperado**

- Sem autenticação/inválido: 401; perfil ou aluno sem acesso regular: 403. Outro dono não acessa nem altera a reserva de A (404 de recurso no contrato atual).
- Reserva é vinculada ao token, campo extra `aluno_id` recusado com 422; sem mutações indevidas. Rota HTTP ausente com 404 genérico não aprova essa proteção.

**Resultado obtido**

- Sem token e token inválido: 401. Aluno pendente, reprovado, com vínculo vencido (fixture em `validade_acesso`) e administrador: 403 “Acesso negado” em GET `/meus` e POST.
- B lendo, editando e cancelando a reserva de A (id 3): 404 `RESOURCE_NOT_FOUND`, reserva intacta e total de registros igual (39). `aluno_id` extra no corpo: 422 `extra_forbidden`. Nenhuma mutação indevida.
- Status: ✅ Passou.

---

#### CT-HU013-API-012 — Persistência, rollback e tempo

**Técnica/tipo:** integração transacional e falha controlada; medição básica de desempenho.

**Dados de entrada:** criação/edição válidas, recusa e falha real antes do commit somente no banco de QA.

**Passos**

1. Guardar snapshots; enviar operação válida e reler em nova conexão ao banco, incluindo auditoria de escrita da implementação.
2. Provocar falha antes do commit por mecanismo controlado, retirar a instrumentação e conferir rollback.
3. Medir um agendamento válido em conexão normal.

**Resultado esperado**

- Sem gravação parcial, reserva órfã ou alteração em operação recusada; auditoria corresponde à escrita efetiva da implementação.
- Falha controlada não persiste reserva/alteração parcial; mecanismo de teste removido. Não criar endpoint de falha em produto.
- Referência HTTP até 3 s (RNF-001); não inferir desempenho da renderização móvel nem teste de carga a partir de uma chamada local.

**Resultado obtido**

- POST válido de B (01/12): 200 em 31 ms (mais três POST em 23 a 30 ms), uma linha ATIVA e um registro `CRIAR` em `log_auditoria`, lidos em nova conexão. Recusa (ponto 9999): 422 sem alterar reservas nem auditoria.
- Falha controlada: um `CONSTRAINT TRIGGER` deferido no banco de QA falha no commit do INSERT de 07/12 e a API responde 500, sem reserva nem auditoria parcial. Gatilho e função foram removidos e o POST seguinte para 07/12 respondeu 200.
- Status: ✅ Passou.

## Rastreabilidade e fontes

| Referência | Casos API |
| --- | --- |
| RF-015 — agendamento pelo aluno | 001 a 012 |
| AC-01/02/18/19 — calendário e janela | 002, 008, 009 |
| AC-05 a AC-10/15 — combinações e sucesso | 003 |
| AC-11 — Não/Não sem criação nem erro | 004 |
| AC-06/09/13/14; FA-002/003 — referências e obrigatórios | 005, 006 |
| AC-12 / FA-001 — duplicidade | 007 |
| AC-17 — edição sem trechos cancela | 010 |
| RN-010 — complementar por trecho | 003, 006 |
| RNF-001/012 — desempenho, integridade e acesso | 007, 009, 010, 011, 012 |

- [Requisitos, seção 7.5.1](../../../../../docs/requisitos.md), na base `4e44913d`. Numeração AC acima corresponde ao texto dessa versão; o BDD pode ter numeração diferente.
- [Resposta do PO na issue #389](https://github.com/GOUOCE/GOUCE-app/issues/389#issuecomment-6756236002): não cobrar feriado/recesso; bloquear fins de semana; sem rota ativa é indisponível; janela D a D+29; mensagens de duplicidade e Não/Não.
- [BDD HU-013 no commit d7c952ad](https://github.com/GOUOCE/GOUCE-app/blob/d7c952adfd56eb858aa86f48a68afdab206fc913/bdd/features/epico-04/HU-013.feature), branch `test/bdd-epico-04-hu013-hu014-hu015`, ainda fora da develop analisada. Foi consultado como referência, sem incorporar seus arquivos. Partes sobre feriado/recesso já foram superadas pela resposta do PO.
- [PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377), `feature/front-hu013`, commit `0c0a079c87da54ac5f8cafbd4dbeffa57e84d972` (a primeira execução usou `ee305857`). A execução deve usar esse código exato; o backend mais novo da develop é outra versão.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU013-API-001 | Operações de agendamento não publicadas na aplicação real; bloqueava CT-002 a CT-012. **Corrigido** pelo commit `305ca252` e confirmado no reteste de 10/11/2026. | [BUG-HU013-API-001](issues/BUG-HU013-API-001-rotas-agendamento-nao-publicadas.md) — [#399](https://github.com/GOUOCE/GOUCE-app/issues/399) |

## Observações gerais

- Esta suíte cobre apenas API. Não há execução nem nova suíte de UI nesta entrega.
- Evidência final em um único JSON simples, sem pastas de executor/evidências e sem credenciais. Riscos de leitura só serão chamados de defeitos após reprodução HTTP.
- O gate do CT-001 impede que uma indisponibilidade de integração seja contabilizada como doze defeitos diferentes ou como aprovação de regras nunca exercitadas.

- Reteste de 10/11/2026 no commit `0c0a079c`: **12 passaram, 0 falharam, 0 bloqueados**. O bloqueio da primeira execução ([#399](https://github.com/GOUOCE/GOUCE-app/issues/399)) foi corrigido e os casos dependentes foram executados contra a API real, com HTTP e PostgreSQL reais. [Resumo da evidência](EVIDENCIAS-HU-013.json).
- Diferenças só de redação ou de tratamento, sem impacto no sentido da regra: mensagem de sucesso “criado” em vez de “realizado”; recusa do Não/Não pela API (a tela mostra “Nenhum agendamento foi criado.” sozinha); texto do 409 de duplicidade mais curto que o da #389; ids e datas malformados no corpo saem no formato padrão do FastAPI (em inglês); respostas de PUT e cancelamento trazem `agendamento_criado: true`. Nenhuma foi registrada como defeito.
- Fixtures de banco (documentadas): `validade_acesso` vencida do aluno F (CT-011) e uma reserva movida para sábado (CT-009).
