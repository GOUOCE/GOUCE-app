# Testes manuais de API — HU-013 — Agendamento de Transporte

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-013 — Agendamento de Transporte |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, autorização e persistência — baseado em risco |
| Operações | `GET /transporte/agendamentos/calendario?mes=YYYY-MM`, `GET /transporte/agendamentos/meus`, `GET /transporte/agendamentos/{id}`, `POST /transporte/agendamentos`, `PUT /transporte/agendamentos/{id}`; opções usadas pelo front a conferir no contrato |
| Branch de resultados | `feature/testes-api-hu-013`, criada da `develop` `4e44913d` |
| Código a testar | `feature/front-hu013`, commit `ee305857954fcb23f3919f3ebfe7e163fcbc167a`, [PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377) |
| Ambiente | API e PostgreSQL reais em stack isolada; URL, data e versões serão registradas na execução |
| Total de casos | 12 |
| Última execução | Não realizada |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 12 | 0 | 0 | 0 | 0 | 12 |

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
| CT-HU013-API-001 | API publicada na aplicação real | Health, OpenAPI, GET/POST/PUT autenticados | Health 200; operações de agendamento presentes e acessíveis conforme contrato | ⏳ PENDENTE | Verificar registro do router antes dos demais casos. |
| CT-HU013-API-002 | Calendário, opções e dias úteis | Mês de D/adjacente; dia útil/sábado/domingo; sem rota ativa | Estados coerentes, somente D a D+29 disponíveis; fim de semana/sem rota indisponíveis; opções reais ativas | ⏳ PENDENTE | Sem cobrança de feriado/recesso (#389). |
| CT-HU013-API-003 | Criar ida, volta e ambos | Três reservas válidas; IES/ponto da volta independentes; C1/C2 | 200, mensagem de sucesso, vínculo ao aluno e trechos corretos no banco | ⏳ PENDENTE | Conferir persistência e calendário. |
| CT-HU013-API-004 | Novo cadastro sem nenhum trecho | POST com `usa_ida=false` e `usa_volta=false` | 200, “Nenhum agendamento foi criado.”, sem nova reserva nem erro | ⏳ PENDENTE | AC-11 e decisão #389. |

### Seção B — Validações e limites

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-API-005 | Obrigatórios condicionais | Sim sem cada ponto/IES; Não sem campos do trecho | 422 FA-003 com campos para trecho utilizado; não exigir trecho não utilizado | ⏳ PENDENTE | Partições ida/volta. |
| CT-HU013-API-006 | Referências e itinerário | Inativo/inexistente; id inválido; ponto/IES sem rota; complementar incompatível | 422; sem vínculo inválido; FA-002 na combinação não atendida | ⏳ PENDENTE | RN-010 e RNF-012. |
| CT-HU013-API-007 | Duplicidade e concorrência | Mesmo aluno/data; duas chamadas simultâneas; outro aluno | 409 FA-001 orientando editar/cancelar; no máximo um ativo por aluno/data | ⏳ PENDENTE | BDD e mensagem do PO #389. |
| CT-HU013-API-008 | Limites da janela | D−1, D, D+29, D+30 e data inválida | Datas permitidas aceitas se úteis; fora da janela/formato inválido 422 | ⏳ PENDENTE | Hoje é o primeiro dos 30 dias (#389). |
| CT-HU013-API-009 | Limite de ativos e configuração | 21 → 22; tentativa com 22; limite configurado 5 | Limite não ultrapassado; 422 LIMITE_AGENDAMENTOS; edição não acrescenta reserva | ⏳ PENDENTE | Massa sem conflito de aluno/data. |

### Seção C — Edição, acesso e integridade

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU013-API-010 | Editar e cancelar sem trechos | PUT válido, PUT para outro dia ocupado e PUT com ambos false | Mesmo id atualizado; conflito 409; sem trechos equivale a cancelamento persistido | ⏳ PENDENTE | Modal é UI; alocação real depende de HU-016/018. |
| CT-HU013-API-011 | Autorização e propriedade | Sem token/inválido; admin; aluno sem acesso regular; outro dono | 401/403 conforme credencial; dados de outro aluno protegidos; sem mutação | ⏳ PENDENTE | Não aprovar segurança com 404 de rota ausente. |
| CT-HU013-API-012 | Persistência, rollback e tempo | Criação válida; recusa; falha controlada antes do commit | Banco consistente; sem gravação parcial; resposta de referência até 3 s | ⏳ PENDENTE | Sem mock ou alteração do produto. |

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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
- [PR #377](https://github.com/GOUOCE/GOUCE-app/pull/377), `feature/front-hu013`, commit `ee305857954fcb23f3919f3ebfe7e163fcbc167a`. A execução deve usar esse código exato; o backend mais novo da develop é outra versão.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Esta suíte cobre apenas API. Não há execução nem nova suíte de UI nesta entrega.
- Evidência final em um único JSON simples, sem pastas de executor/evidências e sem credenciais. Riscos de leitura só serão chamados de defeitos após reprodução HTTP.
- O gate do CT-001 impede que uma indisponibilidade de integração seja contabilizada como doze defeitos diferentes ou como aprovação de regras nunca exercitadas.
