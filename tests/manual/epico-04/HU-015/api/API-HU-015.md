# Testes manuais de API — HU-015 — Consulta de Rota Complementar e Transferência

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Agendamento de Transporte — Aluno (EP-004) |
| Funcionalidade | HU-015 — Consulta de Rota Complementar e Transferência |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, autorização e atualização de dados — baseado em risco |
| Endpoints | `GET /transporte/agendamentos/detalhes?data=YYYY-MM-DD`, `GET /transporte/agendamentos/{id}` e `GET /transporte/agendamentos/meus`. Preparação pela HU-013/014 e cadastros administrativos. |
| Base do planejamento | `feature/front-hu015` `4ac87b4623b493af2d56012d60b8c3b875c3af7e` ([PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379)) |
| Branch de planejamento | `test/planejamento-api-ui-hu-015-integrado`, com entrega para `develop`; código de referência na feature acima |
| Revisão do planejamento | 10/11/2026 — contrato integrado, BDD e decisões do PO |
| Ambiente | HTTP real `http://127.0.0.1:8015`; Docker `atu-qa-hu015`; PostgreSQL 15; Alembic `81_add_updated_at_rotas`; `America/Fortaleza` |
| Total de casos | 8 |
| Última execução | 10/11/2026, 00:51:47–00:51:53 (−03:00); LLM |
| Branch de execução | `feature/testes-api-hu-015`, criada da develop `e177426e49aa798103fe969fac85db4aa3749801` |
| Código executado | `feature/front-hu015` `4ac87b4623b493af2d56012d60b8c3b875c3af7e`; checkout separado e sem mudanças |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ❌ Executada com falhas e dependência | 8 | 5 | 2 | 0 | 1 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e PostgreSQL reais em ambiente isolado, com migrations do commit alvo até `81_add_updated_at_rotas`. Registrar URL, SHAs, data/fuso e revisão aplicada. Não usar `create_all`/mock para substituir a integração HTTP. [Guia](README.md). |
| PC-02 | Tokens reais de A e B, alunos aprovados e com vínculo válido; administrador para preparar referências; pendente, reprovado e vínculo vencido para API-006. Credenciais fora do Git. |
| PC-03 | P1 **Rota Centro - UFC**, saída 06:30/retorno 17:30, atendendo bairro/ponto/IES da ida; P2 **Rota Campo - IFCE**, 06:40/18:40, atendendo a volta independente. C1 **Van 2 - Bairro Novo**, 05:45/18:15, conexão **Trevo do Bairro Novo**, ligada a P1. C2 **Van 5 - Planalto**, 06:05/19:10, conexão **Conexão Planalto**, ligada a P2. |
| PC-04 | Reservas de A em dias úteis distintos dentro da janela: **AI** só ida C1; **AV** só volta C2; **AIV** C1 na ida/C2 na volta; **AM1** C1 na ida/volta direta; **AM2** ida direta/C2 na volta; **AD** ambos diretos. Criar pela API da HU-013, registrando ids/datas/referências reais. P1/P2 atendem as combinações usadas; não presumir id 1. |
| PC-05 | B possui **BI** na mesma data de AIV, com outra linha/conexão; preparar ainda uma data reservada somente por B, **AC** própria cancelada via HU-014 e uma data sem reserva de qualquer aluno. |
| PC-06 | D é a data local do servidor. Escolher datas válidas e atuais, sem alterar relógio do host. As datas fixas do BDD são exemplos e devem ser adaptadas; os dados de linha/horário/conexão permanecem identificáveis. |
| PC-07 | Sem alocação nesta base, `onibus` e `motorista` nulos são esperados e não bloqueiam API-003. Apenas API-008 e a parte futura de UI-008 dependem da implementação real do épico 5. |

## Contrato de referência

