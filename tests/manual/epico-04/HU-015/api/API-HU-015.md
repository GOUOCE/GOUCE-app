# Testes manuais de API — HU-015 — Consulta de Rota Complementar e Transferência

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-015 — Consulta de Rota Complementar e Transferência |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração e autorização — baseado em risco |
| Endpoints reais | `GET /transporte/agendamentos/meus`, `GET /transporte/agendamentos/{id}`; preparação pela HU-013 e cadastro administrativo de complementares |
| Integração a confirmar | O PR #379 chama `GET /agendamentos/detalhes?data=YYYY-MM-DD`, ausente no backend analisado; detalhes completos e alocação diária dependem de contrato integrado |
| Ambiente | A preencher — URL, SHA testado, banco e fuso; base analisada `develop` `99bbf2c6` |
| Total de casos | 7 |
| Última execução | Não realizada |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 7 | 0 | 0 | 0 | 0 | 7 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e PostgreSQL reais em ambiente isolado, migrations aplicadas e leitura das referências de agendamento/rota; seguir o [guia](README.md). Registrar SHAs de back/front e contrato efetivamente disponível. |
| PC-02 | Tokens de A e B, alunos aprovados com vínculo válido. Administrador para preparar massa; aluno sem acesso regular para CT-006. Tokens fora dos registros versionados. |
| PC-03 | Principal P atendendo ponto/IES nos dois trechos; complementares C1 e C2 ativas e ligadas a P, com nomes, pontos de conexão e horários diferentes entre si e do protótipo. C1 com saída `05:45` e retorno `18:15`; C2 com saída `06:05` e retorno `19:10`, desde que válidos na configuração preparada. |
| PC-04 | Reservas próprias em dias válidos distintos: AI (só ida com C1), AV (só volta com C2), AIV (ida com C1 e volta com C2), AD (direta, sem complementar); B tem BI em uma das mesmas datas de A, com outra complementar. Criar pela HU-013 e anotar ids/datas reais. |
| PC-05 | Reserva AC própria cancelada via API da HU-014 antes do CT-007 e id numérico comprovadamente inexistente. Não confundir reserva cancelada com rota HTTP ausente. |
| PC-06 | Contrato de detalhe completo para CT-004 e alocação real por veículo/dia para CT-005. Nenhum dos dois foi encontrado completo no backend analisado; dependências serão avaliadas na execução. |

## Resumo da execução

Executar na ordem, usando token de A salvo indicação. Todos os casos permanecem pendentes; dependências ausentes serão registradas por parte na execução. O cache offline pertence à suíte de UI.

### Seção A — Contrato e vínculos

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-API-001 | Contrato consumido pelo front | OpenAPI; GET do PR e GET real do agendamento | Contrato integrado permite obter a viagem selecionada sem fallback; registrar incompatibilidades reais | ⏳ PENDENTE | Endpoint do PR não localizado na análise. |
| CT-HU015-API-002 | Complementares por trecho e dono | GET `/meus` e `/{id}` de AI/AV/AIV | 200; ids/nomes corretos, ida e volta independentes; sem BI | ⏳ PENDENTE | Executável no contrato atual. |
| CT-HU015-API-003 | Reserva direta | GET de AD | 200; campos de complementar nulos por trecho; nenhum vínculo fictício | ⏳ PENDENTE | Executável no contrato atual. |

### Seção B — Informação para transferência

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-API-004 | Detalhes completos da transferência | AI/AV/AIV; referências C1/C2/P | Nome da linha, horário do trecho e ponto exato de conexão coerentes com a reserva | ⏳ PENDENTE | Depende de resposta integrada; DTO atual expõe somente ids/nomes das complementares. |
| CT-HU015-API-005 | Veículo conforme programação do dia | Mesma linha em duas datas, veículos diferentes | Cada consulta informa veículo e programação da operação correspondente | ⏳ PENDENTE | Depende de alocação real e detalhe integrado (RN-010). |

### Seção C — Acesso e disponibilidade do registro

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-API-006 | Autenticação e isolamento por aluno | Sem token, inválido, administrador, aluno sem acesso; A tentando BI | 401/403 conforme credencial; 404 para id de outro aluno; nenhuma exposição | ⏳ PENDENTE | Repetir no detalhe integrado quando existir. |
| CT-HU015-API-007 | Cancelado, inexistente e parâmetro inválido | GET AC, id inexistente, texto; data sem reserva/ inválida no contrato integrado | 404 para ids indisponíveis, 422 para id textual; detalhe integrado sem viagem inventada | ⏳ PENDENTE | Códigos de consulta por data dependem do contrato que vier a ser documentado. |

## Detalhamento dos casos

### Seção A — Contrato e vínculos

#### CT-HU015-API-001 — Contrato consumido pelo front

**Técnica/tipo:** análise de contrato e integração funcional; partição operação disponível/ausente.

**Dados de entrada:** aluno A, reserva AI; OpenAPI da API real; `GET /agendamentos/detalhes?data=<data de AI>` usado pelo PR; `GET /transporte/agendamentos/{AI}` existente.

