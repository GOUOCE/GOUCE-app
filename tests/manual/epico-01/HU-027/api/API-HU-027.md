# Testes manuais de API — HU-027 — Avaliação de Solicitação de Cadastro

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta (EP-001) |
| Funcionalidade | HU-027 — Avaliação de Solicitação de Cadastro |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /usuarios/alunos?status=&ordem=` (fila), `GET /alunos/{id}` (detalhes), `GET /arquivos/{id}/view` (documento), `PATCH /usuarios/alunos/{id}/aprovar` e `PATCH /usuarios/alunos/{id}/status` — `application/json`. Corpo da reprovação: `{"status_cadastro": "rejeitado", "motivo_reprovacao": "...", "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": "..."}]}` |
| Ambiente | Branch `feature/testes-api-hu-027-hu-031` — Docker local isolado (projeto `atu-api`), `http://localhost:8001`, Mailpit em `http://localhost:58025`, `develop` no commit `4bf26d55`, com o contorno das migrations descrito nas [observações](#observações-gerais) |
| Ambiente do reteste | Branch `fix/issues-hu027-313-317` ([PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327)), a partir da `develop` `e68f88e7` — Docker local isolado (projeto `hu027fix`), `http://localhost:8001`, Mailpit em `http://localhost:58025`, banco novo e **sem** contorno de migrations (a `develop` agora tem uma head só) |
| Total de casos | 10 |
| Última execução | 27/10/2026 (execução) · 28/10/2026 (reteste dos defeitos) |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Execução | Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 27/10/2026 — execução | ❌ Reprovada | 10 | 5 | 5 | 0 | 0 | 0 |
| 28/10/2026 — reteste ([PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327)) | ✅ Aprovada | 10 | 10 | 0 | 0 | 0 | 0 |

Histórico: na execução de 27/10 falharam os CT-004, 006, 007, 008 e 009. No reteste de 28/10, depois das correções, os cinco passaram (o registro de cada falha continua nas colunas e seções de 27/10). Os CT-001 e CT-002 não foram reexecutados, porque o PR não altera a fila nem os detalhes, e valem os ✅ de 27/10. Detalhes por caso na coluna **Reteste (28/10)** e nas seções abaixo.

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e banco em **stack isolada com banco limpo**, com o **Mailpit** ligado para conferir os e-mails (ver [README](README.md)). Usar Postman, Insomnia ou Swagger em `/docs`. |
| PC-02 | Token do **administrador A** (executor): `POST /auth/login` com o administrador padrão do seed. Anotar o `id` dele para conferir a auditoria. |
| PC-03 | Massa de alunos criada pela IA pelo fluxo real de cadastro (`POST /usuarios/cadastro`), **nesta ordem e com alguns segundos entre um e outro**: **A1**, **A2**, **A3** e **A4**, todos `pendente`. Anotar os ids e a `data_hora_envio_analise` de cada um. Os nomes não seguem a ordem alfabética do envio (ex.: A1 “Zuleide”, A2 “Bruno”, A3 “Marta”, A4 “Ana”), para expor a ordenação por nome. |
| PC-04 | Um aluno **aprovado e ativo** (AP) e um **representante ativo**, para os CT-007 e CT-009. Um aluno em **renovação** (`analise_renovacao`) é opcional, só para o CT-001. |
| PC-05 | Acesso de leitura ao banco: tabelas `aluno`, `usuario`, `arquivos` e `log_auditoria`. |

## Resumo da execução

Executar na ordem abaixo. São **10 casos essenciais**. Todas as chamadas usam o token do administrador A, exceto onde indicado.

