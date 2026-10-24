# Testes manuais de API — HU-010 — Gerenciamento de Motoristas

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Cadastros Base (EP-002) |
| Funcionalidade | HU-010 — Gerenciamento de Motoristas |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /motoristas`, `GET /motoristas/{id}`, `POST /motoristas`, `PATCH /motoristas/{id}`, `PATCH /motoristas/{id}/inativar` e `PATCH /motoristas/{id}/reativar`. Escrita em `application/json`, com `nome` e `telefone`; todas as rotas exigem administrador. |
| Ambiente | A preencher — URL, branch e commit da implementação realmente testada |
| Total de casos | 13 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 13 | 0 | 0 | 0 | 0 | 13 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Na execução futura, stack isolada com banco limpo, API disponível e Postman/Insomnia ou Swagger em `/docs`. Não executar os comandos de stack durante o planejamento. |
| PC-02 | Token de administrador A via `POST /auth/login`, usando o administrador do seed; anotar id do executor e horários para auditoria. |
| PC-03 | Token de aluno ativo e representante; sem login funcional de representante, bloquear só essa parte e registrar a causa. |
| PC-04 | Depois da lista vazia, preparar Raimundo Costa inativo, telefone `88998223344`, por API/banco local. Como a inativação atual retorna 503, registrar a preparação no banco e não contá-la como sucesso da rota. Anotar seu id. |
| PC-05 | **Apoio da IA (Claude Code)** para executar chamadas e conferir dados, status, hashes e logs na API/banco, com validação de Cauan. Tabelas `motorista` e `log_auditoria`; telefone/nome cifrados devem ser lidos pela API ou ORM. |
| PC-06 | CT-002 cria M1 (Francisco/`88998112233`) e M2 (Antônio/`8834125566`); CT-003 cria M3 (homônimo/`88997004455`) e M4 (`88999999999`). Guardar ids; CT-007 muda telefone de M1 para `88996007788`. Para tentativas inválidas, não reaproveitar telefone aceito indevidamente sem registrar a falha. |
| PC-07 | CT-013: HU-017 e registros históricos disponíveis; identificar rotas reais da escalação em `/docs`. Sem suporte, marcar a parte dependente como 🚫 na execução, sem inventar endpoint nem simular alocação como prova. |

## Resumo da execução

Executar na ordem abaixo. São **13 casos essenciais**. CT-001 começa pela lista vazia e repete filtros após preparar massa e CT-002/003. Todas as chamadas usam administrador A, exceto CT-012. Registrar cada variação separadamente.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU010-API-001 | Listar motoristas, consultar e buscar por nome | Lista vazia; filtros de status e nome; id inexistente | 200 com dados corretos; busca por nome; 404 no inexistente | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-002 | Cadastrar celular e telefone fixo válidos | Celular mascarado e fixo de 10 dígitos | 201; sucesso, ativo e valores persistidos | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-003 | Permitir homônimos e telefone presente apenas nos exemplos do app | Mesmo nome/telefone diferente; número dos exemplos ausente no banco | 201; homônimos distintos e número legítimo aceito | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-004 | Bloquear telefone duplicado no cadastro e na edição | Ativo/inativo; máscara; edição com nome e telefone conflitante | 409; mensagem de duplicidade; nenhuma alteração parcial | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-005 | Exigir nome e telefone no cadastro e impedir esvaziamento | Omissões, vazio, espaços e null no POST; vazio na edição | 422 com campo e motivo; nada gravado | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-006 | Validar quantidade de dígitos e conteúdo do telefone | 3/9/12/15 dígitos; letras; mistura de letras e dígitos | 422 “Informe um telefone válido com DDD”; dados mantidos | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-007 | Editar parcialmente e preservar id e dados não enviados | Nome e telefone isolados; mesmo número com máscara; inexistente | 200 sem falso conflito; mesmo id; 404 no inexistente | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-008 | Inativar sem alocação futura e manter o registro | Inativação válida sem alocação; inexistente | 200 e soft delete; implementação atual tende a 503 | ⏳ PENDENTE | Falha esperada no código; não executado. |
| CT-HU010-API-009 | Reativar inativo e repetir sem duplicar auditoria | Inativo → ativo; repetição; inexistente; rota do app | 200 com persistência; repetição sem novo log; inexistente 404 | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-010 | Auditar todas as escritas efetivas | Cadastro/edição/status e tentativas recusadas | Um log por escrita efetiva; usuário, ação e timestamp | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-011 | Rejeitar campos fora do contrato e PATCH vazio | extra=forbid; mudança indireta de status; atualização sem campos | 422; sem alteração nem desvio da inativação | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-012 | Negar todas as rotas a aluno, representante e não autenticado | Três credenciais × seis rotas; inclusive leitura | 403 para aluno/representante; 401 sem autenticação | ⏳ PENDENTE | Não executado. |
| CT-HU010-API-013 | Bloqueio por alocação futura, seleção e histórico | Sem alocação × passado × futuro; nova escala com inativo | 409 na futura; passado preservado; inativo fora da nova escala | ⏳ PENDENTE | Depende da HU-017 e de histórico; marcar 🚫 se ausentes. |

## Detalhamento dos casos

### CT-HU010-API-001 — Listar motoristas, consultar e buscar por nome

**Dados de entrada:** `GET /motoristas`, filtros `ativo=true/false`, `nome=francisco`, `nome=  FRANCISCO  ` e `nome=SEMRESULTADO`; `GET /motoristas/{id}` real e `999999` inexistente.

**Passos**

1. Conferir a lista vazia antes da massa. Preparar o inativo PC-04 e, após CT-002/003, repetir os filtros como administrador.
2. Combinar `ativo=false` com o nome do inativo e consultar os ids criados.
3. Buscar apenas os dígitos de um telefone no parâmetro `nome`, como conferência do contrato de busca.

**Resultado esperado**

- HTTP `200`; itens com `id`, `nome`, `telefone` e `ativo`. Administrador sem filtro pode receber ambos os status; a listagem inicial só de ativos é responsabilidade da UI (AC-01, AC-09).
- Busca parcial por nome sem diferenciar caixa e com espaços nas pontas removidos; resultado inexistente retorna `[]`. A busca funciona mesmo com nome cifrado no banco.
- Consulta por id real: `200`; inexistente: `404` “Motorista não encontrado.”. Busca pelo telefone em `nome` é caracterização: o requisito não obriga esse modo de pesquisa.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-002 — Cadastrar celular e telefone fixo válidos

**Dados de entrada:** POST JSON: `{"nome":"  Francisco Alves  ","telefone":"(88) 99811-2233"}`; depois `{"nome":"Antônio Lima","telefone":"8834125566"}`.

**Passos**

1. Enviar os dois cadastros e anotar ids e horários; designá-los M1 e M2.
2. Pedir à IA para conferir cada `GET /motoristas/{id}` e a linha correspondente no banco (PC-05).

**Resultado esperado**

- HTTP `201`, `success: true`, dados corretos e `ativo: true` (AC-02, AC-07, AC-10). O contrato atual responde “Motorista criado com sucesso.”.
- Nome sem espaços nas pontas; aceitar fixo de 10 dígitos e celular de 11. A máscara não muda a identidade do telefone.
- Motorista criado sem criar conta de usuário. AC-07 dá mensagem como exemplo, e o BDD exige confirmação sem texto exato: “criado” versus “alterado” não é, por si só, defeito.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-003 — Permitir homônimos e telefone presente apenas nos exemplos do app

**Dados de entrada:** POST `{"nome":"Francisco Alves","telefone":"88997004455"}` (M3); outro POST `{"nome":"Motorista Exemplo Legítimo","telefone":"88999999999"}` (M4), inexistente no banco.

**Passos**

1. Confirmar a ausência dos dois telefones no banco, independentemente dos exemplos locais do frontend.
2. Enviar os cadastros e pedir à IA para conferir ids distintos e telefones em `GET /motoristas` (PC-05).

**Resultado esperado**

- HTTP `201` nas duas criações; dois Francisco Alves com ids e telefones diferentes (AC-02).
- O número dos exemplos do frontend não é reservado por requisito; sua ausência no banco permite o cadastro.
- Este caso cria referências reais para confrontar o bloqueio indevido do app; não exigir nome único.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-004 — Bloquear telefone duplicado no cadastro e na edição

**Dados de entrada:** POST com telefone de M1 `(88) 99811-2233`, `88998112233` e espaços nas pontas; telefone do inativo PC-04 com/sem máscara. PATCH de M2 com `{"nome":"Nome que não deve salvar","telefone":"88998112233"}`.

**Passos**

1. Anotar nome e telefone de M2 antes da edição; enviar as criações duplicadas.
2. Enviar a edição combinada e repetir usando o telefone mascarado de M1.
3. Pedir à IA para conferir contagem, nome, telefone e hash de M2 na API/banco (PC-05).

**Resultado esperado**

- HTTP `409` “Este profissional já está registrado.”, comparando só os dígitos e incluindo registros inativos (AC-03, FA-002).
- M2 mantém também o nome anterior: uma colisão de telefone não pode salvar parcialmente a edição.
- Nenhum novo motorista, nenhum `500` e nenhum log de escrita bem-sucedida para as recusas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-005 — Exigir nome e telefone no cadastro e impedir esvaziamento

**Dados de entrada:** POST `{}`, só `nome`, só `telefone`, e cada campo `""`/`"   "`/`null`, com o outro válido. PATCH de M1 com `{"nome":""}`, `{"nome":"   "}`, `{"telefone":""}` e `{"telefone":"   "}`.

**Passos**

1. Enviar uma variação por vez. Usar telefone livre em toda tentativa de cadastro, caso algum inválido seja aceito.
2. Enviar os esvaziamentos de edição; pedir à IA para conferir que M1 mantém os dados e que não houve criação (PC-05).

**Resultado esperado**

- HTTP `422`, indicando o campo e motivo em português; obrigatório ausente/vazio não é aceito (AC-08, FA-003).
- Nenhum cadastro incompleto ou alteração do motorista. Omitir um campo em PATCH parcial mantém o valor; edição parcial válida está no CT-007.
- Não inventar exigência de CNH ou mínimo de tamanho de nome nesta suíte: as divergências desses pontos ficam registradas ao final.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-006 — Validar quantidade de dígitos e conteúdo do telefone

**Dados de entrada:** POST com nome `Telefone Inválido QA` e telefones separados: `123` (3), `998112233` (9), `889981122334` (12), `889981122334455` (15), `abcdefghijk` e `(88) abcdef`. Controles de 10/11 dígitos estão no CT-002/003. PATCH de M1: `123`, telefone de 15 dígitos e `(88) abcdef`.

**Passos**

1. Enviar as tentativas de cadastro e edição sem reaproveitar um inválido que já tenha sido aceito.
2. Anotar mensagem, campo e quantidade de dígitos da entrada, sem contar a máscara como dígito.
3. Pedir à IA para conferir ausência de criação/alteração no banco (PC-05).

**Resultado esperado**

- HTTP `422`, telefone identificado e mensagem com o sentido do AC-10; o texto atual exigido é “Informe um telefone válido com DDD”.
- Somente DDD + 8 ou 9 dígitos é válido; não aceitar qualquer texto apenas por conter um dígito ou ter 10 caracteres.
- O backend atual só exige ao menos um dígito: **falha esperada pela leitura do código**, ainda não reproduzida. O comentário do BDD sobre mensagem indefinida está desatualizado em relação ao requisito.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-007 — Editar parcialmente e preservar id e dados não enviados

**Dados de entrada:** PATCH de M1: `{"nome":"Francisco Alves QA"}`; depois `{"telefone":"(88) 99600-7788"}`; reenviar o próprio telefone como `88996007788`. PATCH de `999999` com nome válido.

**Passos**

1. Registrar id e dados anteriores, enviar cada edição e consultar o motorista.
2. Pedir à IA para conferir o registro e o hash do telefone após cada alteração e confirmar que M2 não mudou (PC-05).

**Resultado esperado**

- HTTP `200`, confirmação de sucesso e listagem atualizada (AC-04, AC-07). Campo omitido e id são preservados.
- Reenviar o próprio número com outra máscara é permitido; a verificação de unicidade ignora o motorista editado.
- Id inexistente: `404` “Motorista não encontrado.”. Não criar outro registro ao editar.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-008 — Inativar sem alocação futura e manter o registro

**Dados de entrada:** `PATCH /motoristas/{id de M1}/inativar`, com M1 ativo e sem alocações futuras; id `999999`.

**Passos**

1. Pedir à IA para conferir estado inicial, ausência de alocações e logs (PC-05).
2. Enviar a inativação de M1 e a do inexistente.
3. Conferir resposta, listagens e linha/log no banco. Se falhar, manter a evidência e não alterar o esperado para 503.

**Resultado esperado**

- Pelo AC-05/AC-07: `200`, mensagem de sucesso, `ativo: false`, registro mantido no banco e fora da lista de ativos.
- Inexistente: `404` “Motorista não encontrado.”; nenhuma alteração nem log de sucesso.
- O código atual retorna `503` “A inativação está indisponível até que a verificação de alocações futuras esteja disponível.” para motorista existente. Na execução, isso é **falha do fluxo sem alocação**, não aprovação do AC-06 nem simples bloqueio de ambiente. O preparo de inativo para outros casos não faz este caso passar.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-009 — Reativar inativo e repetir sem duplicar auditoria

**Dados de entrada:** `PATCH /motoristas/{id do inativo PC-04}/reativar`; repetir; `999999`. Conferência diagnóstica do caminho `/ativar` usado pelo frontend.

**Passos**

1. Anotar estado e logs do inativo preparado; enviar `/reativar` e conferir na API/banco com apoio da IA (PC-05).
2. Repetir e contar os logs novos; enviar a mesma rota para o id inexistente.
3. Consultar o resultado de `/ativar` com o mesmo id para documentar a diferença de contrato com a UI, sem exigir um alias não previsto.

**Resultado esperado**

- Reativação: `200`, mensagem de sucesso, mesmo id e dados com `ativo: true` (AC-05, AC-07).
- Repetição no contrato atual: `200` sem mudança e sem novo log. Não importar a regra de 409 da frota para motoristas.
- Inexistente: `404` “Motorista não encontrado.”. O backend declara `/reativar`; ausência de `/ativar` é incompatibilidade do frontend, não requisito de criar alias na API.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-010 — Auditar todas as escritas efetivas

**Dados de entrada:** Cadastro M1 (CT-002), edições (CT-007), inativação (CT-008) e reativação do inativo (CT-009); administrador A e horários.

**Passos**

1. Pedir à IA para consultar `log_auditoria` por `entidade='motorista'`, ids e intervalo de execução (PC-05).
2. Relacionar cada escrita efetiva ao log; distinguir preparo de massa de operação funcional.
3. Conferir ausência de log de sucesso em recusas e na reativação repetida.

**Resultado esperado**

- Cadastro, edição, inativação e reativação efetivas ficam registradas com usuário, ação e timestamp (AC-11, RNF-013).
- A reativação usa ação `REATIVAR` no código; não exigir que se chame `ATIVAR`.
- Cadastro/edição não inserem logs no código atual. Se a inativação retornar 503, registrar o fluxo falho e a auditoria dependente como não verificável, sem exigir log de sucesso de uma operação que não ocorreu.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-011 — Rejeitar campos fora do contrato e PATCH vazio

**Dados de entrada:** POST válido acrescido de `ativo=false` ou `campo_desconhecido`; PATCH `{}`, `{"ativo":false}`, `{"campo_desconhecido":"x"}` e `{"nome":null,"telefone":null}` em M1.

**Passos**

1. Enviar cada corpo separadamente; os dados base do POST devem ser válidos e usar telefone livre.
2. Pedir à IA para conferir que nenhum motorista foi criado/alterado nem teve status mudado (PC-05).

**Resultado esperado**

- HTTP `422` com erro compreensível: os DTOs usam `extra="forbid"` e o caso de uso exige ao menos um valor para atualizar.
- O PATCH não pode oferecer um caminho alternativo para mudar `ativo` ou contornar o bloqueio de alocações.
- Esses retornos caracterizam o contrato técnico atual; não criam campos obrigatórios novos de negócio.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-012 — Negar todas as rotas a aluno, representante e não autenticado

**Dados de entrada:** Aluno, representante e sem autenticação em GET de lista/detalhe, POST, PATCH de dados, PATCH `/inativar` e `/reativar`. Corpos válidos.

**Passos**

1. Enviar as seis operações com cada credencial; sem token, remover também cookies e parâmetros de autenticação.
2. Pedir à IA para conferir, como administrador, que não houve escrita nem log de sucesso (PC-05).

**Resultado esperado**

- HTTP `403` para aluno e representante; `401` sem autenticação, inclusive nas leituras (RN-006).
- Diferentemente dos cadastros públicos de bairros/faculdades/ônibus, `/motoristas` exige administrador em todas as rotas.
- Usar ids existentes e corpos válidos para isolar autorização; se login de representante falhar, bloquear só a respectiva variação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU010-API-013 — Bloqueio por alocação futura, seleção e histórico

**Dados de entrada:** Motorista A alocado amanhã; B com registros só do passado; C inativo. Endpoints reais da HU-017, sem inventar caminhos.

**Passos**

1. Conferir HU-017 e histórico na versão executada; registrar datas/fuso e preparar massa com apoio da IA (PC-05). Sem suporte, marcar apenas a parte dependente como 🚫.
2. Tentar inativar A e B e conferir os vínculos anteriores de B.
3. Consultar a seleção real da escalação e tentar criar vínculo diretamente com C pelo endpoint da versão.

**Resultado esperado**

- A: `409` “Este profissional possui alocações pendentes e não pode ser inativado no momento.”, mantendo ativo e sem log de inativação (AC-06, FA-001).
- B: passado não é alocação futura; a inativação preserva registro, vínculos e relatórios (AC-12, RN-004). Sem alocação é o controle do CT-008.
- C: ausente da seleção e novo vínculo recusado. O requisito não define o texto/status dessa recusa; registrar sem inventar mensagem.
- O 503 geral do código atual não prova aplicação do AC-06. Se impedir o preparo funcional, usar massa documentada e manter a falha da inativação registrada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem e busca | Visualiza ativos com nome/telefone; filtra pelo nome | CT-001 |
| AC-02 — cadastro e homônimos | Cadastra com sucesso; aceita fixo/celular; permite nomes iguais | CT-002, CT-003 |
| AC-03 / FA-002 — telefone único | Bloqueia telefone duplicado no cadastro e na edição | CT-004, CT-007 |
| AC-04 — edição | Edita os dados de motorista existente | CT-007 |
| AC-05 / RF-014 — soft delete e reativação | Inativa sem alocação; reativa; mantém registro no banco | CT-008, CT-009 |
| AC-05 — cancelar modal | Cancelamento mantém ativo | CT-HU010-UI-008; não há ação de cancelar na API |
| AC-06 / FA-001 — alocação futura | Bloqueia inativação com rota futura | CT-013 — depende da HU-017 |
| AC-07 — confirmação | Cenários de sucesso | CT-002, CT-003, CT-007, CT-008, CT-009 |
| AC-08 / FA-003 — obrigatórios | Cadastro sem obrigatório; edição esvaziando campo | CT-005 |
| AC-09 — inativos | Mostrar inativos e reativar | CT-001, CT-009; chave visual na UI |
| AC-10 — telefone e máscara | Aceita fixo/celular; bloqueia telefone incompleto | CT-002, CT-003, CT-006; máscara automática na UI |
| AC-11 / RNF-013 — auditoria | Log de cada escrita; cancelar não gera log | CT-010, CT-009; cancelamento em CT-HU010-UI-008 |
| AC-12 / RN-004 — escalação e histórico | Inativo fora da seleção; preserva vínculos passados | CT-013 — dependências explícitas |
| RN-006 — exclusividade administrativa | API nega gestão a outros perfis | CT-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-010, seção 7.3.4](../../../../../docs/requisitos.md), [BDD](../../../../../bdd/features/epico-02/HU-010.feature), [README do BDD](../../../../../bdd/features/epico-02/README.md) e [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185).
- **Riscos mapeados no código**:
  - Backend em `backend/src/modulos/motoristas/`: telefone só precisa conter um dígito; não valida DDD nem 10/11 dígitos (API CT-006; UI CT-006).
  - Inativação de motorista existente retorna 503 porque o caso de uso não fornece a confirmação real de alocações exigida pelo repository. O esperado continua sendo inativação válida sem alocação; a execução deve registrar essa falha. O cenário com alocação real depende da HU-017 (API CT-008/013; UI CT-009/013).
  - Cadastro/edição não gravam auditoria; reativação grava `REATIVAR`; repeti-la retorna 200 sem novo log (API CT-009/010).
  - Telefone é único por hash dos dígitos e índice único; nomes iguais são permitidos. Nome/telefone ficam cifrados; conferir valores pela API/ORM, sem esperar texto puro nas colunas. A busca de nome ocorre após descriptografia (API CT-001/004).
  - Frontend em `frontend/src/services/motoristaService.ts`: valida duplicidade contra exemplos antes da API; todos usam `(88) 9 9999-9999`. Também usa exemplos quando a chamada falha e pode fingir sucesso sem resposta (UI CT-003/012). Lista vazia recebida da API é respeitada, diferentemente do service de frota.
  - O app chama `/motoristas/{id}/ativar`; a API só declara `/reativar`. O erro da reativação só vai ao console (UI CT-010).
  - A chave Mostrar inativos começa ligada; a inativação do id 1 pode ser barrada pela alocação fictícia do exemplo, mesmo quando o id real não tem vínculo futuro (UI CT-001/009).
  - `motoristaSchema.ts` valida tamanho de caracteres, não quantidade de dígitos. `formatarTelefone.ts` só transforma entradas com 10/11 dígitos; nas demais devolve o texto original, permitindo investigar letras e números longos na UI (UI CT-006).
- Técnicas: **partição de equivalência** de telefones, perfis e obrigatórios; **valor-limite** em 9/10/11/12 dígitos, além de 3/15 para expor o backend; **transição de estado** e repetição de reativação; **tabela de decisão** sem alocação / somente passado / futuro. Prioridade em validação, persistência, autorização e auditoria.
- **Dúvidas/divergências para alinhamento**:
  - RF-009 exige número/categoria da CNH, mas ACs, BDD e código usam nome/telefone e não têm CNH. Os casos seguem o recorte da HU; a cobertura de CNH está **pendente de decisão**, não implementada nem aprovada por este planejamento.
  - O BDD ainda comenta FA-002 com CNH/CPF e mensagem de telefone sem definição; o requisito atual já define unicidade por telefone e “Informe um telefone válido com DDD”. Seguir o requisito e manter a divergência documental anotada.
  - API permite nome de 1 caractere e o frontend exige pelo menos 3; não há esse mínimo nos critérios. Confirmar o contrato antes de classificar nome curto apenas por essa diferença.
  - A issue #185 continua aberta, sem comentários na consulta de 24/10/2026. Aprovação das regras de telefone, duplicidade com inativos e seleção de inativos segue **pendente**, conforme orientação do responsável; os casos usam os requisitos atuais como referência provisória.
- A execução futura será na branch da própria implementação/correção, antes de ir para develop. Estes arquivos ficam na branch `test/casos-api-ui-epico-02`; nenhuma troca de branch ou execução foi feita neste planejamento.
- Todos os casos estão pendentes. “Falha esperada” significa risco confirmado por leitura estática, não defeito já reproduzido. Quando executar, marcar falhas e bloqueios por parte, sem transformar 503 ou massa preparada em aprovação de funcionalidade.
- Suíte complementar: [UI-HU-010.md](../ui/UI-HU-010.md). O cancelamento do modal é verificado na UI; não existe requisição funcional de cancelar na API.
