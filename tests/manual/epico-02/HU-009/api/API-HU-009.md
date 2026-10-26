# Testes manuais de API — HU-009 — Gerenciamento de Frota (Ônibus)

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Gestão de Cadastros Base (EP-002) |
| Funcionalidade | HU-009 — Gerenciamento de Frota (Ônibus) |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /onibus`, `GET /onibus/{placa}`, `POST /onibus`, `PATCH /onibus/{placa}`, `PATCH /onibus/{placa}/inativar` e `PATCH /onibus/{placa}/ativar` (alias `/reativar`). A URL usa a **placa**, não um id numérico. POST/PATCH de dados usam campos Form; enviar `multipart/form-data` com `placa`, `assentos`, `capacidade_em_pe` e, opcionalmente, `apelido` e `foto`. A rota também adapta JSON para Form. |
| Ambiente | Docker local isolado (execução inicial em `http://127.0.0.1:60909`; falhas reproduzidas em `http://localhost:8001`); branch `feature/testes-api-hu-009`; código `5e7301a0`; PostgreSQL 15 e migrations até 75; workaround de bootstrap documentado na issue existente #215 |
| Total de casos | 13 |
| Última execução | 2026-10-25  |
| Testador | Execução via terminal com apoio do Codex; validação de Cauan Ricardo pendente |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ❌ Executada com falhas e bloqueios | 13 | 5 | 7 | 0 | 1 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Ambiente exclusivo com banco inicialmente vazio. Inicialização padrão falhou na migration 69; evidência preservada e issue existente #215 vinculada. Para prosseguir, aplicada antecipação de faculdade.sigla apenas no banco descartável e depois migrations originais até 75. Ver evidências. |
| PC-02 | Token do **administrador A**, obtido em `POST /auth/login` com o administrador do seed. Anotar o id do executor e os horários das operações para conferir a auditoria. |
| PC-03 | Tokens de **aluno ativo** e **representante**. Se não for possível autenticar o representante, registrar o motivo e marcar apenas essa parte como 🚫; não substituir pelo token do administrador. |
| PC-04 | Leitura das tabelas onibus e log_auditoria. XYZ9K87 foi criado e colocado inativo pela própria API (PATCH de dados com ativo=false), registrando esse passo como preparo e não como aprovação da auditoria. Nenhuma inserção de massa por SQL. |
| PC-05 | **Apoio da IA (Codex nesta execução)** para executar as chamadas e conferir na API/banco os dados, o tipo efetivo de `log_auditoria.entidade_id` e os logs, com validação de Cauan Ricardo. Registrar as evidências sem tokens nem credenciais. |
| PC-06 | O CT-002 cria `QXD2E45`; o CT-003 cria `ABC1D23`, `DEF2G34` e `ABC1234`; o CT-008 troca `QXD2E45` por `QXD2E46`; o CT-009 usa `ABC1D23`. Nas variações de obrigatórios e números, usar uma placa válida **ainda inexistente por tentativa**, como `OBR1A01`, `OBR1A02` e `LIM1A01`, `LIM1A02`. Se um inválido for aceito, anotar a falha e usar outra placa na próxima tentativa para não mascarar a validação com um 409. |
| PC-07 | Para o CT-013, escalação de rotas das HU-016/017 e dados históricos disponíveis na versão testada. Identificar os endpoints reais em `/docs` e os relacionamentos no banco; não criar rotas fictícias. Sem a funcionalidade, marcar a parte dependente como 🚫 na execução. |

## Resumo da execução