- `AgendamentoDetalheDTO`: campos da reserva, nomes das referências e objetos independentes `rota_complementar_ida/volta` e `rota_principal_ida/volta`, além de `atualizado_em`, `pode_remover` e `pode_editar`.
- Complementar: `id`, `nome`, `horario_saida`, `horario_retorno` e `ponto_conexao`. Principal: `id`, `nome`, os dois horários, `faculdades` e `onibus`/`motorista` nulos até existir alocação.
- Consulta por data já existe e está declarada antes de `/{id}`; o router já está incluído em `backend/main.py`. Confirmar no ambiente durante API-001, sem tratar a leitura como teste executado.
- Não há header HTTP ETag exigido: a versão usada pelo front é `atualizado_em` no corpo. O cache do dispositivo pertence à suíte de UI.

## Resumo da execução

Execução real em 10/11/2026: **205 chamadas HTTP**, incluindo preparação e seis logins reais; **447 verificações**, 440 satisfeitas e sete divergências agrupadas em dois defeitos. API-001 a API-007 executados; API-008 bloqueado pela alocação futura. [Evidência em JSON](EVIDENCIAS-HU-015.json). Os 10 casos de UI permanecem pendentes.

### Seção A — Contrato e consulta

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-API-001 | Consultar por data, id e lista | A autenticado; AIV com id/data conhecidos; GET `/transporte/agendamentos/detalhes?data=<data de AIV>`, GET `/transporte/agendamentos/{id}` e GET `/transporte/agendamentos/meus`. | 200; data/id/lista concordam com a mesma reserva e o contrato atual. | ✅ PASSOU | BDD: consulta por data, lista e dados da transferência. |
| CT-HU015-API-002 | Rotas e complementares independentes por trecho | AI (só ida C1), AV (só volta C2), AIV (C1 na ida/C2 na volta), AM1 (C1 na ida/volta direta) e AM2 (ida direta/C2 na volta). | 200; C1/C2 e principais corretas em cada trecho, incluindo trajetos mistos. | ✅ PASSOU | BDD: complementar por trecho e informação necessária à transferência. |
| CT-HU015-API-003 | Trajeto direto e campos sem alocação | AD com ida e volta diretas; AI/AIV sem alocação diária de veículo/motorista. | 200; direto sem complementar; principais preservadas e ônibus/motorista nulos. | ✅ PASSOU | BDD: trajeto direto e dados nulos sem alocação. |

### Seção B — Recusas e controle de acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-API-004 | Consulta ausente, cancelada ou com parâmetro inválido | AC cancelada; data sem reserva ativa; id numérico inexistente; id `abc`; query `data` ausente, `10-11-2026` e `2026-02-30`. | 404 para recurso indisponível; 422 para parâmetro inválido, com mensagens conferidas. | ❌ FALHOU | BDD: recusas por data, identificador inválido e agendamento indisponível. |
| CT-HU015-API-005 | Isolamento entre alunos na mesma data | AIV de A e BI de B na mesma data, com linhas/pontos distintos; outra data reservada somente por B. | Somente dados do dono; id/data exclusivos de outro aluno não vazam informações. | ✅ PASSOU | BDD: lista restrita e detalhe de outro aluno. |
| CT-HU015-API-006 | Autenticação e perfis sem acesso regular | Sem token; token inválido; administrador; aluno pendente, reprovado e com vínculo vencido; aluno aprovado como controle. | 401 sem credencial válida; 403 para perfil/estado sem acesso; dados preservados. | ✅ PASSOU | BDD: perfis negados e ausência de autenticação. |

### Seção C — Atualização e programação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU015-API-007 | Versão da informação e atualização das referências | AI e AIV já consultadas; `atualizado_em` anotado; mudanças reais de horário/ponto da complementar, nome/faculdades da principal e nome de ponto/IES. | Dados alterados reaparecem nos três GETs e a versão sustenta a atualização do cache. | ❌ FALHOU | Integração do atualizado_em e BDD de reconexão/atualização. |
| CT-HU015-API-008 | Programação diária quando houver alocação real | Mesma linha em D1/D2; ônibus V1/V2 e motorista definidos pelo fluxo real das HU-016/017/018; depois realocação de D1. | Veículo corresponde à data e muda com a programação, após integração da alocação. | 🚫 BLOQUEADO | BDD: veículo por dia e alteração; depende de HU-016/017/018. |

## Detalhamento dos casos

### Seção A — Contrato e consulta

#### CT-HU015-API-001 — Consultar por data, id e lista

