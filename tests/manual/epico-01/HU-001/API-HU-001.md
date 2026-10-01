# Testes manuais de API — HU-001 — Solicitação de Cadastro de Aluno

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-001 — Solicitação de Cadastro de Aluno |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoint | `POST /usuarios/cadastrar` — `multipart/form-data` |
| Ambiente | A preencher — URL e commit testado |
| Total de casos | 8 |
| Última execução | Não realizada |
| Testador | Radlei Doroth |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 8 | 0 | 0 | 8 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API, banco e armazenamento disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`, com a URL do ambiente. A solicitação de cadastro não exige autenticação. |
| PC-02 | Preparar a requisição válida abaixo. No Postman, usar **Body → form-data**; comprovantes são do tipo **File**, os demais campos do tipo **Text**. Deixar o cliente gerar o `Content-Type` e o boundary. |
| PC-03 | Usar dados fictícios e um e-mail novo por tentativa, exceto no teste de duplicidade. Alterar somente o dado indicado em cada teste negativo. |
| PC-04 | Ter consulta autorizada dos cadastros, por exemplo `GET /usuarios/alunos` com token de administrador, e acesso aos comprovantes. Sem isso, registrar a verificação de persistência como pendente. |

**Dados válidos de referência**

| Campo | Valor |
| --- | --- |
| nome | Maria da Silva Souza |
| email | qa.hu001.001@example.com — variar por tentativa |
| senha | Abcde123 |
| data_nascimento | 2002-03-15 |
| telefone | 85999990000 |
| raca | Pardo |
| identificacao_sexual | Heterossexual |
| identificacao_genero | Mulher |
| transgenero | Não |
| tem_filhos | false |
| bairro_id | Centro |
| faculdade_id | UFC |
| curso | Engenharia de Software |
| campus | Quixadá |
| semestre_atual | 5 |
| periodo_ingresso | 2024.1 |
| turno_curso | Matutino |
| comprovante_matricula | `matricula.pdf` — arquivo fictício, válido, pequeno e não vazio |
| comprovante_residencia | `residencia.pdf` — arquivo fictício, válido, pequeno e não vazio |
| termos_de_uso | true |

`foto_perfil` é opcional no contrato atual; omitir nesta rodada. Confirmar a massa no `/docs` da versão implantada antes de executar.

## Resumo da execução

Executar na ordem abaixo. São **8 casos essenciais**, com poucas variações explícitas; registrar cada variação antes de marcar o caso como aprovado.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-API-001 | Cadastro válido e pendente | Massa válida e dois comprovantes | HTTP 201; aluno pendente, dados e documentos vinculados | ⏳ PENDENTE | Não executado. |
| CT-HU001-API-002 | E-mail duplicado | E-mail criado no CT-001 | HTTP 409; impedir segundo cadastro | ⏳ PENDENTE | Não executado. |
| CT-HU001-API-003 | Campo obrigatório ausente | Omitir nome, depois telefone, em tentativas separadas | Rejeitar ausência e indicar o campo | ⏳ PENDENTE | Não executado. |
| CT-HU001-API-004 | Dados inválidos | E-mail inválido; depois data inexistente | Rejeitar com erro de validação | ⏳ PENDENTE | Não executado. |
| CT-HU001-API-005 | Senha fora das regras | Senha curta ou sem maiúscula, minúscula ou número | Rejeitar conforme AC-03 | ⏳ PENDENTE | Não executado. |
| CT-HU001-API-006 | Cadastro sem aceite | termos_de_uso=false | HTTP 400; exigir aceite | ⏳ PENDENTE | Não executado. |
| CT-HU001-API-007 | Comprovante obrigatório ausente | Omitir matrícula; depois residência | HTTP 422; identificar o arquivo ausente | ⏳ PENDENTE | Não executado. |
| CT-HU001-API-008 | Arquivo inválido | PDF vazio; depois TXT | HTTP 400; rejeitar o comprovante | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### CT-HU001-API-001 — Cadastro válido e pendente

**Dados de entrada:** massa válida das pré-condições, com e-mail novo e os dois PDFs distintos.

**Passos**

1. Enviar `POST /usuarios/cadastrar` por multipart, sem token de autenticação.
2. Registrar status, JSON e ID retornado.
3. Consultar o aluno pelo acesso autorizado e comparar os dados, o status e os IDs dos comprovantes. Recuperar os dois arquivos por `GET /arquivos/{id}/view` com autorização e comparar com os originais.

**Resultado esperado**

- HTTP `201`, `success: true`, `message` informando envio para análise e `data` contendo `id`, `nome`, `email` e `status_cadastro: "pendente"`.
- Existir um único cadastro com dados corretos, status **Pendente de Aprovação** e os dois comprovantes acessíveis e corretamente vinculados.
- Não retornar senha, hash nem tokens que criem sessão automática.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU001-API-002 — E-mail duplicado

**Dados de entrada:** e-mail usado com sucesso no CT-HU001-API-001; demais campos válidos.

**Preparação específica**

- Confirmar que o cadastro anterior existe antes da tentativa.

**Passos**

1. Enviar uma nova solicitação com o mesmo e-mail.
2. Conferir a resposta e consultar a quantidade de cadastros desse usuário.

**Resultado esperado**

- HTTP `409`, `success: false`, `error.code: "EMAIL_ALREADY_REGISTERED"` e mensagem de e-mail já cadastrado.
- Não criar segundo cadastro nem alterar o original.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU001-API-003 — Campo obrigatório ausente

**Dados de entrada:** duas tentativas: remover somente `nome`; depois restaurá-lo e remover somente `telefone`.

**Passos**

1. Duplicar a requisição válida e desmarcar o campo em teste no form-data.
2. Enviar cada tentativa separadamente, mantendo os outros dados válidos.
3. Conferir o erro e verificar que não houve criação do aluno.

**Resultado esperado**

- Sem `nome`: HTTP `422`, `success: false`, `error.code: "REQUEST_VALIDATION_ERROR"` e `error.details` identificando `nome`.
- Sem `telefone`: rejeitar com HTTP `400` ou `422` e indicar o campo obrigatório, conforme AC-02. O contrato atual o trata como opcional; se aceitar, registrar a divergência com o requisito, sem considerar sucesso do teste.
- Não criar aluno nas duas tentativas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU001-API-004 — Dados inválidos

**Dados de entrada:** duas tentativas: `email=maria@`; depois e-mail válido e novo com `data_nascimento=31/02/2002`.

**Passos**

1. Alterar apenas o campo indicado em cada requisição.
2. Enviar, conferir status/JSON e verificar que não houve criação do aluno.

**Resultado esperado**

- E-mail inválido: HTTP `422` e `error.code: "REQUEST_VALIDATION_ERROR"`.
- Data inexistente: HTTP `400` e `error.code: "VALIDATION_ERROR"`.
- Em ambos: `success: false`, detalhe que identifique o campo/problema e nenhum aluno criado. Não retornar `500` para dado inválido.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU001-API-005 — Senha fora das regras

**Dados de entrada:** uma tentativa por senha: `Abcd123` (7 caracteres), `abcdefg1` (sem maiúscula), `ABCDEFG1` (sem minúscula) e `Abcdefgh` (sem número).

**Passos**

1. Substituir somente `senha` na massa válida, usando e-mail novo em cada tentativa.
2. Enviar cada senha diretamente à rota de cadastro, sem passar pela validação da interface.
3. Conferir a resposta e verificar que não houve criação de aluno.

**Resultado esperado**

- Rejeitar todas as quatro senhas com HTTP `400` ou `422`, `success: false` e mensagem de validação; não criar aluno.
- Aplicar o AC-03: mínimo de 8 caracteres, uma maiúscula, uma minúscula e um número. O validador atual é menos restritivo; eventual aceitação deve ser registrada como falha, não usada para mudar o esperado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU001-API-006 — Cadastro sem aceite

**Dados de entrada:** massa válida com `termos_de_uso=false`.

**Passos**

1. Enviar a solicitação com ambos os comprovantes válidos e o aceite desmarcado.
2. Conferir resposta e ausência de cadastro.

**Resultado esperado**

- HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e detalhe sobre a necessidade do aceite.
- Não criar aluno, conforme AC-05.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU001-API-007 — Comprovante obrigatório ausente

**Dados de entrada:** duas tentativas: sem matrícula, mantendo residência válida; sem residência, mantendo matrícula válida.

**Passos**

1. Omitir somente um dos campos de arquivo por tentativa.
2. Enviar cada requisição e conferir resposta e ausência de cadastro.

**Resultado esperado**

- HTTP `422`, `success: false`, `error.code: "REQUEST_VALIDATION_ERROR"` e `error.details` identificando o comprovante ausente.
- Não criar aluno com documentação incompleta.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU001-API-008 — Arquivo inválido

**Dados de entrada:** `comprovante_matricula` com PDF de 0 bytes; depois arquivo `.txt` real com MIME `text/plain`. Manter residência válida.

**Passos**

1. Selecionar cada arquivo inválido como **File**, em tentativas separadas.
2. Enviar mantendo os demais dados válidos.
3. Conferir a resposta e verificar que não houve criação do aluno.

**Resultado esperado**

- HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e detalhe que informe arquivo vazio ou formato não permitido.
- Não concluir cadastro com o comprovante inválido. A rejeição de TXT segue a política técnica atual de PDF/imagens; confirmar essa política com o time.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-001, seção 7.2.1](../../../../docs/requisitos.md) e [contrato atual das rotas](../../../../backend/src/modulos/usuarios/interface/http/usuario_routes.py). Conferir a versão implantada; esta suíte não foi executada durante sua criação.
- A suíte cobre somente a rota principal usada pelo app. Rotas de validação por etapa, cadastro JSON, limites extensos, concorrência, falhas de infraestrutura e verificações completas de hash/HTTPS ficam para outra rodada. Aprovar estes 8 casos não significa cobertura total da HU.
- Se o CT-001 falhar, registrar o defeito e executar os negativos que ainda possam ser isolados. Sem acesso à consulta dos registros, manter a verificação de persistência pendente. A ausência de aluno não implica que uploads temporários tenham sido removidos.
- Registrar status e resposta obtidos em cada CT; ocultar senhas, tokens e dados pessoais nas evidências.