**Passos**

1. Anotar versões e procurar no OpenAPI a operação chamada pelo build do front.
2. Enviar as duas chamadas com token de A e guardar HTTP/corpo real; comparar com os campos usados pela tela.
3. Identificar se existe adaptação efetiva entre a reserva e o detalhe completo. Se o build mudar o caminho, registrar o endpoint real e repetir nele.

**Resultado esperado**

- A integração deve permitir consultar a viagem selecionada e fornecer os dados necessários aos AC-01/02/03; não basta renderizar exemplos após erro HTTP.
- Contrato atual do backend: GET por id retorna 200 com `AgendamentoDetalheDTO`. A chamada `/agendamentos/detalhes` não foi encontrada na análise e o DTO real não contém ponto/horário da complementar nem veículo/motorista diário.
- Registrar incompatibilidade de integração se reproduzida. Enquanto não houver contrato completo, bloquear somente as partes dependentes de API-004/005 e prosseguir nos endpoints existentes. Não declarar que o caminho ausente deveria retornar determinado JSON nem considerar um 404 como consulta bem-sucedida.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-API-002 — Complementares por trecho e dono

**Técnica/tipo:** tabela de decisão ida/volta × com/sem complementar; funcional positivo e integridade dos vínculos.

**Dados de entrada:** GET `/transporte/agendamentos/meus` e `/{id}` de AI, AV e AIV; BI pertence a B.

**Passos**

1. Conferir a massa criada pela HU-013 e guardar os ids de C1/C2.
2. Consultar lista e detalhe das três reservas como A; comparar com `agendamento` e referências.
3. Consultar BI como B para confirmar que os dados das duas contas são distintos.

**Resultado esperado**

- 200; AI com `usa_ida: true`, `usa_volta: false`, `rota_complementar_ida_id/nome` de C1 e campos da complementar de volta nulos. AV apresenta somente C2 na volta.
- AIV mantém C1 na ida e C2 na volta, sem copiar/restringir um trecho pelo outro. Data, aluno, ponto e IES correspondem à reserva consultada (AC-01/02, RF-029).
- `/meus` não inclui BI. Leituras não alteram reservas nem contador. Esta verificação de ids/nomes não aprova os horários/ponto de conexão ainda ausentes do detalhe atual.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-API-003 — Reserva direta

**Técnica/tipo:** partição com/sem complementar; funcional positivo.

**Dados de entrada:** AD, com ida e volta diretas e campos de complementar omitidos ou nulos no cadastro válido.

**Passos**

1. Consultar AD em `/meus` e `/{id}`; comparar com a reserva no banco.
2. Quando houver detalhe integrado, consultar AD também nele e comparar as informações da principal com a massa.

**Resultado esperado**

- No contrato atual: 200 e os quatro campos `rota_complementar_ida_id`, `rota_complementar_ida_nome`, `rota_complementar_volta_id` e `rota_complementar_volta_nome` nulos.
- No detalhe integrado: trajeto direto sem instrução de transferência fictícia; informação da principal e de sua operação quando alocada. Não exigir uma chave JSON futura específica (AC-03, FA-001).
- A ocultação visual é UI-003; reserva não deve ser classificada como complementar por parâmetro de navegação ou valor padrão do front.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Informação para transferência

#### CT-HU015-API-004 — Detalhes completos da transferência

**Técnica/tipo:** partição por trecho e comparação com fonte de dados; integração positiva.

**Dados de entrada:** AI/AV/AIV; C1 `05:45`/`18:15`, C2 `06:05`/`19:10`, pontos de conexão distintos e principal P. Usar dados efetivamente preparados, documentando qualquer ajuste.

**Passos**

1. Confirmar o contrato integrado no CT-001. Sem ele, registrar a dependência em vez de fabricar resposta de serviço.
2. Como administrador, consultar `GET /rotas-complementares/{C1 ou C2}` para conferir os cadastros; como A, consultar o detalhe integrado das reservas.
3. Comparar nome da linha, ponto exato de conexão, horário do trecho e vínculo à principal. Em AIV, conferir os dois trechos separadamente.

**Resultado esperado**

- A resposta usada pela tela fornece informação suficiente para localizar a transferência: linha, horário correto e ponto de conexão, sem depender de acesso administrativo do aluno (AC-01/02, RF-029).
- Ida usa o horário de ida e volta usa o de retorno; na massa padrão, AI usa C1 `05:45`, AV usa C2 `19:10`, AIV preserva ambos. Se a programação diária tiver ajuste documentado, comparar com a operação efetiva em vez de presumir que o cadastro prevalece.
- Não substituir ponto de conexão por ponto de embarque nem nome de linha por motorista. Informação não disponível deve ser descrita como tal, sem valores fictícios.
- GET administrativo serve só de referência: conceder ao aluno acesso à gestão de rotas não é requisito. DTO atual de agendamento só com ids/nomes deixa a comprovação completa bloqueada até integração.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-API-005 — Veículo conforme programação do dia