**Técnica/tipo:** Integração de contrato; partição por operação de consulta.

**Dados de entrada:** A autenticado; AIV com id/data conhecidos; GET `/transporte/agendamentos/detalhes?data=<data de AIV>`, GET `/transporte/agendamentos/{id}` e GET `/transporte/agendamentos/meus`.

**Passos**

1. Conferir health, OpenAPI e revisão Alembic do build indicado nas pré-condições.
2. Consultar a mesma reserva por data e por id; localizá-la também em `/meus`.
3. Comparar campos e referências com o banco em nova conexão; guardar HTTP e corpo sem credenciais.

**Resultado esperado**

- HTTP 200 nas três operações; a consulta por data identifica a reserva de A e não é interpretada como id textual.
- Mesmo `id`, `aluno_id`, `data`, trechos, referências e resumos de rotas nos três retornos. `/meus` contém `agendamentos`, `ativos` e `limite`.
- O detalhe contém `rota_complementar_ida/volta`, `rota_principal_ida/volta` e `atualizado_em` no contrato descrito abaixo. GET não muda reservas nem contador.
- Se as operações não estiverem publicadas, registrar o bloqueio de integração antes de concluir sobre regras dependentes; não inserir router em app de teste para aprovar a aplicação real.

**Resultado obtido**

- Health/OpenAPI 200; migration 81 aplicada em banco vazio. AIV id 3, 13/11/2026: data/id/lista retornaram 200 com corpos iguais e campos conferidos contra o PostgreSQL em nova conexão. Flags e contador corretos; GETs preservaram reservas/auditoria.
- Status: ✅ PASSOU.

---

#### CT-HU015-API-002 — Rotas e complementares independentes por trecho

**Técnica/tipo:** Tabela de decisão trecho utilizado × complementar presente; integração com referências.

**Dados de entrada:** AI (só ida C1), AV (só volta C2), AIV (C1 na ida/C2 na volta), AM1 (C1 na ida/volta direta) e AM2 (ida direta/C2 na volta).

**Passos**

1. Consultar cada reserva por id e por data, com token de A.
2. Conferir nomes, ids, horários, conexão, principal e faculdades do trecho contra os cadastros reais.
3. Comparar os cinco arranjos sem reutilizar a resposta de uma data como esperado da outra.

**Resultado esperado**

- Cada complementar presente retorna `id`, `nome`, `horario_saida`, `horario_retorno` e `ponto_conexao` reais. C1: 05:45/18:15 e Trevo do Bairro Novo; C2: 06:05/19:10 e Conexão Planalto.
- AI tem somente ida e AV somente volta; trecho não utilizado não recebe principal/complementar fictícias.
- AIV preserva C1/P1 na ida e C2/P2 na volta. AM1 e AM2 têm `null` apenas no objeto de complementar do trecho direto, com principal correspondente presente.
- Ponto, IES e faculdades atendidas pertencem à principal de cada trecho. A resposta fornece ambos os horários; a escolha visual de saída na ida e retorno na volta é conferida em UI-002.

**Resultado obtido**

- AI id 1 (11/11), AV id 2 (12/11), AIV id 3 (13/11), AM1 id 4 (16/11) e AM2 id 5 (17/11), todos de 2026: data/id/lista 200 e equivalentes. C1/P1 na ida e C2/P2 na volta, horários/conexões/IES corretos. Trecho não usado sem objetos; trecho direto sem complementar e com principal.
- Status: ✅ PASSOU.

---

#### CT-HU015-API-003 — Trajeto direto e campos sem alocação

**Técnica/tipo:** Partição com/sem complementar e com/sem alocação; funcional positivo.

**Dados de entrada:** AD com ida e volta diretas; AI/AIV sem alocação diária de veículo/motorista.

**Passos**

1. Consultar AD por data, por id e na lista.
2. Conferir objetos de complementar, principais e campos `onibus`/`motorista`; repetir com AI/AIV.
3. Comparar ids/nomes de pontos, IES e principais com a massa.

**Resultado esperado**