Executar na ordem abaixo. São **13 casos essenciais**. Todas as chamadas usam o token do administrador A, exceto onde indicado. No CT-001, fazer a conferência vazia antes da massa PC-04 e repetir os filtros depois de prepará-la. Em casos com várias entradas, registrar cada resultado; uma variação que falhe não pode ser ocultada pelo resultado das demais.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU009-API-001 | Listar e consultar com filtros e diferentes perfis | Banco vazio; sem filtro; `ativo=true/false`; placa inexistente; sem token/aluno/representante | 200; administrador consulta ativos e inativos; demais recebem só ativos; 404 na consulta indisponível | ✅ PASSOU | 200 nos filtros; administrador vê os dois estados; demais só ativos; inativo/inexistente 404 conforme perfil. |
| CT-HU009-API-002 | Cadastrar ônibus válido e confirmar o contrato JSON/Form | `QXD2E45`, 44 assentos, 20 em pé; sem foto; `OCR1234` via JSON | 201; sucesso; ativo e persistido; foto opcional; JSON adaptado | ✅ PASSOU | 201 em Form e JSON; valores, ativo, apelido e ausência de foto persistidos. |
| CT-HU009-API-003 | Normalizar placas válidas | `abc1d23`, `DEF-2G34`, `ABC-1234` | 201; maiúsculas e sem hífen; formatos Mercosul e antigo aceitos | ❌ FALHOU | Hífen permanece no banco; consulta pela forma sem hífen retorna 404. Minúsculas/espaços normalizados. |
| CT-HU009-API-004 | Bloquear placa duplicada no cadastro e na edição | Placa ativa/inativa; variações de caixa, hífen e espaços; edição para placa em uso | 409 “Este veículo já está registrado.”; dados preservados | ❌ FALHOU | Placa com hífen aceita no POST (201) e PATCH (200), inclusive contra inativo; dados alterados indevidamente. |
| CT-HU009-API-005 | Exigir campos no cadastro e impedir esvaziamento na edição | Omitir cada obrigatório no POST; vazio/espaços no POST e PATCH | 422 com campo e motivo; não gravar; omitir campo no PATCH mantém o valor atual | ❌ FALHOU | Capacidade em pé omitida/vazia cria com zero (201); outros vazios recusados, mas há mensagens genéricas. |
| CT-HU009-API-006 | Rejeitar formato inválido de placa | Letras, números, tamanho incorreto, posição inválida e símbolo | 422 “Placa inválida.”; nada criado ou alterado | ❌ FALHOU | Sete placas inválidas criadas (201); edição inválida também aceita (200) e comprovada no banco. |
| CT-HU009-API-007 | Validar limites e tipo das capacidades | Assentos −1/0/1; em pé −1/0/1; texto e decimal; POST e PATCH | Assentos inteiro ≥ 1; em pé inteiro ≥ 0; inválidos 422; limites válidos persistidos | ❌ FALHOU | Zero assentos aceito em POST/PATCH; negativos/decimais/texto recusados, com mensagens divergentes do requisito. |
| CT-HU009-API-008 | Editar dados e a placa usada como chave | Edição parcial; `QXD2E45` → `QXD2E46`; `ZZZ9Z99` inexistente | 200; dados corretos na nova URL; antiga 404; inexistente 404 | ✅ PASSOU | 200 na edição e troca de chave; nova URL 200, antiga/inexistente 404; demais dados preservados. |
| CT-HU009-API-009 | Inativar e reativar sem apagar | `ABC1D23` sem alocação futura; repetir operações; placa inexistente | 200 nas transições; registro mantido; repetição 409 no contrato atual; inexistente 404 | ✅ PASSOU | 200 nas transições; 409 nas repetições; registro mantido. Coluna de auditoria efetiva é VARCHAR, sem 500. |
| CT-HU009-API-010 | Auditar todas as escritas | Cadastro, edição, inativação e reativação dos casos anteriores | Um log por escrita efetiva, com usuário, ação e timestamp | ❌ FALHOU | Sem logs de cadastro/edição; logs das ações próprias de inativar/ativar presentes com executor correto. |
| CT-HU009-API-011 | Impedir desvio das regras pelo campo `ativo` | `PATCH /onibus/{placa}` com `ativo=false/true` | Campo recusado/ignorado ou mudança sujeita às mesmas regras e auditoria | ❌ FALHOU | ativo=false/true muda o estado (200) sem gerar novos logs de auditoria. |
| CT-HU009-API-012 | Negar escrita a perfis sem privilégio | Aluno, representante e sem autenticação; rotas de escrita, inclusive foto | 403 para aluno/representante; 401 sem autenticação; nada gravado | ✅ PASSOU | 403 aluno/representante e 401 sem autenticação nas sete escritas, inclusive foto; banco sem efeitos. |
| CT-HU009-API-013 | Bloqueio por alocação futura, seleção e histórico | Ônibus com alocação futura; outro só com histórico; ônibus inativo | 409 e ativo na futura; sem bloqueio indevido no passado; inativo fora de nova escala; histórico intacto | 🚫 BLOQUEADO | HU-016/017 e contratos de alocação/histórico ausentes; não foi fabricada massa para simular dependência. |

## Detalhamento dos casos

### CT-HU009-API-001 — Listar e consultar com filtros e diferentes perfis

**Dados de entrada:** `GET /onibus`, `GET /onibus?ativo=true`, `GET /onibus?ativo=false` e `GET /onibus/{placa}`. Massa ativa `QXD2E45` (CT-002), inativa `XYZ9K87` (PC-04) e inexistente `ZZZ9Z99`.

**Passos**

1. Antes da massa, consultar a listagem vazia. Depois de PC-04 e CT-002, repetir a listagem com os três filtros como administrador.
2. Consultar `XYZ9K87` e `ZZZ9Z99` por placa como administrador.
3. Repetir os filtros e a consulta de `XYZ9K87` sem autenticação e com tokens de aluno e representante. No pedido sem autenticação, remover também cookies e parâmetros `token`/`access_token`.

**Resultado esperado**

- Listagem vazia: HTTP `200` e `[]`, sem dados inventados.
- Administrador: sem filtro, ativos e inativos; filtros `true`/`false` respeitados. Os itens informam placa, assentos, capacidade em pé e status (AC-01, AC-11). A tela é que deve começar mostrando só ativos.
- O DTO expõe `placa`, `assentos`, `capacidade_em_pe` e seus equivalentes `placa_onibus`, `qtd_assentos`, `capacidade_maxima`, com valores consistentes.
- Consulta da inativa pelo administrador: `200`; da inexistente: `404` “Ônibus não encontrado.”.
- Sem token, como aluno ou representante: lista só de ativos, mesmo solicitando `ativo=false`; consulta da inativa: `404`. As leituras públicas são o contrato atual, não autorização para gerenciar a frota.