**Técnica/tipo:** tabela de decisão data × operação e transição de programação; integração (RN-010).

**Dados de entrada:** duas reservas próprias em datas válidas D1/D2 na mesma linha complementar; veículo V1 em D1 e V2 em D2, com principal/motorista escalados quando disponíveis.

**Passos**

1. Preparar a programação diária pelo fluxo real de alocação; guardar os ids e dados antes da consulta.
2. Consultar os detalhes de D1 e D2 alternadamente.
3. Atualizar somente a programação de D1 por fluxo permitido e consultar ambas novamente.

**Resultado esperado**

- A informação da complementar usa rota, horário, ponto de conexão e veículo definidos para a operação daquele dia; D1 e D2 não se misturam (RN-010).
- Alteração de D1 aparece em nova consulta online e não altera os dados de D2. Não fixar o veículo pelo nome cadastrado da linha nem pelo protótipo.
- Se alocação/consulta por dia não estiver implementada, registrar o bloqueio. Nomes de linha retornados por GET de agendamento não comprovam veículo escalado. Cache e atualização no dispositivo são UI-006/007.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Acesso e disponibilidade do registro

#### CT-HU015-API-006 — Autenticação e isolamento por aluno

**Técnica/tipo:** partição de credenciais e autorização por objeto; teste negativo de acesso.

**Dados de entrada:** GET `/meus`, GET `/{AI}` e, quando integrado, detalhe da data de AI; sem token, token inválido, administrador, aluno pendente ou com vínculo vencido; token de A para `/{BI}`.

**Passos**

1. Confirmar os perfis/estados reais das contas e executar a matriz de credenciais.
2. Como A, tentar consultar BI por id; consultar a data compartilhada por A/B no detalhe integrado quando disponível.
3. Como B, conferir que BI existe e continua íntegra.

**Resultado esperado**

- Endpoints existentes: 401 sem token/inválido; 403 para administrador e aluno sem acesso regular; 404 `RESOURCE_NOT_FOUND` quando A pede BI por id.
- Na data compartilhada, cada aluno recebe somente a própria viagem, sem dados de B na sessão de A (consulta pessoal da HU-015; integração com controle de acesso).
- Não há mutações por GET. Repetir as proteções no endpoint integrado quando existir, com códigos documentados para ele; 404 de caminho ausente não comprova autorização adequada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU015-API-007 — Cancelado, inexistente e parâmetro inválido

**Técnica/tipo:** partição ativo/cancelado/inexistente e formato válido/inválido; funcional negativo.

**Dados de entrada:** GET `/transporte/agendamentos/{AC}`, id numérico inexistente e `/transporte/agendamentos/abc`; no detalhe integrado, data válida sem reserva e data inválida como `2026-02-30`.

**Passos**

1. Confirmar que AC foi cancelada e guardar o estado de uma reserva ativa de controle.
2. Executar as chamadas aos ids atuais; depois as variações por data, somente quando o endpoint integrado estiver documentado.
3. Conferir respostas e ausência de alteração em reservas/alocação.

**Resultado esperado**

- AC e inexistente: 404 `RESOURCE_NOT_FOUND`, “Agendamento não encontrado.”. Id textual: 422. Nenhuma viagem ativa ou transferência é inventada para esses registros.
- No contrato integrado: data sem reserva deve indicar ausência de viagem e data inválida deve ser rejeitada conforme o contrato documentado; não prescrever códigos ainda não definidos nem aceitar detalhes fictícios como resposta válida.
- Respostas de ausência/recusa recebidas online não comprovam falha de rede. O comportamento do cache após cancelamento conhecido é verificado em UI-006/009.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério/regra | Casos API | Complemento UI |
| --- | --- | --- |
| AC-01 — linha, horário e conexão destacados | 001, 002, 004 | UI-001, UI-002 |
| AC-02 — informação clara para transferência | 004, 005 | UI-002 |
| AC-03 / FA-001 — trajeto direto | 003 | UI-003 |
| AC-04 / FA-002 — consulta offline sincronizada | API fornece dados de origem; cache não se aplica ao servidor | UI-004 a UI-009 |
| RN-010 — programação e veículo da operação | 004, 005 | UI-006, UI-007 |
| RF-029 — consulta aplicável à própria viagem | 001 a 007 | UI-001 a UI-003, UI-008 |
| RNF-015 — informação previamente disponibilizada offline | Não aprovado apenas por GET | UI-004, UI-005, UI-007 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Incompatibilidades de leitura estão no índice do épico. | — |

## Observações gerais

- Fontes: [requisitos, seção 7.5.3](../../../../../docs/requisitos.md), [PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379), [índice/versões](../../README.md) e [suíte UI](../ui/UI-HU-015.md).
- BDD da HU-015 não encontrado na base analisada. Rastreabilidade provisoriamente direta aos quatro critérios e às duas alternativas; revisar o BDD quando for adicionado.
- Não executar os casos usando uma API simulada e declarar integração real aprovada. Partes verificáveis do contrato atual e partes dependentes de nova consulta/alocação devem ter conclusões separadas.
