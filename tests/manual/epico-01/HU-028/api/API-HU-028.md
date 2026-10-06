# Testes manuais de API — HU-028 — Renovação de Vínculo Institucional

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-028 — Renovação de Vínculo Institucional |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `PUT /alunos/renovar-vinculo` — `multipart/form-data`, com token de aluno; apoio: `POST /auth/login`, `GET /usuarios/me` e `GET /usuarios/alunos?status=` (administrador) |
| Ambiente | Docker local isolado — `http://localhost:8001` — branch `feature/testes-api-hu-028` — commit `a0a08b5f` |
| Total de casos | 8 |
| Última execução | 2026-10-06 — execução dos CT-HU028-API-001 a 008 |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| ❌ Reprovada | 8 | 3 | 3 | 2 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API, banco e armazenamento de arquivos (MinIO) disponíveis. Usar Postman ou Insomnia (o envio é `multipart/form-data`); o Swagger em `/docs` também aceita arquivos. |
| PC-02 | **Aluno A** com cadastro **aprovado** (`ativado`) e token válido. Anotar os dados atuais dele (`GET /usuarios/me`), que serão reenviados na renovação. |
| PC-03 | **Aluno V** com **vínculo vencido**: cadastro aprovado e `validade_acesso` no passado. Em ambiente local, preparar pelo banco (`UPDATE aluno SET validade_acesso = now() - interval '1 day' WHERE aluno_id = <id>`), registrando a preparação. |
| PC-04 | Arquivos de teste: `comprovante.pdf` (~2 MB), `comprovante.docx` (~2 MB) e `comprovante-grande.pdf` (~8 MB). Usar documentos fictícios. |
| PC-05 | Corpo base da renovação (campos de formulário obrigatórios): `nome`, `raca`, `identificacao_sexual`, `identificacao_genero`, `transgenero`, `tem_filhos`, `telefone`, `bairro_id`, `faculdade_id`, `curso`, `campus`, `periodo_ingresso`, `turno_curso`, `semestre_atual` — com os valores atuais do aluno — e o arquivo `comprovante_matricula`. Os casos só alteram o que indicam. |
| PC-06 | Token de um **administrador** para conferir a fila de análise (CT-001) e de um aluno **rejeitado** para o CT-005, se existir. |

## Resumo da execução

Executar na ordem abaixo. São **8 casos essenciais**. O CT-001 muda o status do aluno A para `analise_renovacao`; os casos 002 e 003 usam um aluno aprovado que ainda não renovou (o aluno A antes do CT-001, ou outro).

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU028-API-001 | Renovação válida | Corpo base + `comprovante.pdf` (2 MB) | HTTP 200; status `analise_renovacao`; aluno na fila do administrador | ✅ APROVADO | HTTP 200 com `status_cadastro: "analise_renovacao"`; `GET /usuarios/me` mostrou o novo status e um novo comprovante; o aluno apareceu em `GET /usuarios/alunos?status=analise_renovacao`. |
| CT-HU028-API-002 | Renovação sem comprovante | Corpo base sem `comprovante_matricula` | HTTP 422 indicando o comprovante obrigatório; status inalterado | ⚠️ PARCIAL | HTTP 422 `REQUEST_VALIDATION_ERROR` no campo `comprovante_matricula` e status inalterado, mas a mensagem veio em inglês: `Field required`. |
| CT-HU028-API-003 | Arquivo inválido | `comprovante.docx`; `comprovante-grande.pdf` (8 MB) | HTTP 422 “Formato inválido” e “Arquivo excede o limite de tamanho” | ❌ FALHOU | DOCX: HTTP 422 com “Formato de arquivo inválido…”, conforme esperado. PDF de 8 MB: **HTTP 200**, renovação aceita e status alterado; a API só recusa acima de 10 MB. |
| CT-HU028-API-004 | Aluno com vínculo vencido consegue renovar | Login do aluno V; renovação válida | Login permitido para renovar (AC-01); renovação aceita | ❌ FALHOU | O login do aluno com vínculo vencido foi recusado: HTTP 401 “A validade de acesso da sua conta expirou.” O aluno não consegue chegar à renovação. |
| CT-HU028-API-005 | Acesso sem permissão | Sem token; token de administrador; aluno rejeitado | HTTP 401; 403; 403 | ✅ APROVADO | Sem token: HTTP 401; token de administrador: HTTP 403; aluno rejeitado: HTTP 403. Nenhum dado alterado. |
| CT-HU028-API-006 | Efeitos do status “Em análise” | Aluno A após o CT-001 | Login permitido; carteirinha bloqueada (403) | ✅ APROVADO | Login do aluno em análise: HTTP 200; carteirinha: HTTP 403 “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” |
| CT-HU028-API-007 | Nova renovação estando em análise | Aluno A após o CT-001; corpo base + PDF | Bloquear (ex.: HTTP 409) sem substituir o comprovante em análise | ❌ FALHOU | A segunda renovação foi aceita (HTTP 200) e substituiu o comprovante que estava em análise. |
| CT-HU028-API-008 | Dados inválidos no corpo | `telefone` `8599`; `semestre_atual` `0`; `nome` vazio | HTTP 422 com o campo e o motivo em português; status inalterado | ⚠️ PARCIAL | As três tentativas foram recusadas com HTTP 422 e status inalterado. Telefone e semestre com mensagens em português; nome vazio com mensagem em inglês: `String should have at least 3 characters`. |