**Resultado obtido**

- 200 nos filtros; administrador vê os dois estados; demais só ativos; inativo/inexistente 404 conforme perfil.
- Status: ✅ PASSOU.

---

### CT-HU009-API-002 — Cadastrar ônibus válido e confirmar o contrato JSON/Form

**Dados de entrada:** `POST /onibus`, Form: `placa=QXD2E45`, `assentos=44`, `capacidade_em_pe=20`, `apelido=  QA Frota  `, sem foto. Segunda criação com `Content-Type: application/json`: `{"placa":"OCR1234","assentos":42,"capacidade_em_pe":10}`.

**Passos**

1. Enviar o cadastro Form e registrar o retorno completo e o horário.
2. Pedir à IA para conferir `GET /onibus/QXD2E45` e a linha de `onibus` (PC-05).
3. Enviar a criação JSON e conferir `GET /onibus/OCR1234`.

**Resultado esperado**

- HTTP `201`, `success: true`, `message: "Operação realizada com sucesso"` e `data.ativo: true` (AC-02, AC-07).
- Placa e capacidades gravadas corretamente; `apelido` sem espaços nas pontas. Sem foto, o cadastro continua válido (`id_foto_onibus` vazio).
- JSON também aceito pelo adaptador `OnibusValidationRoute`. Não presumir incompatibilidade apenas porque a assinatura usa `Form`.
- Nenhuma alteração em outro ônibus. Upload e gestão completos de fotos ficam fora desta suíte essencial; a foto não é obrigatória nos critérios da HU.

**Resultado obtido**

- 201 em Form e JSON; valores, ativo, apelido e ausência de foto persistidos.
- Status: ✅ PASSOU.

---

### CT-HU009-API-003 — Normalizar placas válidas

**Dados de entrada:** três criações Form, com `assentos=44`, `capacidade_em_pe=0`: `placa=  abc1d23  `, `placa=DEF-2G34` e `placa=ABC-1234`, todas ainda inexistentes.

**Passos**

1. Enviar cada criação separadamente.
2. Pedir à IA para conferir a listagem, as consultas pelas placas normalizadas e os valores gravados em `onibus.placa_onibus` (PC-05).

**Resultado esperado**

- HTTP `201` com “Operação realizada com sucesso”; placas guardadas como `ABC1D23`, `DEF2G34` e `ABC1234` (AC-02, AC-03, AC-09).
- Aceitar Mercosul e formato antigo; remover hífen e espaços nas pontas e converter para maiúsculas.
- `capacidade_em_pe=0` é válida (AC-10). A placa com hífen não pode criar uma identidade diferente da versão sem hífen.

**Resultado obtido**