- AD retorna 200, ids/nomes de complementar e objetos `rota_complementar_ida/volta` nulos; principais dos trechos usados continuam presentes.
- Enquanto não existir alocação, `onibus: null` e `motorista: null` em cada principal, inclusive em viagens com complementar. Não preencher com dados do protótipo.
- A ausência de alocação é o estado esperado atual (AC-02; #389 item 7), sem bloquear a consulta básica. A ocultação dos campos na tela é UI-003.
- Quando a alocação existir, validar programação em API-008; não exigir objetos de veículo fictícios para aprovar este caso.

**Resultado obtido**

- AD id 6, 18/11/2026: data/id/lista 200; ids/nomes/objetos das complementares nulos e principais preservadas. AD, AI e AIV retornaram onibus/motorista nulos em cada principal utilizada, conforme o estado sem alocação.
- Status: ✅ PASSOU.

---

### Seção B — Recusas e controle de acesso

#### CT-HU015-API-004 — Consulta ausente, cancelada ou com parâmetro inválido

**Técnica/tipo:** Partições ativo/cancelado/inexistente e formato/data civil válidos ou inválidos.

**Dados de entrada:** AC cancelada; data sem reserva ativa; id numérico inexistente; id `abc`; query `data` ausente, `10-11-2026` e `2026-02-30`.

**Passos**

1. Confirmar AC e a ausência de reserva nas datas negativas.
2. Enviar as consultas por data e id; registrar cada resposta separadamente.
3. Conferir que não houve mutação nem retorno de detalhes de outra reserva.

**Resultado esperado**

- Por id cancelado/inexistente: 404 `RESOURCE_NOT_FOUND`, “Agendamento não encontrado.”. Por data sem reserva ativa, incluindo a cancelada: 404 `RESOURCE_NOT_FOUND`, “Nenhum agendamento ativo para esta data.”.
- Id textual e query ausente/formato inválido/data civil impossível: 422; sem erro 500 ou interpretação de `/detalhes` como identificador numérico.
- Para formato inválido, o BDD define “Data deve estar no formato YYYY-MM-DD.”. Se a validação do router devolver 422 com outro texto técnico, registrar a divergência de mensagem separadamente da recusa correta.
- Nenhuma recusa informa uma viagem inventada nem muda reserva, contador ou auditoria.

**Resultado obtido**

- Oito variações: AC id 7 cancelada (19/11/2026), id inexistente e datas sem reserva retornaram 404 RESOURCE_NOT_FOUND com as mensagens previstas; abc, query ausente, formato inválido e data impossível retornaram 422. Em data=10-11-2026, a mensagem veio técnica em inglês, divergindo do BDD. A data civil impossível retornou a mensagem correta em português. Reservas/auditoria preservadas. Falha de mensagem: BUG-HU015-API-001.
- Status: ❌ FALHOU.

---

#### CT-HU015-API-005 — Isolamento entre alunos na mesma data

**Técnica/tipo:** Autorização por objeto; tabela dono × id/data consultados.

**Dados de entrada:** AIV de A e BI de B na mesma data, com linhas/pontos distintos; outra data reservada somente por B.

**Passos**

1. Como A, consultar `/meus`, AIV por data e BI por id.
2. Consultar como A a data que possui reserva apenas de B; repetir as consultas como B para confirmar a massa.
3. Conferir que cada retorno autorizado contém somente o dono correto e que os dados persistidos não mudaram.

**Resultado esperado**

- A recebe apenas suas reservas e dados de transferência. Na data compartilhada, a consulta por data retorna AIV para A e BI para B.
- A pedindo o id de BI recebe 404 `RESOURCE_NOT_FOUND` / “Agendamento não encontrado.”, sem expor dono/rota de B.
- Data com reserva somente de B retorna 404 de ausência para A; `/meus` de A não contém BI. Leituras não alteram dados.
- O isolamento independe do cache do cliente, verificado separadamente em UI-009.

**Resultado obtido**

- A (aluno 2) e B (aluno 3) consultaram reservas distintas na mesma data 13/11/2026: AIV id 3 com C1 na ida e BI id 8 com C2. Id alheio retornou 404 para ambos; listas restritas ao dono. Data 20/11/2026 só de B retornou 404 para A e 200 para B. Sem mutação.
- Status: ✅ PASSOU.

---

#### CT-HU015-API-006 — Autenticação e perfis sem acesso regular

**Técnica/tipo:** Partição de credenciais/perfis; controle de acesso negativo.

**Dados de entrada:** Sem token; token inválido; administrador; aluno pendente, reprovado e com vínculo vencido; aluno aprovado como controle.

**Passos**

1. Confirmar o estado real das contas via login/consulta administrativa permitida, sem versionar tokens.
2. Para cada credencial, consultar `/meus`, `/detalhes?data=<data de AI>` e `/{id de AI}`.
3. Reler as reservas como o aluno legítimo; anotar qualquer credencial que não foi possível preparar.

**Resultado esperado**

- Sem token/inválido: 401. Administrador e aluno sem acesso regular: 403 em todas as consultas do módulo.
- Nenhuma resposta recusada expõe complementar, principal ou dados pessoais; nenhum GET recusado altera a massa.
- Aprovado com vínculo válido continua consultando com 200. Token expirado renovado com sucesso não conta como recusa de autenticação efetivamente exercitada.
- 404 de caminho inexistente não comprova autorização e deve ser separado de 401/403 de operação publicada.

**Resultado obtido**

- 18 recusas nos três GETs: sem token e token inválido 401; administrador, pendente, rejeitado e vínculo vencido 403. Contas sintéticas confirmadas por login HTTP 200; A aprovado manteve consultas 200. Sem exposição dos detalhes e sem escrita em reservas/auditoria.
- Status: ✅ PASSOU.

---

### Seção C — Atualização e programação

#### CT-HU015-API-007 — Versão da informação e atualização das referências

**Técnica/tipo:** Transição de estado online; integração entre dado visível e versão de cache.

**Dados de entrada:** AI e AIV já consultadas; `atualizado_em` anotado; mudanças reais de horário/ponto da complementar, nome/faculdades da principal e nome de ponto/IES.

**Passos**

1. Ler a reserva duas vezes sem alterar dados; comparar versão e persistência.
2. Pela API administrativa, alterar um campo por vez da referência de teste e consultar novamente por data/id/lista.
3. Confirmar os valores atuais e comparar `atualizado_em`; restaurar a massa antes das próximas variações.

**Resultado esperado**

- A resposta reflete as alterações reais nas referências corretas, mantendo id/dono/data da reserva.
- `atualizado_em` é um timestamp válido com informação temporal utilizável pelo cliente, estável sem mudança e sem regressão após alteração.
- Quando uma informação exibida muda, a versão deve permitir atualizar o cache. Conferir também ponto/IES e faculdades, porque o cliente só regrava o detalhe se a versão mudar. Se o payload mudar com versão antiga, registrar risco confirmado para a persistência offline em UI-007.
- GET não cria edição, cancelamento ou log de escrita. Esta verificação usa o campo do corpo; não exige header HTTP ETag inexistente no contrato.

**Resultado obtido**

- Leituras estáveis e timestamp ISO8601 com fuso confirmados. PATCHs reais de horário/conexão da complementar e nome da principal atualizaram payload e versão em AI/AIV. Adição isolada de faculdade na principal, mudança de capitalização do mesmo ponto e renomeação da IES mudaram os dados nos três GETs sem mudar atualizado_em: seis divergências (três alterações × duas reservas). Massa restaurada por PATCH após cada variação; reservas preservadas e GETs sem escrita. BUG-HU015-API-002. Cache no dispositivo não executado.
- Status: ❌ FALHOU.

---

#### CT-HU015-API-008 — Programação diária quando houver alocação real

**Técnica/tipo:** Tabela data × veículo e transição de programação; integração futura RN-010.

**Dados de entrada:** Mesma linha em D1/D2; ônibus V1/V2 e motorista definidos pelo fluxo real das HU-016/017/018; depois realocação de D1.

**Passos**

1. Confirmar que a alocação real já está implementada no build testado e preparar a programação pelos fluxos suportados.
2. Consultar as duas datas e comparar com as alocações efetivas.
3. Alterar somente D1 por operação real, consultar novamente e conferir a versão da informação.

**Resultado esperado**

- Cada consulta informa o ônibus/motorista da própria data; alterar D1 atualiza o retorno de D1 e preserva D2, mantendo a transferência correspondente.
- Não usar o nome cadastrado da linha como prova de veículo escalado nem montar objeto de ônibus por mock.
- Na base analisada esses campos são nulos e a alocação futura não existe: manter este caso pendente no planejamento e marcar 🚫 na execução enquanto faltar a dependência.
- Essa dependência não bloqueia os casos de contrato, transferência e ocultação sem alocação (API-001 a API-007).

**Resultado obtido**

- Bloqueado: o build não integra alocação diária real de ônibus/motorista HU-016/017/018. Campos nulos foram confirmados em API-003; não houve simulação de programação para aprovar este caso.
- Status: 🚫 BLOQUEADO.

---

## Rastreabilidade

| Critério/regra | Cenários BDD de referência | Casos API | Complemento UI |
| --- | --- | --- | --- |
| AC-01 — consulta e dados de transferência | API informa o detalhe ativo de uma data; dados da transferência; lista de Meus agendamentos | 001, 002 | 001, 002, 004 |
| AC-01 — complementar por trecho | API informa a complementar de cada trecho | 002 | 002 |
| AC-02 / #389 item 7 — sem alocação | API não preenche ônibus e motorista sem alocação | 003 | 003 |
| AC-03 / FA-001 — direto | API não informa complementar para trajeto direto | 003 | 003, 004 |
| AC-04 / FA-002 / RNF-015 — offline | Cache, mesmos dados, ausência de cache, atualização ao reconectar | 007 fornece a versão; offline não se aprova por GET | 005 a 010 |
| RN-010 — programação | Veículo por dia; alteração do veículo | 008, dependente do épico 5 | 008, parte futura |
| RF-029 — recurso indisponível | Recusa por data, cancelado/inexistente, identificador inválido | 004 | 001, 010 |
| RF-029 — titularidade | Detalhe de outro aluno; lista restrita | 005 | 009 |
| RF-029 — acesso regular | Perfis sem acesso; sem autenticação | 006 | 009, 010 |
| Revalidação da informação | Atualização ao restabelecer a conexão, complementada pelo risco de atualizado_em | 007 | 007 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU015-API-004 | Mensagem técnica para data em formato inválido; 422 correto, mensagem do BDD descumprida. | [BUG-HU015-API-001](issues/BUG-HU015-API-001-mensagem-data-invalida.md), relato local |
| CT-HU015-API-007 | Payload de ponto/IES/faculdades muda com versão antiga, prejudicando a revalidação do cache. | [BUG-HU015-API-002](issues/BUG-HU015-API-002-versao-desatualizada-detalhe.md), relato local |

## Fontes e observações

- [Requisitos, seção 7.5.3](../../../../../docs/requisitos.md): AC-01 a AC-04, FA-001/002, RN-010, RF-029 e RNF-015.
- [BDD HU-015](../../../../../bdd/features/epico-04/HU-015.feature) e [README do BDD](../../../../../bdd/features/epico-04/README.md), presentes neste checkout; os títulos na rastreabilidade correspondem aos cenários reais. Não foram modificados nesta entrega.
- [Resposta do PO na #389](https://github.com/GOUOCE/GOUCE-app/issues/389#issuecomment-6756236002), itens 6 e 7: saída na ida, retorno na volta e campos de ônibus/motorista ocultos sem alocação.
- [PR #379](https://github.com/GOUOCE/GOUCE-app/pull/379), branch `feature/front-hu015`, commit **`4ac87b4623b493af2d56012d60b8c3b875c3af7e`**, com backend e front no mesmo checkout.
- Este planejamento substitui as premissas anteriores de endpoint de detalhe ausente e DTO incompleto. Nenhum resultado da execução da HU-013 em outro commit é aplicado automaticamente aqui.
- Na execução, registrar HTTP/corpo e persistência, preservando o esperado. Evidência final em um único JSON simples; não criar pastas de executor/evidências nem registrar senhas/tokens.
- Se o código retornar outro texto para uma recusa ou não atualizar a versão de dados visíveis, registrar o comportamento real. Riscos não são relatados como defeitos antes da reprodução.