## Detalhamento dos casos

### CT-HU028-API-001 — Renovação válida

**Dados de entrada:** corpo base (PC-05) com `comprovante_matricula = comprovante.pdf` (~2 MB), token do aluno A.

**Passos**

1. Enviar `PUT /alunos/renovar-vinculo`.
2. Conferir o status em `GET /usuarios/me` (token do aluno A).
3. Com o token do administrador, chamar `GET /usuarios/alunos?status=analise_renovacao`.

**Resultado esperado**

- HTTP `200` com `aluno_id` e `status_cadastro: "analise_renovacao"` (AC-05).
- `GET /usuarios/me` mostra o novo status e o novo comprovante vinculado.
- O aluno A aparece na listagem do administrador filtrada por `analise_renovacao` (fila de análise).

**Resultado obtido**

- `PUT /alunos/renovar-vinculo` com o corpo base e `comprovante.pdf` (2 MB): HTTP `200`, `{"success": true, "message": "Renovação de vínculo enviada para análise", "aluno_id": 2, "status_cadastro": "analise_renovacao"}`, em 0,10 s. ✅
- `GET /usuarios/me`: `status_cadastro: analise_renovacao`, novo `id_comprovante_matricula` e `semestre_atual` atualizado de 6 para 7. ✅
- `GET /usuarios/alunos?status=analise_renovacao` (administrador): o aluno A aparece na fila. ✅
- Status: ✅ Aprovado.

---

### CT-HU028-API-002 — Renovação sem comprovante

**Dados de entrada:** corpo base sem o campo `comprovante_matricula`.

**Passos**

1. Enviar `PUT /alunos/renovar-vinculo`.
2. Conferir o status do aluno em `GET /usuarios/me`.

**Resultado esperado**

- HTTP `422`, `error.code: "REQUEST_VALIDATION_ERROR"`, com detalhe no campo `comprovante_matricula` em português (AC-02).
- Status do aluno inalterado (continua `ativado`).

**Resultado obtido**

- HTTP `422`, `error.code: "REQUEST_VALIDATION_ERROR"`, `details: [{"field": "comprovante_matricula", "message": "Field required"}]`. ✅ Código e campo corretos.
- Status do aluno continuou `ativado` e o comprovante não mudou. ✅
- A mensagem veio em inglês (`Field required`), e não em português. ⚠️ Mesmo padrão já observado nas suítes de API da HU-004 e da HU-005.
- Status: ⚠️ Parcial — [BUG-HU028-API-004](issues/BUG-HU028-API-004-mensagens-de-validacao-em-ingles.md).

---

### CT-HU028-API-003 — Arquivo inválido

**Dados de entrada:** duas tentativas com o corpo base: `comprovante_matricula = comprovante.docx` (2 MB); `comprovante_matricula = comprovante-grande.pdf` (8 MB).

**Passos**

1. Enviar cada tentativa.
2. Conferir o status do aluno ao final.

**Resultado esperado**

- DOCX: HTTP `422`, `error.code: "BUSINESS_VALIDATION_ERROR"`, detalhe do campo `comprovante_matricula` com “Formato inválido” (AC-03).
- PDF de 8 MB: HTTP `422` com “Arquivo excede o limite de tamanho” (limite de 5 MB, AC-03).
- Nenhum arquivo salvo e status inalterado. Nenhum `500`.

**Resultado obtido**