| ID | Cenário | Dados de entrada | Resultado esperado | Status (27/10) | Observações (27/10) | Reteste (28/10) |
| --- | --- | --- | --- | --- | --- | --- |
| CT-HU027-API-001 | Fila de solicitações pendentes | `status=pendente` com e sem `ordem=asc`; `status=xyz` | Só pendentes, do envio mais antigo para o mais recente; status inválido recusado | ✅ PASSOU | Fila só com pendentes, do envio mais antigo para o mais recente, com e sem `ordem`; `xyz` dá 400. | ➖ Não reexecutado (o PR não altera a fila); vale o ✅ de 27/10. |
| CT-HU027-API-002 | Dados e documentos do aluno | `GET /alunos/{A1}`; `GET /arquivos/{id}/view` dos comprovantes; id inexistente | Dados pessoais e acadêmicos completos; documentos abrem; 404 | ✅ PASSOU | Dados completos, os dois PDFs abrem, 404 para inexistente; sem senha nem token. | ➖ Não reexecutado (o PR não altera os detalhes); vale o ✅ de 27/10. |
| CT-HU027-API-003 | Aprovar solicitação | `PATCH /usuarios/alunos/{A1}/aprovar` | HTTP 200; status `ativado`; sai da fila; aluno consegue logar | ✅ PASSOU | 200; A1 `ativado`, fora da fila, login OK e validade de 6 meses. | ➖ A aprovação (HTTP 200, `ativado`) foi reexecutada como passo do CT-004; login e validade não; vale o ✅ de 27/10. |
| CT-HU027-API-004 | Notificar o aluno da aprovação | Caixa do A1 no Mailpit depois do CT-003 | E-mail informando a liberação do acesso | ❌ FALHOU | Nenhum e-mail ao A1; o SMTP funciona (o e-mail da reprovação chegou). [BUG-HU027-API-001](issues/BUG-HU027-API-001-aprovacao-nao-notifica-o-aluno.md) · [#313](https://github.com/GOUOCE/GOUCE-app/issues/313) | ✅ PASSOU — o A1 recebe o e-mail “Cadastro aprovado - GOUCE” por `/aprovar` e o AP por `/status`. Correção do [PR #326](https://github.com/GOUOCE/GOUCE-app/pull/326), já na `develop`. [#313](https://github.com/GOUOCE/GOUCE-app/issues/313) fechada. |
| CT-HU027-API-005 | Reprovar com motivo por documento | A2: matrícula e residência com motivos diferentes | HTTP 200; status `rejeitado`; motivos gravados; sai da fila; e-mail com cada motivo | ✅ PASSOU | 200; motivos por documento gravados; A2 fora da fila; e-mail com cada motivo. | ✅ PASSOU — reexecutado como controle: 200 e e-mail com cada motivo; sem regressão. |
| CT-HU027-API-006 | Motivo obrigatório na reprovação | Sem motivo; motivo em branco; tipo inválido; 256 caracteres | Recusado com mensagem clara; status do aluno não muda | ❌ FALHOU | Bloqueia os 6 itens planejados, mas aceita documento com motivo só de espaços e o descarta; 3 recusas em inglês. [BUG-002](issues/BUG-HU027-API-002-reprovacao-aceita-documento-com-motivo-em-branco.md) · [#314](https://github.com/GOUOCE/GOUCE-app/issues/314), [BUG-005](issues/BUG-HU027-API-005-mensagens-de-validacao-em-ingles.md) · [#317](https://github.com/GOUOCE/GOUCE-app/issues/317) | ✅ PASSOU — os 7 itens dão `422` em português, por campo e no formato `success/error/details`; o item 3c deixou de passar; A3 e A4 seguem `pendente`. [#314](https://github.com/GOUOCE/GOUCE-app/issues/314) e [#317](https://github.com/GOUOCE/GOUCE-app/issues/317) fechadas. |
| CT-HU027-API-007 | Avaliar quem não está na fila | Aprovar/reprovar aluno já ativo, já rejeitado e inexistente; repetir a aprovação | Recusado (fora da fila) ou 404; nada alterado | ❌ FALHOU | Aprovou e reprovou o AP ativo, aprovou o A2 rejeitado e renovou a validade do A1. [BUG-HU027-API-003](issues/BUG-HU027-API-003-avaliacao-aceita-aluno-fora-da-fila.md) · [#315](https://github.com/GOUOCE/GOUCE-app/issues/315) | ✅ PASSOU — aluno ativo, rejeitado e aprovação repetida dão `409` com a situação do aluno; status, validade e e-mails intactos; inexistente dá `404`. [#315](https://github.com/GOUOCE/GOUCE-app/issues/315) fechada. |
| CT-HU027-API-008 | Reprovação deixa o aluno conseguir corrigir | A3 reprovado só com `motivo_reprovacao`, sem documentos | Recusado, ou o aluno recebe ao menos um documento para reenviar | ❌ FALHOU | Sem documento é recusado (422), mas pelo atalho do CT-006 o A3 fica rejeitado sem nada para reenviar. [BUG-HU027-API-002](issues/BUG-HU027-API-002-reprovacao-aceita-documento-com-motivo-em-branco.md) · [#314](https://github.com/GOUOCE/GOUCE-app/issues/314) | ✅ PASSOU — só com motivo geral e com documento em branco dão `422`; com um documento válido dá `200` e o A3 vê o documento para reenviar. [#314](https://github.com/GOUOCE/GOUCE-app/issues/314) fechada. |
| CT-HU027-API-009 | Auditoria da avaliação | Operações dos CT-003, 005 e 007 | Um registro por avaliação, com o administrador, status anterior e novo | ❌ FALHOU | Os 13 registros gravam o id do aluno como usuário e o status anterior igual ao novo. [BUG-HU027-API-004](issues/BUG-HU027-API-004-auditoria-grava-o-aluno-e-o-status-errado.md) · [#316](https://github.com/GOUOCE/GOUCE-app/issues/316) | ✅ PASSOU — 4 registros, todos com o administrador (id 1) em `usuario_id` e `pendente` como status anterior. [#316](https://github.com/GOUOCE/GOUCE-app/issues/316) fechada. |
| CT-HU027-API-010 | Acesso sem privilégio | Token de aluno, de representante e sem token | 403 (aluno e representante) e 401 (sem token); nada alterado | ✅ PASSOU | 403 para aluno e representante, 401 sem token; documento de outro aluno dá 404; A4 segue pendente. | ✅ PASSOU nas duas rotas alteradas: sem token `401`, aluno `403`, A4 segue `pendente`. Representante e documento de outro aluno não reexecutados. |

## Detalhamento dos casos

### CT-HU027-API-001 — Fila de solicitações pendentes

**Dados de entrada:** `GET /usuarios/alunos?status=pendente`; `GET /usuarios/alunos?status=pendente&ordem=asc`; `GET /usuarios/alunos?status=xyz`; `GET /usuarios/alunos` sem filtro.

**Passos**

1. Depois da PC-03, enviar as chamadas acima.
2. Comparar a ordem da lista com a `data_hora_envio_analise` anotada.
3. Repetir depois do CT-005 para confirmar que A1 e A2 saíram da fila.

**Resultado esperado**

- Só alunos `pendente`, cada um com `id`, `nome`, `email`, faculdade e `data_hora_envio_analise` (AC-02).
- Ordem do **pedido mais antigo para o mais recente**: A1, A2, A3, A4 (AC-02).
- Registrar a ordem obtida **sem** o parâmetro `ordem`. O app ordena a lista sozinho; se a API devolver por nome (A4, A2, A3, A1), anotar como observação, sem reprovar o caso.
- `status=xyz`: HTTP `400` com a lista de status aceitos.
- Sem filtro, a resposta traz também alunos aprovados e rejeitados: anotar, porque a fila depende do filtro.

**Resultado obtido**

- Evidência: [`CT-HU027-API-001.json`](evidencias/CT-HU027-API-001.json). Massa criada pelo fluxo real (`POST /usuarios/cadastrar`): A1 = id 2 (Zuleide), A2 = 3 (Bruno), A3 = 4 (Marta), A4 = 5 (Ana), enviados entre 17:47:39 e 17:48:01 UTC ([preparação](evidencias/00-preparacao-massa.json)).
- `status=pendente` com e sem `ordem=asc`: HTTP `200`, só os quatro pendentes, na ordem 2, 3, 4, 5 (do envio mais antigo para o mais recente). Cada item traz `id`, `nome`, `email`, faculdade, `campus` e `data_hora_envio_analise`.
- `status=xyz`: HTTP `400` “Status inválido. Informe um dos valores: analise_renovacao, ativado, inativado, pendente, rejeitado”.
- Sem filtro: devolve também os aprovados (ids 6 e 7), como esperado.
- Depois dos CT-003 e CT-005, A1 e A2 saíram da fila (passo 2 das evidências desses casos).
- Observação: sem `ordem`, o repository ordena por `nome_completo`, que está **criptografado** (Fernet). O texto cifrado começa com a hora da criptografia, por isso a ordem bateu com a do envio. É coincidência, não uma regra: o app não deve depender dela (ele ordena a lista sozinho).
- Status: ✅ Passou.

---

### CT-HU027-API-002 — Dados e documentos do aluno

**Dados de entrada:** `GET /alunos/{A1}`; `GET /arquivos/{id_comprovante_matricula}/view` e `GET /arquivos/{id_comprovante_residencia}/view` com os ids devolvidos; `GET /alunos/999999`.

**Passos**

1. Consultar os detalhes do A1.
2. Abrir cada documento pelo id devolvido.
3. Consultar o id inexistente.

**Resultado esperado**

- HTTP `200` com os dados pessoais (nome, e-mail, telefone, data de nascimento, bairro) e acadêmicos (faculdade, curso, turno, período de ingresso) informados no cadastro (AC-03).
- Ids dos dois comprovantes e da foto presentes; cada `/view` devolve o arquivo (PDF ou imagem) com HTTP `200` (AC-03, RNF-016).
- Senha, hash e tokens **não** aparecem na resposta.
- Id inexistente: HTTP `404` “Aluno não encontrado”.

**Resultado obtido**

- Evidência: [`CT-HU027-API-002.json`](evidencias/CT-HU027-API-002.json).
- `GET /alunos/2`: HTTP `200` com nome, e-mail, telefone, data de nascimento, bairro (`Centro`), faculdade (`Universidade Federal do Ceará`, `UFC`, `Campus Quixadá`), curso, semestre, turno, período de ingresso e os ids dos dois comprovantes e da foto. Nenhum campo de senha, hash ou token.
- `/arquivos/{id}/view` dos dois comprovantes: HTTP `200`, `application/pdf`, conteúdo `%PDF-1.4` (o arquivo enviado).
- `GET /alunos/999999`: HTTP `404` “Aluno não encontrado”.
- Observações: `data_nascimento` vem como número (`20020510`), não como data; o bairro vem só pelo nome, sem `bairro_id`. Isso afeta a tela (ver UI-HU-027, CT-002).
- Status: ✅ Passou.

---

### CT-HU027-API-003 — Aprovar solicitação

**Dados de entrada:** `PATCH /usuarios/alunos/{A1}/aprovar`, sem corpo.

**Passos**

1. Enviar a aprovação.
2. Repetir a fila do CT-001.
3. Fazer `POST /auth/login` com o A1.
4. Pedir à IA para conferir `status_cadastro` e `validade_acesso` do A1 no banco.

**Resultado esperado**

- HTTP `200` com `status_cadastro` `ativado` e uma mensagem de sucesso. Registrar o texto (o requisito define “Solicitação avaliada com sucesso” para a tela, AC-08).
- A1 **não aparece** mais na fila (AC-04).
- O login do A1 funciona e devolve `status_cadastro` `ativado`.
- `validade_acesso` preenchida (RN-013: 6 meses a partir da aprovação).

**Resultado obtido**

- Evidência: [`CT-HU027-API-003.json`](evidencias/CT-HU027-API-003.json).
- `PATCH /usuarios/alunos/2/aprovar`: HTTP `200` `{"status_cadastro": "ativado", "mensagem": "Cadastro do aluno aprovado com sucesso!"}`. O texto do AC-08 (“Solicitação avaliada com sucesso”) é da tela; anotado para a UI.
- Fila depois: ids 3, 4, 5 (A1 saiu).
- Login do A1: HTTP `200` com `status_cadastro` `ativado`.
- Banco: `validade_acesso` = `2027-04-27 17:49:18+00`, 6 meses depois da aprovação (RN-013).
- Status: ✅ Passou.

---

### CT-HU027-API-004 — Notificar o aluno da aprovação

**Dados de entrada:** caixa de entrada do e-mail do A1 no Mailpit (`http://localhost:8025`).

**Passos**

1. Depois do CT-003, abrir o Mailpit e procurar mensagens para o A1.

**Resultado esperado**

- Um e-mail (ou push) informando que o cadastro foi aprovado e o acesso liberado (AC-04).
- Se não houver nenhum e-mail, registrar como falha. A rota de aprovação **não chama** o serviço de e-mail no código atual.

**Resultado obtido (27/10/2026)**

- Evidência: [`CT-HU027-API-004.json`](evidencias/CT-HU027-API-004.json). A caixa do Mailpit foi limpa logo antes da aprovação do CT-003.
- Mailpit depois da aprovação: `{"total": 0, "mensagens": []}`. Nenhum e-mail para o A1.
- Controle: na mesma stack, a reprovação do A2 (CT-005) chegou ao Mailpit. O SMTP funciona; a rota de aprovação é que não chama o serviço de e-mail.
- Defeito: [BUG-HU027-API-001](issues/BUG-HU027-API-001-aprovacao-nao-notifica-o-aluno.md).
- Status: ❌ Falhou.

**Reteste (28/10/2026)**

- Evidência: [`reteste-2026-10-28-resultado.txt`](evidencias/reteste-2026-10-28-resultado.txt). Caixa do Mailpit limpa antes da aprovação; banco novo; branch do [PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327).
- `PATCH /usuarios/alunos/2/aprovar`: HTTP `200` `ativado`. No Mailpit chega **um** e-mail “Cadastro aprovado - GOUCE” para o A1 (“Cadastro aprovado! Olá Zuleide Ramos Costa, Seu cadastro no GOUCE foi aprovado! …”).
- `PATCH /usuarios/alunos/6/status` com `ativado` (AP): HTTP `200` e o mesmo e-mail para o AP.
- O envio vem da correção do [PR #326](https://github.com/GOUOCE/GOUCE-app/pull/326), que já estava na `develop`; o [PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327) acrescenta os testes que travam o comportamento, inclusive o de que a falha de envio vira log e não desfaz a aprovação.
- Status: ✅ Passou. Issue [#313](https://github.com/GOUOCE/GOUCE-app/issues/313) fechada.

---

### CT-HU027-API-005 — Reprovar com motivo por documento

**Dados de entrada:** `PATCH /usuarios/alunos/{A2}/status` com `{"status_cadastro": "rejeitado", "motivo_reprovacao": "Documentos precisam ser reenviados.", "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": "Comprovante de matrícula desatualizado."}, {"tipo": "comprovante_residencia", "motivo": "Comprovante com mais de 3 meses."}]}`.

**Passos**

1. Enviar a reprovação.
2. Repetir a fila do CT-001.
3. Abrir o e-mail do A2 no Mailpit.
4. Pedir à IA para conferir `status_cadastro`, `motivo_reprovacao` e `documentos_reenvio` do A2 no banco.

**Resultado esperado**

- HTTP `200` com `status_cadastro` `rejeitado` e os dois documentos com **os seus próprios motivos** (AC-07).
- A2 sai da fila de pendentes (AC-08).
- E-mail ao A2 listando cada documento com o motivo informado (AC-07).
- Os comprovantes antigos continuam guardados até o reenvio.

**Resultado obtido (27/10/2026)**

- Evidência: [`CT-HU027-API-005.json`](evidencias/CT-HU027-API-005.json).
- `PATCH /usuarios/alunos/3/status`: HTTP `200`, `status_cadastro` `rejeitado`, `mensagem` “Documentos rejeitados e marcados para reenvio.” e os dois documentos com **os seus próprios motivos**.
- Fila depois: ids 4 e 5 (A2 saiu).
- E-mail ao A2 (“Documentos pendentes para reenvio - GOUCE”): lista “Comprovante Matricula: Comprovante de matrícula desatualizado.” e “Comprovante Residencia: Comprovante com mais de 3 meses.”.
- Banco: `motivo_reprovacao`, `documentos_reenvio` gravados; os ids dos comprovantes continuam os antigos.
- Observação: o e-mail não traz o motivo geral, e os nomes dos documentos saem sem acento (“Matricula”, “Residencia”).
- Status: ✅ Passou.

**Reteste (28/10/2026)**

- Reexecutado como controle: `PATCH /usuarios/alunos/3/status` com dois documentos, HTTP `200` `rejeitado`; o e-mail “Documentos pendentes para reenvio - GOUCE” chega ao A2. Sem regressão.
- Status: ✅ Passou.

---

### CT-HU027-API-006 — Motivo obrigatório na reprovação

**Dados de entrada:** em A3, `status_cadastro` `rejeitado` com:

1. Sem `motivo_reprovacao` e sem `documentos_reenvio`.
2. `motivo_reprovacao` `"   "` e sem documentos.
3. Documento com `motivo` `""`; documento com `motivo` `"   "`.
4. Documento com `tipo` `rg`.
5. `motivo_reprovacao` com 256 caracteres.

**Passos**

1. Enviar cada chamada.
2. Pedir à IA para conferir que o A3 continua `pendente` depois de cada uma.

**Resultado esperado**

- Todas recusadas (HTTP `400` ou `422`) com mensagem em português indicando o campo (AC-06, RN-012).
- Motivo só com espaços conta como **vazio** (AC-06).
- O A3 continua `pendente` e na fila; nenhum e-mail enviado.
- Registrar o código e o texto de cada recusa.

**Resultado obtido (27/10/2026)**

- Evidência: [`CT-HU027-API-006.json`](evidencias/CT-HU027-API-006.json). A3 = id 4.
- Itens 1, 2 e 3b (sem motivo, motivo geral `"   "`, documento com motivo `"   "` sem motivo geral): HTTP `422` “Value error, motivo_reprovacao é obrigatório quando status_cadastro é rejeitado.”.
- Item 3a (motivo do documento `""`): HTTP `422` “String should have at least 1 character”.
- Item 4 (`tipo` `rg`): HTTP `422` “Input should be 'comprovante_matricula', 'comprovante_residencia' or 'foto_perfil'”.
- Item 5 (256 caracteres): HTTP `422` “String should have at most 255 characters”.
- Em todos esses, o A3 continuou `pendente`, sem motivo nem documentos.
- **Item 3c**, motivo geral válido e documento com motivo `"   "` (alvo A4, id 5): HTTP `200`, `rejeitado`, `documentos_reenvio: null`. O documento foi descartado sem aviso e o aluno ficou sem nada para reenviar (consequência no CT-008). A4 voltou para `pendente` pela API depois (PREP-11).
- Três das recusas estão em inglês e duas começam com “Value error,”.
- Defeitos: [BUG-HU027-API-002](issues/BUG-HU027-API-002-reprovacao-aceita-documento-com-motivo-em-branco.md) (item 3c) e [BUG-HU027-API-005](issues/BUG-HU027-API-005-mensagens-de-validacao-em-ingles.md) (mensagens).
- Status: ❌ Falhou.

**Reteste (28/10/2026)**

- Evidência: [`reteste-2026-10-28-resultado.txt`](evidencias/reteste-2026-10-28-resultado.txt).
- Os 7 itens (sem motivo; motivo geral `"   "`; documento com motivo `""`; documento com `"   "` sem motivo geral; **documento com `"   "` e motivo geral válido (item 3c)**; `tipo` `rg`; 256 caracteres): HTTP `422` no formato `{"success": false, "error": {"code": "REQUEST_VALIDATION_ERROR", "message": "Requisição inválida", "details": [{"field", "message"}]}}`, com o campo indicado e o texto em português, sem o prefixo “Value error,”:
  - sem motivo e sem documentos, ou motivo geral só com espaços: “Informe o motivo da reprovação.” e “Informe ao menos um documento para o aluno reenviar, com o motivo.”;
  - documento com motivo vazio ou só com espaços: “Informe o motivo do documento.”;
  - tipo inválido: “Tipo de documento inválido. Use comprovante_matricula, comprovante_residencia ou foto_perfil.”;
  - 256 caracteres: “O motivo da reprovação deve ter no máximo 255 caracteres.”
- O item 3c, que antes dava `200` e descartava o documento, agora dá `422`. O A3 e o A4 continuaram `pendente`.
- Status: ✅ Passou. Issues [#314](https://github.com/GOUOCE/GOUCE-app/issues/314) e [#317](https://github.com/GOUOCE/GOUCE-app/issues/317) fechadas.

---

### CT-HU027-API-007 — Avaliar quem não está na fila

**Dados de entrada:**

1. `PATCH .../{AP}/aprovar` e reprovação do AP (aluno já ativo).
2. `PATCH .../{A2}/aprovar` (A2 rejeitado, sem ter reenviado nada).
3. `PATCH .../{A1}/aprovar` de novo (repetição do CT-003).
4. `PATCH .../999999/aprovar`.

**Passos**

1. Anotar `status_cadastro` e `validade_acesso` de AP, A1 e A2 antes.
2. Enviar cada chamada e conferir de novo.

**Resultado esperado**

- A avaliação vale só para solicitações **na fila** (AC-02, AC-04): itens 1 a 3 recusados (HTTP `409` ou `400`) com mensagem clara, sem alterar status nem validade.
- O AP não é reprovado por engano; o A2 não é aprovado sem reenviar os documentos.
- Item 4: HTTP `404` “Aluno não encontrado”.
- Se a API aceitar algum item, registrar qual campo mudou (por exemplo, a `validade_acesso` do A1 renovada de novo).

**Resultado obtido (27/10/2026)**

- Evidência: [`CT-HU027-API-007.json`](evidencias/CT-HU027-API-007.json).
- Item 1: aprovar o AP já ativo deu HTTP `200`; reprovar o AP deu HTTP `200` e o deixou **rejeitado**.
- Item 2: aprovar o A2 rejeitado, sem reenvio, deu HTTP `200` e o deixou `ativado`.
- Item 3: aprovar o A1 de novo deu HTTP `200` e renovou a `validade_acesso` (de `17:49:18` para `17:50:44`).
- Item 4: HTTP `404` “Aluno não encontrado”.
- Massa restaurada pela API depois (AP aprovado de novo e A2 reprovado de novo; PREP-12 e PREP-13).
- Defeito: [BUG-HU027-API-003](issues/BUG-HU027-API-003-avaliacao-aceita-aluno-fora-da-fila.md).
- Status: ❌ Falhou.

**Reteste (28/10/2026)**

- Evidência: [`reteste-2026-10-28-resultado.txt`](evidencias/reteste-2026-10-28-resultado.txt).
- Item 1: aprovar e reprovar o AP já ativo: HTTP `409` “Este aluno já está com o cadastro aprovado. Só é possível aprovar ou reprovar cadastros na fila de solicitações.”.
- Item 2: aprovar o A2 rejeitado, sem reenvio: HTTP `409` “Este aluno está com o cadastro rejeitado, aguardando o reenvio dos documentos. Só é possível aprovar ou reprovar cadastros na fila de solicitações.”.
- Item 3: aprovar o A1 de novo, por `/aprovar` e por `/status`: HTTP `409`.
- Item 4: HTTP `404` “Aluno não encontrado”.
- Conferido no banco: status e `validade_acesso` de AP, A1 e A2 intactos; nenhum e-mail enviado nas recusas; o total de registros em `log_auditoria` não mudou com as recusas.
- Status: ✅ Passou. Issue [#315](https://github.com/GOUOCE/GOUCE-app/issues/315) fechada.

---

### CT-HU027-API-008 — Reprovação deixa o aluno conseguir corrigir

**Dados de entrada:** `PATCH /usuarios/alunos/{A3}/status` com `{"status_cadastro": "rejeitado", "motivo_reprovacao": "Cadastro com dados inconsistentes."}`, sem `documentos_reenvio`.

**Passos**

1. Enviar a reprovação.
2. Logar com o A3 e consultar `GET /usuarios/reenvio_documento`.
3. Tentar reenviar qualquer documento em `PUT /usuarios/reenvio_documento`.

**Resultado esperado**

- RN-012: depois da reprovação, o aluno precisa conseguir corrigir e reenviar. Uma de duas saídas é aceita:
  - a API **recusa** a reprovação sem documento indicado; ou
  - o aluno consegue reenviar ao menos um documento.
- Se a reprovação for aceita e o aluno não conseguir reenviar nada (“Este documento não foi solicitado...”), registrar como falha: o aluno fica preso como rejeitado.

**Resultado obtido (27/10/2026)**

- Evidência: [`CT-HU027-API-008.json`](evidencias/CT-HU027-API-008.json).
- Reprovação do A3 só com `motivo_reprovacao`: HTTP `422` “Value error, documentos_reenvio é obrigatório quando status_cadastro é rejeitado.”. O caminho direto está protegido.
- Pelo atalho do CT-006 (item 3c), com documento de motivo `"   "`: HTTP `200`, A3 `rejeitado` com `documentos_reenvio` vazio.
- O A3 loga (`rejeitado`), `GET /usuarios/reenvio_documento` devolve `{"documentos": []}` e cada reenvio (matrícula, residência, foto) dá HTTP `400` “Este documento não foi solicitado pelo administrador: …”. O aluno fica preso como rejeitado (RN-012).
- Defeito: [BUG-HU027-API-002](issues/BUG-HU027-API-002-reprovacao-aceita-documento-com-motivo-em-branco.md).
- Status: ❌ Falhou.

**Reteste (28/10/2026)**

- Evidência: [`reteste-2026-10-28-resultado.txt`](evidencias/reteste-2026-10-28-resultado.txt).
- Reprovação do A3 só com `motivo_reprovacao`: HTTP `422`, campo `documentos_reenvio`, “Informe ao menos um documento para o aluno reenviar, com o motivo.”.
- Atalho do item 3c do CT-006 (documento com motivo `"   "`) no A4: HTTP `422`; o A4 continua `pendente`.
- Reprovação do A3 com **um** documento válido (`comprovante_matricula`, “Ilegível.”): HTTP `200` `rejeitado`; o A3 loga e `GET /usuarios/reenvio_documento` devolve HTTP `200` com esse documento. O aluno deixa de ficar sem nada para reenviar.
- O reenvio em si (`PUT /usuarios/reenvio_documento`) não foi reexecutado; ele é coberto pela HU-031.
- Status: ✅ Passou. Issue [#314](https://github.com/GOUOCE/GOUCE-app/issues/314) fechada.

---

### CT-HU027-API-009 — Auditoria da avaliação

**Dados de entrada:** aprovações e reprovações feitas nos CT-003, 005 e 008; recusas dos CT-006 e 007.

**Passos**

1. Pedir à IA para consultar `log_auditoria` com `entidade = 'aluno'`.

**Resultado esperado**

- Um registro por avaliação efetiva, com `usuario_id` do **administrador A**, a ação, o id do aluno, o status **anterior** e o **novo**, e a data/hora (RNF-013).
- Nenhum registro para as recusas.
- Riscos no código: o registro grava o `id` do **aluno** como usuário e lê o status anterior depois de já trocá-lo (anterior igual ao novo).

**Resultado obtido (27/10/2026)**

- Evidência: [`CT-HU027-API-009.json`](evidencias/CT-HU027-API-009.json).
- `log_auditoria` (`entidade = 'aluno'`): 13 registros com a ação `UPDATE_STATUS`, um por avaliação aceita; nenhum para as recusas.
- Em todos, `usuario_id` é o **id do próprio aluno** (ex.: registro 4 da aprovação do A1 com `usuario_id` 2), e não o do administrador A (id 1).
- Em todos, `valor_anterior` é igual a `valor_novo` (ex.: aprovação do A1: `ativado | ativado`, quando o anterior era `pendente`).
- Defeito: [BUG-HU027-API-004](issues/BUG-HU027-API-004-auditoria-grava-o-aluno-e-o-status-errado.md).
- Status: ❌ Falhou.

**Reteste (28/10/2026)**

- Evidência: [`reteste-2026-10-28-resultado.txt`](evidencias/reteste-2026-10-28-resultado.txt).
- `log_auditoria` (`entidade = 'aluno'`) depois de duas aprovações (A1 e AP) e duas reprovações (A2 e A3): 4 registros `UPDATE_STATUS`, todos com o **administrador** (id 1) em `usuario_id`, o id do aluno em `entidade_id`, `pendente` em `valor_anterior` e o status novo em `valor_novo`:

```text
id | usuario_id | acao          | aluno | anterior | novo
2  | 1          | UPDATE_STATUS | 2     | pendente | ativado
3  | 1          | UPDATE_STATUS | 6     | pendente | ativado
4  | 1          | UPDATE_STATUS | 3     | pendente | rejeitado
5  | 1          | UPDATE_STATUS | 4     | pendente | rejeitado
```

- As recusas do CT-007 e do CT-006 não geraram registro.
- Status: ✅ Passou. Issue [#316](https://github.com/GOUOCE/GOUCE-app/issues/316) fechada.

---

### CT-HU027-API-010 — Acesso sem privilégio

**Dados de entrada:** as cinco rotas da suíte com o token do AP, com o token do representante e sem o cabeçalho `Authorization`. Alvo: A4.

**Passos**

1. Enviar cada chamada com cada credencial.
2. Com o token do AP, tentar `GET /arquivos/{id}/view` de um comprovante do A4.
3. Pedir à IA para conferir que o A4 continua `pendente`.

**Resultado esperado**

- Aluno e representante: HTTP `403` em todas as rotas de administrador (AC-01, RN-006).
- O AP não abre o documento de outro aluno (HTTP `404` ou `403`).
- Sem token: HTTP `401`.
- O A4 continua `pendente`.

**Resultado obtido (27/10/2026)**

- Evidência: [`CT-HU027-API-010.json`](evidencias/CT-HU027-API-010.json). Representante criada pela API (aluna 7 aprovada e promovida em `POST /representantes/promover`; perfis `aluno` e `supervisor`).
- AP e representante: HTTP `403` na fila, nos detalhes, na aprovação e na reprovação.
- Comprovante do A4 com o token do AP ou da representante: HTTP `404` “Arquivo não encontrado”.
- Sem token: HTTP `401` em todas.
- O A4 continuou `pendente`.
- Status: ✅ Passou.

**Reteste (28/10/2026)**

- Conferido de novo só nas duas rotas que o PR alterou (`PATCH /usuarios/alunos/5/aprovar` e `/status`): sem token, HTTP `401`; com o token do A1 (aluno ativo), HTTP `403` “Acesso negado”; o A4 continuou `pendente`. A fila (`GET /usuarios/alunos?status=pendente`) com o administrador segue HTTP `200`.
- Não reexecutados: token de representante e abrir o documento de outro aluno.
- Status: ✅ Passou.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 / RN-006 — acesso só do administrador | Acesso restrito ao perfil Administrador | CT-010 |
| AC-02 — fila do mais antigo para o mais recente | Fila ordenada do pedido mais antigo | CT-001 |
| AC-03 — dados e documentos | Visualiza os dados e documentos | CT-002 |
| AC-04 — aprovar, sair da fila e notificar | Aprova uma solicitação | CT-003, CT-004 |
| AC-05 / AC-06 — motivo obrigatório | Bloqueia a reprovação sem motivo | CT-006 |
| AC-07 — reprovar, guardar motivo e notificar | Reprova informando o motivo | CT-005 |
| AC-08 — fila recarregada | Aprova; reprova | CT-001, CT-003, CT-005 (a mensagem fica na UI) |
| RN-012 — aluno consegue corrigir | — | CT-008 |
| RNF-013 — auditoria | — | CT-009 |
| RNF-016 — documentos fora do banco | — | CT-002 |

## Defeitos encontrados

| Caso | Defeito | Issue | Situação (28/10) |
| --- | --- | --- | --- |
| Ambiente | A `develop` não sobe em banco vazio: duas heads de migration | [BUG-HU027-API-006](issues/BUG-HU027-API-006-develop-nao-sobe-em-banco-vazio-duas-heads.md) · [#318](https://github.com/GOUOCE/GOUCE-app/issues/318) | Issue ainda aberta. Na `develop` `e68f88e7` o banco novo subiu sem o contorno (uma head só, migration 78). |
| CT-HU027-API-004 | A aprovação não envia e-mail ao aluno | [BUG-HU027-API-001](issues/BUG-HU027-API-001-aprovacao-nao-notifica-o-aluno.md) · [#313](https://github.com/GOUOCE/GOUCE-app/issues/313) | ✅ Corrigido ([PR #326](https://github.com/GOUOCE/GOUCE-app/pull/326)) e retestado no CT-004; issue fechada. |
| CT-HU027-API-006, 008 | Reprovação aceita documento com motivo em branco e deixa o aluno sem nada para reenviar | [BUG-HU027-API-002](issues/BUG-HU027-API-002-reprovacao-aceita-documento-com-motivo-em-branco.md) · [#314](https://github.com/GOUOCE/GOUCE-app/issues/314) | ✅ Corrigido no [PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327) e retestado nos CT-006 e CT-008; issue fechada. |
| CT-HU027-API-007 | Avaliação aceita aluno que não está na fila | [BUG-HU027-API-003](issues/BUG-HU027-API-003-avaliacao-aceita-aluno-fora-da-fila.md) · [#315](https://github.com/GOUOCE/GOUCE-app/issues/315) | ✅ Corrigido no [PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327) e retestado no CT-007; issue fechada. |
| CT-HU027-API-009 | Auditoria grava o aluno como usuário e o status anterior igual ao novo | [BUG-HU027-API-004](issues/BUG-HU027-API-004-auditoria-grava-o-aluno-e-o-status-errado.md) · [#316](https://github.com/GOUOCE/GOUCE-app/issues/316) | ✅ Corrigido no [PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327) e retestado no CT-009; issue fechada. |
| CT-HU027-API-006 | Mensagens de validação da reprovação em inglês | [BUG-HU027-API-005](issues/BUG-HU027-API-005-mensagens-de-validacao-em-ingles.md) · [#317](https://github.com/GOUOCE/GOUCE-app/issues/317) | ✅ Corrigido no [PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327) e retestado no CT-006; issue fechada. |

## Observações gerais

- Referências: [HU-027, seção 7.2.7](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-027.feature), [suíte de UI](../ui/UI-HU-027.md) e a [HU-031](../../HU-031/api/API-HU-031.md), que testa o lado do aluno (consulta e reenvio).
- **Riscos mapeados no código** (backend em `backend/src/modulos/usuarios/`, `develop` `939921e3`), que orientaram a escolha dos casos:
  - a fila só sai ordenada por data com `ordem=asc`; sem o parâmetro, vem por **nome** (CT-001);
  - a aprovação **não envia e-mail** ao aluno; só a reprovação envia (CT-004);
  - `AprovarAlunoUseCase` não confere o status atual: aprova ou reprova aluno já ativo, rejeitado ou inativado, e cada aprovação renova a validade (CT-007);
  - `motivo_reprovacao` só com espaços passa na checagem, e a reprovação só com o motivo geral é aceita sem documentos, o que deixa o aluno sem nada para reenviar (CT-006, CT-008);
  - a auditoria grava o `id` do aluno como usuário e o status anterior igual ao novo (CT-009);
  - o e-mail de reprovação monta o HTML com o motivo sem escapar caracteres; um motivo com `<b>` aparece formatado (anotar no CT-005, se notado).
- Renovações de vínculo (`analise_renovacao`) entram na mesma fila do app, mas são testadas na HU-028.
- **Ambiente da execução (27/10/2026):** banco novo na stack isolada `atu-api`. A `develop` (`4bf26d55`) não sobe em banco vazio porque tem duas heads de migration (`76_ponto_unico_por_bairro` e `77_create_rota_complementar`): ver [evidência](evidencias/00-ambiente-migrations.json) e [BUG-HU027-API-006](issues/BUG-HU027-API-006-develop-nao-sobe-em-banco-vazio-duas-heads.md). Contorno usado só na stack: cópia das migrations com uma migration de merge vazia. O banco novo também não tem faculdade: a UFC foi criada pela API (PREP-01).
- **Resultado da leitura de código × execução:** confirmados os riscos da aprovação sem e-mail, da avaliação sem conferir o status e da auditoria. Não se confirmou que a reprovação aceite motivo geral em branco nem sem documentos (o DTO recusa os dois); o defeito real é o motivo do documento em branco, descartado sem aviso.
- Estado final (27/10): A1 (2) `ativado`, A2 (3) `rejeitado`, A3 (4) `rejeitado` sem documentos (CT-008), A4 (5) `pendente`, AP (6) `ativado` e representante (7) ativa, sem apagar registros.
- **Reteste dos defeitos (28/10/2026):** as issues [#313](https://github.com/GOUOCE/GOUCE-app/issues/313) a [#317](https://github.com/GOUOCE/GOUCE-app/issues/317) foram corrigidas pelo [PR #327](https://github.com/GOUOCE/GOUCE-app/pull/327) (branch `fix/issues-hu027-313-317`, a partir da `develop` `e68f88e7`; a #313 já vinha do [PR #326](https://github.com/GOUOCE/GOUCE-app/pull/326)) e retestadas em stack isolada nova (`hu027fix`, API em `http://localhost:8001`, Mailpit em `:58025`), banco novo e sem contorno de migrations. Os passos dos CT-004 a CT-009 foram refeitos com massa criada pelo fluxo real de cadastro (A1 = 2, A2 = 3, A3 = 4, A4 = 5, AP = 6): **25 de 25 verificações OK**. Os mesmos passos contra o `backend/src` da `develop` sem o PR dão 9 OK e **16 falhas**, o que confirma que o roteiro enxerga os defeitos (a #313 já passava lá). Evidências: [`reteste-2026-10-28-resultado.txt`](evidencias/reteste-2026-10-28-resultado.txt) e [`reteste-2026-10-28-develop-sem-o-pr.txt`](evidencias/reteste-2026-10-28-develop-sem-o-pr.txt). O backend inteiro também passou nos testes automatizados (873 testes, 24 novos em `backend/tests/test_avaliacao_cadastro_aluno.py`). As cinco issues foram comentadas com o resultado e fechadas.
- Estado final do reteste: A1 (2) `ativado`, A2 (3) `rejeitado`, A3 (4) `rejeitado` com o documento `comprovante_matricula` para reenviar, A4 (5) `pendente` e AP (6) `ativado`. Representante não criado nesta stack.
- Ocultar senhas, tokens e dados pessoais nas evidências.