- Hífen permanece no banco; consulta pela forma sem hífen retorna 404. Minúsculas/espaços normalizados.
- Defeitos: [BUG-HU009-API-001](issues/BUG-HU009-API-001-placa-com-hifen-permite-duplicidade.md) ([#225](https://github.com/GOUOCE/GOUCE-app/issues/225)), [BUG-HU009-API-001](issues/BUG-HU009-API-001-placa-com-hifen-permite-duplicidade.md) ([#225](https://github.com/GOUOCE/GOUCE-app/issues/225))
- Status: ❌ FALHOU.

---

### CT-HU009-API-004 — Bloquear placa duplicada no cadastro e na edição

**Dados de entrada:** Form com capacidades válidas. No POST, tentar `QXD2E45`, `qxd2e45`, `QXD-2E45`, `  QXD2E45  ` e `XYZ9K87`/`xyz-9k87` (existente inativa). No PATCH de `QXD2E45`, tentar `placa=ABC1D23`, depois `placa=ABC-1D23`.

**Passos**

1. Registrar as placas e os dados existentes antes das tentativas.
2. Enviar cada tentativa separadamente, inclusive as duas de edição.
3. Pedir à IA para conferir a quantidade de registros e os valores na API/banco (PC-05).

**Resultado esperado**

- HTTP `409` “Este veículo já está registrado.” em todas as tentativas (AC-03, FA-002).
- A comparação considera ativos e inativos e ignora caixa, hífen e espaços nas pontas. A edição não pode usar a placa de outro ônibus.
- Nenhum ônibus criado, renomeado ou alterado; nenhum `500` por colisão de chave.
- A unicidade segue os requisitos atuais; a confirmação do time sobre incluir inativos ainda consta na issue #185.

**Resultado obtido**

- Placa com hífen aceita no POST (201) e PATCH (200), inclusive contra inativo; dados alterados indevidamente.
- Defeitos: [BUG-HU009-API-001](issues/BUG-HU009-API-001-placa-com-hifen-permite-duplicidade.md) ([#225](https://github.com/GOUOCE/GOUCE-app/issues/225)), [BUG-HU009-API-001](issues/BUG-HU009-API-001-placa-com-hifen-permite-duplicidade.md) ([#225](https://github.com/GOUOCE/GOUCE-app/issues/225))
- Status: ❌ FALHOU.

---

### CT-HU009-API-005 — Exigir campos no cadastro e impedir esvaziamento na edição

**Dados de entrada:** POST Form com uma placa `OBR1Axx` diferente por tentativa e demais campos válidos: omitir só `placa`, só `assentos` ou só `capacidade_em_pe`; enviar cada campo vazio; enviar `placa` só com espaços. No PATCH de `QXD2E45`, enviar explicitamente cada obrigatório vazio e a placa só com espaços. Controle: PATCH enviando apenas `apelido=QA Frota Editável`.

**Passos**

1. Enviar as omissões e os vazios no POST, alterando um campo por vez.
2. Anotar os dados de `QXD2E45` e enviar cada esvaziamento explícito no PATCH, também um por vez.
3. Enviar o controle de edição parcial, sem enviar os demais campos.
4. Pedir à IA para conferir na API/banco que as tentativas inválidas não criaram nem esvaziaram dados e que o controle preservou os campos omitidos (PC-05).

**Resultado esperado**

- Cadastro sem qualquer obrigatório: HTTP `422`, com indicação do campo e motivo em português; não substituir uma capacidade ausente por zero (AC-08, FA-003).
- Esvaziamento explícito na edição: bloqueado com `422`; dados anteriores mantidos. Registrar se o parser transformar vazio em ausência e devolver sucesso sem informar o problema.
- Omitir um campo no **PATCH parcial** mantém seu valor; não equivale a apagá-lo. O controle deve retornar `200`, alterando só o apelido.
- Não transformar diferenças entre Form vazio e campo omitido em uma regra nova: registrar o corpo realmente enviado e o retorno para alinhamento do contrato de edição.

**Resultado obtido**

- Capacidade em pé omitida/vazia cria com zero (201); outros vazios recusados, mas há mensagens genéricas.
- Defeitos: [BUG-HU009-API-002](issues/BUG-HU009-API-002-capacidade-em-pe-ausente-aceita.md) ([#226](https://github.com/GOUOCE/GOUCE-app/issues/226)), [BUG-HU009-API-002](issues/BUG-HU009-API-002-capacidade-em-pe-ausente-aceita.md) ([#226](https://github.com/GOUOCE/GOUCE-app/issues/226)), [BUG-HU009-API-005](issues/BUG-HU009-API-005-validacao-capacidades-mensagem-generica.md) ([#229](https://github.com/GOUOCE/GOUCE-app/issues/229)), [BUG-HU009-API-005](issues/BUG-HU009-API-005-validacao-capacidades-mensagem-generica.md) ([#229](https://github.com/GOUOCE/GOUCE-app/issues/229))
- Status: ❌ FALHOU.

---

### CT-HU009-API-006 — Rejeitar formato inválido de placa

**Dados de entrada:** POST Form com `assentos=44`, `capacidade_em_pe=20` e, separadamente, `ABCDEFG`, `1234567`, `AB1234`, `ABC12345`, `A1C1D23`, `ABC@1D2` e `GHI@3J45`. No PATCH de `QXD2E45`, repetir `AB1234` e `GHI@3J45` no campo `placa`.

**Passos**

1. Enviar as sete criações inválidas e as duas edições.
2. Pedir à IA para conferir os registros na API/banco depois de cada aceitação indevida e ao final (PC-05).

**Resultado esperado**

- HTTP `422` com “Placa inválida.”; rejeitar tamanhos, caracteres e posições que não correspondam a Mercosul ou formato antigo (AC-09).
- Nenhuma criação nem alteração; `QXD2E45` mantém a placa.
- O texto já está no requisito atual; o BDD ainda diz que a mensagem está indefinida. Seguir o requisito e registrar essa divergência documental, mantendo a pendência de aprovação da regra na issue #185.

**Resultado obtido**

- Sete placas inválidas criadas (201); edição inválida também aceita (200) e comprovada no banco.
- Defeitos: [BUG-HU009-API-003](issues/BUG-HU009-API-003-placas-fora-do-formato-aceitas.md) ([#227](https://github.com/GOUOCE/GOUCE-app/issues/227)), [BUG-HU009-API-003](issues/BUG-HU009-API-003-placas-fora-do-formato-aceitas.md) ([#227](https://github.com/GOUOCE/GOUCE-app/issues/227))
- Status: ❌ FALHOU.

---

### CT-HU009-API-007 — Validar limites e tipo das capacidades

**Dados de entrada:** Form, com placa nova `LIM1Axx` por criação. Alterar somente o campo da linha; usar `assentos=44` e `capacidade_em_pe=20` nos demais campos.

| Campo | Valores inválidos | Valores válidos de fronteira |
| --- | --- | --- |
| `assentos` | `-1`, `0`, `abc`, `4.5` | `1` |
| `capacidade_em_pe` | `-1`, `abc`, `2.5` | `0`, `1` |

**Passos**

1. Enviar as variações no POST, sempre com placa ainda inexistente.
2. No PATCH de `QXD2E45`, repetir `assentos=0`, `assentos=4.5`, `capacidade_em_pe=-1` e `capacidade_em_pe=2.5`.
3. Editar para `assentos=1`, `capacidade_em_pe=0`, conferir e depois restaurar `44`/`20`.
4. Pedir à IA para conferir a persistência e a ausência de alterações nas tentativas inválidas (PC-05).

**Resultado esperado**

- Inválidos: HTTP `422`, campo identificado e motivo em português; não truncar nem arredondar decimal (AC-10).
- Fronteiras válidas: `201` no cadastro ou `200` na edição e valores exatos no banco.
- A mensagem específica dos números não está definida; verificar o sentido e o campo, sem inventar texto obrigatório ou limite máximo de ocupação.

**Resultado obtido**

- Zero assentos aceito em POST/PATCH; negativos/decimais/texto recusados, com mensagens divergentes do requisito.
- Defeitos: [BUG-HU009-API-004](issues/BUG-HU009-API-004-onibus-com-zero-assentos.md) ([#228](https://github.com/GOUOCE/GOUCE-app/issues/228)), [BUG-HU009-API-004](issues/BUG-HU009-API-004-onibus-com-zero-assentos.md) ([#228](https://github.com/GOUOCE/GOUCE-app/issues/228)), [BUG-HU009-API-005](issues/BUG-HU009-API-005-validacao-capacidades-mensagem-generica.md) ([#229](https://github.com/GOUOCE/GOUCE-app/issues/229)), [BUG-HU009-API-005](issues/BUG-HU009-API-005-validacao-capacidades-mensagem-generica.md) ([#229](https://github.com/GOUOCE/GOUCE-app/issues/229))
- Status: ❌ FALHOU.

---

### CT-HU009-API-008 — Editar dados e a placa usada como chave

**Dados de entrada:** PATCH Form em `QXD2E45`: primeiro só `assentos=40`; depois `placa=QXD2E46`, `capacidade_em_pe=15`, `apelido=QA Frota Editada`. PATCH em `ZZZ9Z99` com `assentos=40`.

**Passos**

1. Anotar os dados de `QXD2E45` e de `ABC1D23` antes das edições.
2. Enviar a edição parcial e conferir os campos omitidos.
3. Enviar a mudança de placa usando a placa **atual na URL** e a nova no campo Form `placa`.
4. Consultar a nova e a antiga URL, a listagem e o outro ônibus; enviar a edição da placa inexistente.
5. Pedir à IA para conferir a linha no banco e se houve duplicação ou alteração do outro veículo (PC-05).

**Resultado esperado**

- Edições válidas: HTTP `200` e “Operação realizada com sucesso”; resultado final `QXD2E46`, 40 assentos e 15 em pé (AC-04, AC-07).
- Campos não enviados mantidos; a alteração da placa renomeia o cadastro, sem criar outro ônibus.
- Nova URL retorna `200`; antiga e placa inexistente, `404` “Ônibus não encontrado.”. `ABC1D23` não muda.
- Havendo vínculos históricos na versão testada, avaliar a mudança de chave junto ao CT-013: ela não pode apagar nem quebrar esses vínculos (RN-004).

**Resultado obtido**

- 200 na edição e troca de chave; nova URL 200, antiga/inexistente 404; demais dados preservados.
- Status: ✅ PASSOU.

---

### CT-HU009-API-009 — Inativar e reativar sem apagar

**Dados de entrada:** `ABC1D23` ativo, sem alocação futura; `XYZ9K87` inativo para isolar a reativação se necessário; `ZZZ9Z99` inexistente.

**Passos**

1. Anotar a linha e os logs de `ABC1D23`; enviar `PATCH /onibus/ABC1D23/inativar`.
2. Pedir à IA para conferir `GET /onibus?ativo=false`, a consulta pública e a linha no banco (PC-05).
3. Repetir a inativação; enviar `/ativar` e repetir a ativação.
4. Se a inativação falhar, preservar a evidência e testar a reativação separadamente com `XYZ9K87` preparado em PC-04. Esse preparo não faz a parte anterior passar.
5. Enviar `/inativar` e `/ativar` para `ZZZ9Z99`. Deixar ao menos um ônibus inativo para repetir o filtro do CT-001, usando massa identificada se necessário.

**Resultado esperado**

- Transições válidas: HTTP `200`, “Operação realizada com sucesso” e `data.ativo` correspondente (AC-05, AC-07).
- Inativação mantém a linha e os dados (soft delete); ônibus sai da consulta pública e aparece ao administrador entre inativos (AC-11, RF-014).
- No contrato atual, repetir a operação no mesmo estado retorna `409` (“Onibus já desativado.” / “Onibus já ativado.”), sem nova mudança nem log. As repetições são verificação de robustez; os critérios não definem mensagem própria para elas.
- Placa inexistente: `404` “Ônibus não encontrado.”.
- Nenhum `500`. Se ocorrer, pedir à IA para conferir o tipo **efetivo** de `log_auditoria.entidade_id`, o erro e se a transação manteve o estado anterior. O ORM é Integer, mas a migration `72_create_onibus_table.py` tenta convertê-lo para VARCHAR no PostgreSQL; o erro não está confirmado.

**Resultado obtido**

- 200 nas transições; 409 nas repetições; registro mantido. Coluna de auditoria efetiva é VARCHAR, sem 500.
- Status: ✅ PASSOU.

---

### CT-HU009-API-010 — Auditar todas as escritas

**Dados de entrada:** cadastro de `QXD2E45` no CT-002, edição para `QXD2E46` no CT-008 e transições de `ABC1D23` no CT-009; id do administrador A e horários anotados.

**Passos**

1. Pedir à IA para consultar `log_auditoria` por `entidade = 'onibus'` e intervalo de execução, ordenado por `criado_em` (PC-05). Identificar os veículos pelos dados de cada registro, respeitando o tipo real da coluna.
2. Associar cada escrita bem-sucedida ao log correspondente, inclusive a troca de placa, sem confundir massa preparada no banco com operação funcional.
3. Conferir se recusas por duplicidade, validação, placa inexistente e repetição de estado geraram logs de sucesso indevidos.

**Resultado esperado**

- Cada cadastro, edição, inativação e reativação efetiva tem um registro com usuário, ação e timestamp corretos (AC-12, RNF-013).
- A alteração da placa continua rastreável; nenhuma operação recusada gera log de sucesso.
- Identificar separadamente operações sem auditoria e operações que falharam antes de concluir; não contar operação bloqueada ou preparação de massa como auditoria aprovada.

**Resultado obtido**

- Sem logs de cadastro/edição; logs das ações próprias de inativar/ativar presentes com executor correto.
- Defeitos: [BUG-HU009-API-006](issues/BUG-HU009-API-006-escritas-de-onibus-sem-auditoria.md) ([#230](https://github.com/GOUOCE/GOUCE-app/issues/230)), [BUG-HU009-API-006](issues/BUG-HU009-API-006-escritas-de-onibus-sem-auditoria.md) ([#230](https://github.com/GOUOCE/GOUCE-app/issues/230))
- Status: ❌ FALHOU.

---

### CT-HU009-API-011 — Impedir desvio das regras pelo campo `ativo`

**Dados de entrada:** `PATCH /onibus/QXD2E46` Form com `ativo=false`; depois `ativo=true`.

**Passos**

1. Registrar o status e a auditoria anteriores.
2. Enviar cada mudança e pedir à IA para conferir a API/banco e os novos logs (PC-05).
3. Se o campo for aceito, incluir esse caminho na tentativa com alocação futura do CT-013 quando a dependência existir.

**Resultado esperado**

- A API pode recusar ou ignorar o campo preservando o status, ou permitir a transição sob as mesmas regras e auditoria das rotas próprias (AC-05, AC-06, AC-12).
- Mudar o status sem auditoria ou contornar o bloqueio de alocação futura é falha; devolver sucesso sem mudança deve ser anotado para avaliar a clareza do contrato.
- Nenhum registro apagado. Ao final, deixar `QXD2E46` ativo se a alteração for permitida.

**Resultado obtido**

- ativo=false/true muda o estado (200) sem gerar novos logs de auditoria.
- Defeitos: [BUG-HU009-API-006](issues/BUG-HU009-API-006-escritas-de-onibus-sem-auditoria.md) ([#230](https://github.com/GOUOCE/GOUCE-app/issues/230)), [BUG-HU009-API-006](issues/BUG-HU009-API-006-escritas-de-onibus-sem-auditoria.md) ([#230](https://github.com/GOUOCE/GOUCE-app/issues/230))
- Status: ❌ FALHOU.

---

### CT-HU009-API-012 — Negar escrita a perfis sem privilégio

**Dados de entrada:** três credenciais: aluno, representante e nenhuma autenticação. Para cada uma: POST Form válido com placa `NEG1A01`; PATCH de dados em `QXD2E46`; PATCH `/inativar`, `/ativar` e alias `/reativar`. Incluir `POST /onibus/QXD2E46/foto` com imagem válida e `DELETE /onibus/QXD2E46/foto`, pois também escrevem no cadastro.

**Passos**

1. Enviar todas as rotas com cada credencial, mantendo corpos válidos para não confundir autorização com validação.
2. Na variação sem autenticação, remover cabeçalho, cookies e parâmetros de token.
3. Pedir à IA para conferir, como administrador, que nenhum cadastro, status ou vínculo de foto mudou e nenhum arquivo foi gravado pelas tentativas (PC-05).

**Resultado esperado**

- HTTP `403` para aluno e representante, `401` sem autenticação (RN-006).
- Nenhuma escrita nem log de operação bem-sucedida. Leitura pública de ônibus ativos não concede gestão da frota.
- Se não houver login funcional de representante, registrar a parte como 🚫, sem considerar o caso inteiro aprovado.

**Resultado obtido**

- 403 aluno/representante e 401 sem autenticação nas sete escritas, inclusive foto; banco sem efeitos.
- Status: ✅ PASSOU.

---

### CT-HU009-API-013 — Bloqueio por alocação futura, seleção e histórico

**Dados de entrada:** ônibus A com alocação para amanhã; ônibus B com alocações/relatórios apenas de períodos anteriores; ônibus C inativo; todos identificados pela placa. Registrar datas, fuso e vínculos. Ônibus sem qualquer alocação já é coberto no CT-009.

**Passos**

1. Conferir a disponibilidade das HU-016/017 e dos registros históricos (PC-07). Sem suporte, marcar as partes dependentes como 🚫; exemplos locais do app não substituem alocações reais.
2. Pedir à IA para preparar e conferir as massas e registrar o estado anterior dos vínculos (PC-05).
3. Tentar inativar A pela rota própria e pelo PATCH com `ativo=false`, se esse campo for aceito.
4. Inativar B e conferir os vínculos/relatórios anteriores. Se possível, usar outro ônibus com histórico para trocar uma placa livre, conferindo também a preservação dos vínculos da edição.
5. Consultar a seleção de ônibus da escalação e tentar uma nova alocação usando diretamente a placa de C pelo endpoint real da versão.

**Resultado esperado**

- A: `409` com “Este veículo possui alocações pendentes e não pode ser inativado no momento.”; continua ativo e sem log de inativação bem-sucedida (AC-06, FA-001).
- B: histórico passado não causa bloqueio por alocação **futura**; inativação válida mantém o registro, vínculos e relatórios anteriores (AC-05, AC-13, RN-004). Trocar a placa também não pode apagar ou romper os vínculos existentes.
- C: não aparece como opção para nova escalação; uma tentativa direta de novo vínculo deve ser recusada, sem criar alocação (AC-13). O requisito não define texto/status dessa recusa: registrar o retorno sem inventar mensagem.
- Se uma transição falhar pelo problema de auditoria, registrar a falha e bloquear somente as verificações que dependam dela; não concluir que o bloqueio por alocação está correto por ter ocorrido um erro genérico.

**Resultado obtido**

- HU-016/017 e contratos de alocação/histórico ausentes; não foi fabricada massa para simular dependência.
- 🚫 HU-016/017 e contratos reais de rotas/alocacoes/relatorios ausentes no OpenAPI. Nao simulada alocacao nem criado historico ficticio; subverificacoes de bloqueio futuro, selecao e historico nao executadas.
- Status: 🚫 BLOQUEADO.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — listagem e capacidades | Administrador visualiza os ônibus ativos com seus limites de ocupação | CT-001; filtro inicial da tela na suíte UI |
| AC-02 — cadastro válido | Administrador cadastra um novo ônibus com sucesso | CT-002, CT-003 |
| AC-03 / FA-002 — normalização e duplicidade | Aceita placa em minúsculas ou com hífen; bloqueia cadastro e edição com placa existente | CT-003, CT-004 |
| AC-04 — edição | Administrador edita os dados de um ônibus existente | CT-008 |
| AC-05 / RF-014 — inativar, reativar e soft delete | Inativa sem alocações futuras; reativa; mantém registro no banco | CT-009, CT-011 |
| AC-06 / FA-001 — alocação futura | Bloqueia a inativação de ônibus escalado para rotas em dias futuros | CT-013, CT-011 — dependem das HU-016/017 |
| AC-07 — confirmação | Cenários de cadastro, edição, inativação e reativação | CT-002, CT-003, CT-008, CT-009 |
| AC-08 / FA-003 — obrigatórios | Bloqueia cadastro com obrigatório ausente; edição com obrigatório esvaziado | CT-005 |
| AC-09 — formato de placa | Bloqueia o salvamento com placa em formato inválido | CT-006, CT-003 |
| AC-10 — quantidades inteiras e limites | Bloqueia o salvamento com quantidade inválida | CT-007 |
| AC-11 — inativos identificados | Visualiza ônibus inativos ao ativar Mostrar inativos | CT-001, CT-009; chave visual na suíte UI |
| AC-12 / RNF-013 — auditoria | Registra no log cada operação de escrita sobre ônibus | CT-010, CT-011 |
| AC-13 / RN-004 — nova escalação e histórico | Inativo fora da escalação; inativação preserva históricos vinculados | CT-013 — dependências explícitas |
| RN-006 — exclusividade administrativa | API nega a gestão da frota a outros perfis | CT-012 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-003, CT-004 | Frota guarda placa com hífen e permite duplicar o mesmo veículo | [#225](https://github.com/GOUOCE/GOUCE-app/issues/225) |
| CT-005 | Cadastro de ônibus aceita capacidade em pé ausente ou vazia e grava zero | [#226](https://github.com/GOUOCE/GOUCE-app/issues/226) |
| CT-006 | API da frota aceita placas fora dos formatos Mercosul e antigo | [#227](https://github.com/GOUOCE/GOUCE-app/issues/227) |
| CT-007 | API da frota permite cadastrar e editar ônibus com zero assentos | [#228](https://github.com/GOUOCE/GOUCE-app/issues/228) |
| CT-005, CT-007 | Validação da frota devolve “Valor inválido.” sem informar o motivo | [#229](https://github.com/GOUOCE/GOUCE-app/issues/229) |
| CT-010, CT-011 | Cadastro, edição e PATCH de status de ônibus não registram auditoria | [#230](https://github.com/GOUOCE/GOUCE-app/issues/230) |
| PC-01 | Banco vazio não inicia: migration 69 usa sigla antes da criação | [#215](https://github.com/GOUOCE/GOUCE-app/issues/215) |

## Observações gerais

- Referências: [HU-009, seção 7.3.3](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-02/HU-009.feature), [README do BDD](../../../../../bdd/features/epico-02/README.md), [suíte de UI](../ui/UI-HU-009.md) e [issue #185](https://github.com/GOUOCE/GOUCE-app/issues/185).
- Técnicas: **partição de equivalência** de placas e perfis (CT-003, 004, 006, 012); **valor-limite** das capacidades (CT-007); **transição de estado** ativo → inativo → ativo e repetições (CT-009, 011); **tabela de decisão** sem alocação / só passado / futuro (CT-009 e 013). Priorizados integridade, bloqueios, autorização e auditoria; não são testes de carga ou uma suíte exaustiva de uploads.
- **Riscos mapeados no código** em `backend/src/modulos/crud_basicos/`:
  - DTO, service e repository aplicam `strip().upper()` à placa, sem remover hífen nem validar formato: risco de cadastro inválido e duplicidade não detectada (CT-003, 004, 006).
  - Form/DTO permitem `assentos >= 0`, e o POST usa `capacidade_em_pe=0` por padrão: divergências dos AC-10 e AC-08 (CT-005, 007).
  - Cadastro e edição não inserem log de auditoria; só ativar/inativar o fazem. O PATCH de dados aceita `ativo`, alterando o status sem o log das rotas próprias (CT-010, 011).
  - **Hipótese, não erro confirmado:** ativar/inativar usam a placa em `entidade_id`; `audit_model.py` declara Integer. A migration `72_create_onibus_table.py` tenta converter a coluna para VARCHAR(80) em PostgreSQL e captura exceções; é necessário conferir o schema efetivo e o resultado da operação na execução (CT-009, 010).
  - Não há consulta de alocações futuras nas transições; depende das HU-016/017 (CT-013). A presença de `409` por estado repetido não demonstra o bloqueio por alocação.
  - A placa é chave primária e pode ser editada; a preservação de futuros relacionamentos precisa ser conferida quando os módulos dependentes estiverem disponíveis (CT-008, 013).
  - **Correção da hipótese inicial:** a assinatura HTTP usa Form, mas `OnibusValidationRoute` converte JSON em Form. Não registrar falha de integração JSON/Form sem execução e evidência (CT-002).
- **Dúvidas/divergências para alinhamento:**
  - O requisito já define “Placa inválida.” no AC-09, enquanto o comentário do BDD diz que o texto não está definido. O README do BDD ainda menciona FA-002 só para ativos, mas o requisito atual já diz ativo ou inativo. Seguir o requisito; alinhar os comentários.
  - A issue #185 foi encerrada; as decisões de produto agora estão na [#207](https://github.com/GOUOCE/GOUCE-app/issues/207), aberta e sem respostas na consulta desta execução. Regras de formato, limites e inativos continuam provisórias conforme indicado nela.
  - O requisito no commit testado já define mensagens de capacidades no AC-10. O texto planejado de “Resultado esperado” foi preservado; a comparação adicional usa a versão atual do requisito e está discriminada na issue de mensagens (#229).
- Os status desta suíte foram atualizados pela execução de API. Bloqueios correspondem às dependências/decisões discriminadas; falhas exigem reteste após correção. Os casos de UI não foram executados.

### Registro desta execução

- **Reteste dos defeitos (2026-10-25):** as falhas foram reproduzidas por Cauan Ricardo (com apoio do Claude Code) em stack Docker isolada, `http://localhost:8001`, commit `5e7301a0`; a requisição, a resposta e a conferência no banco de cada uma estão na issue correspondente. Massa criada pela API; o banco só foi consultado para conferir resultados. Em banco vazio a migration 69 falha ([#215](https://github.com/GOUOCE/GOUCE-app/issues/215)); para subir o ambiente foi usada uma cópia temporária da migration 68 com a coluna `sigla`, sem alterar o repositório.
- Resultados esperados originais preservados. Decisões de produto ainda pendentes não foram aprovadas por este teste; as divergências são relatadas contra o documento publicado.