- `comprovante.docx` (2 MB): HTTP `422`, `error.code: "BUSINESS_VALIDATION_ERROR"`, campo `comprovante_matricula`: “Formato de arquivo inválido. Apenas PDF e Imagens (PNG, JPG, JPEG, WEBP) são permitidos.” ✅
- `comprovante-grande.pdf` (8 MB): **HTTP `200`**, renovação aceita e status alterado para `analise_renovacao`. ❌
- Teste complementar com PDF de 11 MB: HTTP `422` “O arquivo excede o tamanho máximo permitido de 10MB”. O limite aplicado na renovação é de 10 MB, e não de 5 MB (AC-03).
- Causa aparente: `renovar_vinculo_use_case.py` importa `validar_regras_arquivo` de `validar_etapa_1_use_case.py` (limite de 10 MB, usado para a foto), em vez do validador da etapa 4 (`validar_etapa_4_use_case.py`, limite de 5 MB e mensagem “Arquivo excede o limite de tamanho”).
- Status: ❌ Falhou — [BUG-HU028-API-001](issues/BUG-HU028-API-001-limite-de-5mb-nao-aplicado.md).

---

### CT-HU028-API-004 — Aluno com vínculo vencido consegue renovar

**Dados de entrada:** aluno V (PC-03); corpo base com os dados dele e `comprovante.pdf`.

**Passos**

1. Enviar `POST /auth/login` com as credenciais do aluno V.
2. Se o login for aceito, enviar `PUT /alunos/renovar-vinculo` com o token obtido.

**Resultado esperado**

- O login é permitido para que o aluno possa renovar: o AC-01 prevê que o aluno com vínculo vencido “faz login e visualiza um aviso destacado de necessidade de renovação” (RN-013).
- A renovação é aceita (HTTP `200`, status `analise_renovacao`).
- Se o login for recusado (ex.: “A validade de acesso da sua conta expirou”), registrar como falha: o aluno com vínculo vencido não consegue chegar à renovação.

**Resultado obtido**

- Preparação: aluno V aprovado e `validade_acesso` ajustada para o dia anterior no banco local.
- `POST /auth/login`: HTTP `401`, `{"detail": "A validade de acesso da sua conta expirou."}`. ❌
- Sem token, a renovação não pôde ser tentada: o aluno com vínculo vencido, justamente quem precisa renovar, não consegue chegar à renovação (AC-01, RN-013).
- Status: ❌ Falhou — [BUG-HU028-API-002](issues/BUG-HU028-API-002-aluno-com-vinculo-vencido-nao-entra.md).

---

### CT-HU028-API-005 — Acesso sem permissão

**Dados de entrada:** corpo base válido, enviado: sem o cabeçalho `Authorization`; com token de administrador; com token de um aluno com status `rejeitado` (se existir).

**Passos**

1. Enviar `PUT /alunos/renovar-vinculo` em cada situação.

**Resultado esperado**

- Sem token: HTTP `401`.
- Token de administrador: HTTP `403` (rota exclusiva do aluno).
- Aluno rejeitado: HTTP `403` (o rejeitado tem fluxo próprio de reenvio de documentos).
- Nenhum dado alterado.

**Resultado obtido**

- Sem `Authorization`: HTTP `401` “Não autenticado”. ✅
- Token do administrador: HTTP `403` “Acesso negado”. ✅
- Token do aluno rejeitado: HTTP `403` “Acesso negado”; o status continuou `rejeitado`. ✅
- Status: ✅ Aprovado.

---

### CT-HU028-API-006 — Efeitos do status “Em análise”

**Dados de entrada:** aluno A com status `analise_renovacao` (após o CT-001).

**Passos**

1. Enviar `POST /auth/login` com as credenciais do aluno A.
2. Com o token, chamar `GET /alunos/me/carteirinha`.

**Resultado esperado**

- Login permitido (o aluno em análise continua acessando o app).
- Carteirinha bloqueada: HTTP `403` com “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” (relação com o AC-02 da HU-029).
- O bloqueio do agendamento (AC-06) não é testável pela API nesta rodada: ainda não há rota de agendamento.

**Resultado obtido**

- `POST /auth/login` do aluno A em análise: HTTP `200`. ✅
- `GET /alunos/me/carteirinha`: HTTP `403`, “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” ✅
- Status: ✅ Aprovado.

---

### CT-HU028-API-007 — Nova renovação estando em análise

**Dados de entrada:** aluno A com status `analise_renovacao` (após o CT-001); corpo base com outro arquivo `comprovante.pdf`.

**Passos**

1. Anotar o `id_comprovante_matricula` atual do aluno A (`GET /usuarios/me`).
2. Enviar `PUT /alunos/renovar-vinculo` de novo.
3. Conferir se o comprovante mudou.

**Resultado esperado**

- O sistema bloqueia uma segunda renovação enquanto a primeira está em análise (ex.: HTTP `409` com mensagem explicando que já há renovação em análise).
- O comprovante em análise não é substituído.
- Se a API aceitar (HTTP `200`) e trocar o comprovante, registrar como falha.

**Resultado obtido**

- Antes: aluno A em `analise_renovacao`, com o comprovante `028409e4…` em análise.
- Nova `PUT /alunos/renovar-vinculo`: HTTP `200`, “Renovação de vínculo enviada para análise”. ❌
- Depois: o comprovante em análise foi trocado (`64807dcf…`); o anterior ficou na tabela `arquivos` sem vínculo com o aluno.
- Status: ❌ Falhou — [BUG-HU028-API-003](issues/BUG-HU028-API-003-renovacao-duplicada-substitui-comprovante.md).

---

### CT-HU028-API-008 — Dados inválidos no corpo

**Dados de entrada:** três tentativas com um aluno aprovado que ainda não renovou, cada uma alterando um campo do corpo base: `telefone = 8599`; `semestre_atual = 0`; `nome` vazio.

**Passos**

1. Enviar cada tentativa com `comprovante.pdf` válido.
2. Conferir o status do aluno ao final.

**Resultado esperado**

- HTTP `422` em todas, com o campo e o motivo em português (mesmas regras do cadastro da HU-001).
- Nenhum arquivo salvo e status inalterado. Nenhum `500`.

**Resultado obtido**

- Executado com o aluno D (aprovado, sem renovação), criado para este caso.
- `telefone = 8599`: HTTP `422` `BUSINESS_VALIDATION_ERROR`, “Telefone celular inválido. Informe um número celular válido com DDD (ex: 11987654321)”. ✅
- `semestre_atual = 0`: HTTP `422`, “O semestre atual deve ser um número inteiro entre 1 e 16”. ✅
- `nome` vazio: HTTP `422` `REQUEST_VALIDATION_ERROR`, mas com mensagem em inglês: `String should have at least 3 characters`. ⚠️
- Status do aluno D continuou `ativado`, com os dados originais. ✅
- Status: ⚠️ Parcial — [BUG-HU028-API-004](issues/BUG-HU028-API-004-mensagens-de-validacao-em-ingles.md).

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU028-API-003 | A renovação aceita comprovante de 8 MB: o limite aplicado é 10 MB, não os 5 MB do AC-03. | [BUG-HU028-API-001](issues/BUG-HU028-API-001-limite-de-5mb-nao-aplicado.md) — #131 |
| CT-HU028-API-004 | O aluno com vínculo vencido não consegue entrar (“A validade de acesso da sua conta expirou.”) e, portanto, não consegue renovar. | [BUG-HU028-API-002](issues/BUG-HU028-API-002-aluno-com-vinculo-vencido-nao-entra.md) — #132 |
| CT-HU028-API-007 | Uma segunda renovação é aceita enquanto a primeira está em análise e substitui o comprovante. | [BUG-HU028-API-003](issues/BUG-HU028-API-003-renovacao-duplicada-substitui-comprovante.md) — #133 |
| CT-HU028-API-002, CT-HU028-API-008 | Mensagens de validação de formulário em inglês (`Field required`, `String should have at least 3 characters`). | [BUG-HU028-API-004](issues/BUG-HU028-API-004-mensagens-de-validacao-em-ingles.md) — #134 |

## Observações gerais

- Referências: [HU-028, seção 7.2.8](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-028.feature) e [suíte de UI](../ui/UI-HU-028.md).
- Divergência de escopo: o requisito fala apenas em enviar o comprovante de matrícula, mas a API exige reenviar todos os dados das etapas 2 e 3 do cadastro (perfil demográfico, contato e vínculo). Registrar e levar ao líder.
- Ponto de atenção do CT-004: no código atual, o login recusa contas com `validade_acesso` vencida (“A validade de acesso da sua conta expirou”), o que impediria o aluno de chegar à renovação.
- A aprovação ou recusa da renovação pelo administrador pertence à HU-027 e fica fora desta suíte.
- Execução em banco isolado e limpo, com massa criada pela API (`POST /usuarios/cadastrar` + aprovação pelo administrador padrão): alunos A, C, V (vínculo vencido pelo banco), R (rejeitado pelo administrador) e D. Nenhum dado do ambiente de desenvolvimento foi alterado.
- Correção da suíte: o método da rota é `PUT`, e não `POST` como estava no planejamento; os casos foram executados com `PUT`.
- Arquivos sem vínculo: as tentativas recusadas não deixaram arquivos órfãos. Porém, a cada renovação aceita, o comprovante anterior fica na tabela `arquivos` sem vínculo com o aluno (3 registros ao final da execução). Avaliar com o líder se o histórico deve ser mantido de forma rastreável ou removido; relaciona-se à issue #85.
- Restaurar o status e a validade dos alunos A e V ao final (pelo administrador ou pelo banco local), registrando a restauração. Ocultar tokens e dados pessoais nas evidências.
