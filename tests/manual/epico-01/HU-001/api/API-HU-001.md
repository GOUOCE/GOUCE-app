# Testes manuais de API — HU-001 — Solicitação de Cadastro de Aluno

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-001 — Solicitação de Cadastro de Aluno |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoint | `POST /usuarios/cadastrar` — `multipart/form-data` |
| Ambiente | Docker local — `http://localhost:8000` — branch `feature/testes-api-hu-001` — commit `9cd5d3da` |
| Total de casos | 8 |
| Última execução | 2026-10-02 — execução dos CT-HU001-API-001 a 008 |
| Testador | Radlei Doroth |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| ⚠️ Execução parcial | 8 | 2 | 2 | 4 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API, banco e armazenamento disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`, com a URL do ambiente. A solicitação de cadastro não exige autenticação. |
| PC-02 | Preparar a requisição válida abaixo. No Postman, usar **Body → form-data**; comprovantes são do tipo **File**, os demais campos do tipo **Text**. Deixar o cliente gerar o `Content-Type` e o boundary. |
| PC-03 | Usar dados fictícios e um e-mail novo por tentativa, exceto no teste de duplicidade. Alterar somente o dado indicado em cada teste negativo. |
| PC-04 | Ter consulta autorizada dos cadastros, por exemplo `GET /usuarios/alunos` com token de administrador, e acesso aos comprovantes. Sem isso, registrar a verificação de persistência como pendente. |

**Dados válidos de referência**

Os valores pessoais e a senha de referência não são registrados nesta documentação. Use valores fictícios válidos no cliente de teste e varie o e-mail por tentativa.

| Campo | Valor |
| --- | --- |
| nome | valor fictício válido omitido |
| email | e-mail fictício novo por tentativa omitido |
| senha | senha fictícia válida omitida |
| data_nascimento | data fictícia válida omitida |
| telefone | telefone fictício válido omitido |
| raca | valor fictício válido omitido |
| identificacao_sexual | valor fictício válido omitido |
| identificacao_genero | valor fictício válido omitido |
| transgenero | valor fictício válido omitido |
| tem_filhos | valor fictício válido omitido |
| bairro_id | identificador válido omitido |
| faculdade_id | identificador válido omitido |
| curso | valor fictício válido omitido |
| campus | valor fictício válido omitido |
| semestre_atual | valor inteiro válido omitido |
| periodo_ingresso | período válido omitido |
| turno_curso | turno válido omitido |
| comprovante_matricula | `matricula.pdf` — arquivo fictício, válido, pequeno e não vazio |
| comprovante_residencia | `residencia.pdf` — arquivo fictício, válido, pequeno e não vazio |
| termos_de_uso | true |

`foto_perfil` é opcional no contrato atual; omitir nesta rodada. Confirmar a massa no `/docs` da versão implantada antes de executar.

## Resumo da execução

Executar na ordem abaixo. São **8 casos essenciais**, com poucas variações explícitas; registrar cada variação antes de marcar o caso como aprovado.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU001-API-001 | Cadastro válido e pendente | Massa válida e dois comprovantes | HTTP 201; aluno pendente, dados e documentos vinculados | ✅ APROVADO | HTTP 201; `success: true`; usuário ID 2 persistido no PostgreSQL, com status `pendente` e telefone preenchido. Os dois comprovantes estão associados no PostgreSQL e os arquivos foram localizados no bucket `smp-fotos` do MinIO. |
| CT-HU001-API-002 | E-mail duplicado | E-mail criado no CT-001 | HTTP 409; impedir segundo cadastro | ⚠️ PARCIAL | HTTP 409; `success: false`; `EMAIL_ALREADY_REGISTERED`. A investigação confirmou dois registros órfãos em `arquivos` e dois objetos correspondentes no MinIO; a resposta HTTP foi correta, mas houve efeito colateral de armazenamento. |
| CT-HU001-API-003 | Campo obrigatório ausente | Omitir nome, depois telefone, em tentativas separadas | Rejeitar ausência e indicar o campo | ❌ FALHOU | Sem `nome`: 422 conforme esperado; a consulta posterior por `email_hash` retornou zero usuários para essa tentativa. Sem `telefone`: HTTP 201, cadastro aceito com status pendente; o usuário ID 3 foi persistido no PostgreSQL. A investigação não encontrou arquivos órfãos atribuíveis ao caso. |
| CT-HU001-API-004 | Dados inválidos | E-mail inválido; depois data inexistente | Rejeitar com erro de validação | ⚠️ PARCIAL | As respostas foram conforme esperado: e-mail `422` e data `400`. As consultas posteriores por `email_hash` retornaram zero usuários para as duas tentativas. Cada tentativa deixou dois registros órfãos em `arquivos` e dois objetos no MinIO; houve efeito colateral de armazenamento. |
| CT-HU001-API-005 | Senha fora das regras | Senha curta ou sem maiúscula, minúscula ou número | Rejeitar conforme AC-03 | ❌ FALHOU | Senha curta, sem maiúscula e sem minúscula foram aceitas com HTTP 201 e persistidas no PostgreSQL como usuários IDs 4, 5 e 6, respectivamente. A tentativa sem número foi rejeitada com HTTP 400 e `VALIDATION_ERROR`, mas deixou dois registros órfãos e dois objetos no MinIO. |
| CT-HU001-API-006 | Cadastro sem aceite | termos_de_uso=false | HTTP 400; exigir aceite | ⚠️ PARCIAL | HTTP 400; `VALIDATION_ERROR`; detalhe referente a `termos_de_uso`, conforme esperado. A consulta posterior por `email_hash` retornou zero usuários para a tentativa. Ainda assim, a tentativa deixou dois registros órfãos em `arquivos` e dois objetos no MinIO. |
| CT-HU001-API-007 | Comprovante obrigatório ausente | Omitir matrícula; depois residência | HTTP 422; identificar o arquivo ausente | ✅ APROVADO | As duas tentativas retornaram HTTP 422 e `REQUEST_VALIDATION_ERROR`, identificando o campo ausente. As consultas posteriores por `email_hash` retornaram zero usuários para as tentativas sem comprovante de matrícula e sem comprovante de residência. A investigação não encontrou arquivos órfãos atribuíveis ao caso. |
| CT-HU001-API-008 | Arquivo inválido | PDF vazio; depois TXT | HTTP 400; rejeitar o comprovante | ⚠️ PARCIAL | PDF vazio: HTTP 400, `VALIDATION_ERROR`, “O arquivo enviado está vazio”; TXT: HTTP 400, `VALIDATION_ERROR`, formato não permitido. As consultas posteriores por `email_hash` retornaram zero usuários para as duas tentativas. A investigação não encontrou arquivos órfãos atribuíveis ao caso. A classificação permanece parcial porque os requisitos da HU-001 não definem explicitamente a política de formatos PDF/imagem e a suíte registra que essa política ainda precisa ser confirmada com o time. |

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

- HTTP `201`, `success: true`, com `status_cadastro: "pendente"`.
- Os campos `nome`, `email` e `id` foram retornados corretamente; o usuário foi criado com ID `2`.
- O PostgreSQL confirmou a persistência do usuário, com status `pendente` e telefone preenchido.
- Os dois comprovantes estão associados ao usuário no PostgreSQL, e os arquivos correspondentes foram localizados no bucket `smp-fotos` do MinIO.
- O texto completo de `message` e do corpo JSON não foi preservado no registro disponível; não foi reconstruído.
- Status: ✅ Aprovado.

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

- HTTP `409`, `success: false`, `error.code: "EMAIL_ALREADY_REGISTERED"` e mensagem de e-mail já cadastrado.
- A consulta posterior por `email_hash` encontrou somente o usuário ID `2` e não encontrou usuários adicionais associados ao e-mail rejeitado.
- A investigação posterior de persistência confirmou que a tentativa deixou dois registros órfãos em `arquivos` e dois objetos no MinIO. O caso permanece parcial: a resposta HTTP foi correta, mas os comprovantes não foram removidos.
- O texto completo da mensagem não foi preservado; o registro disponível apenas descreve a mensagem como referente a e-mail já cadastrado.
- Status: ⚠️ Parcial.

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

- Primeira tentativa, sem `nome`: HTTP `422`, `success: false`, `error.code: "REQUEST_VALIDATION_ERROR"` e `error.details` identificando `nome`, conforme esperado.
- Segunda tentativa, sem `telefone` e mantendo nome e demais dados válidos: HTTP `201`, `success: true`; cadastro aceito com `status_cadastro: "pendente"`, contrariando o requisito.
- O PostgreSQL confirmou a persistência do usuário ID `3` sem telefone.
- A consulta posterior por `email_hash` retornou zero usuários para a tentativa sem `nome`.
- A investigação não encontrou arquivos órfãos atribuíveis às tentativas deste caso.
- A tentativa sem `telefone` foi uma resposta de sucesso; não há `error.code` ou mensagem de erro aplicável. O trecho JSON preservado está registrado no BUG-001.
- Status: ❌ Falhou.

---

### CT-HU001-API-004 — Dados inválidos

**Dados de entrada:** duas tentativas: e-mail em formato inválido; depois e-mail fictício válido e novo com data de nascimento inexistente.

**Passos**

1. Alterar apenas o campo indicado em cada requisição.
2. Enviar, conferir status/JSON e verificar que não houve criação do aluno.

**Resultado esperado**

- E-mail inválido: HTTP `422` e `error.code: "REQUEST_VALIDATION_ERROR"`.
- Data inexistente: HTTP `400` e `error.code: "VALIDATION_ERROR"`.
- Em ambos: `success: false`, detalhe que identifique o campo/problema e nenhum aluno criado. Não retornar `500` para dado inválido.

**Resultado obtido**

- E-mail inválido: HTTP `422`, `success: false`, `error.code: "REQUEST_VALIDATION_ERROR"` e `error.details` identificando `email`, conforme esperado.
- Data de nascimento inexistente: HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"`, `error.details` identificando `data_nascimento` e mensagem: `Data de nascimento inválida (verifique dia e mês).`, conforme esperado.
- As consultas posteriores por `email_hash` retornaram zero usuários para as duas tentativas: e-mail inválido e data de nascimento inválida.
- A investigação posterior confirmou dois registros órfãos e dois objetos no MinIO para cada tentativa rejeitada. As respostas HTTP foram corretas, mas os efeitos colaterais de armazenamento impedem a aprovação completa.
- Para a tentativa de e-mail inválido, o texto completo da mensagem não foi preservado; somente o código e a identificação do campo estão registrados.
- Status: ⚠️ Parcial.

---

### CT-HU001-API-005 — Senha fora das regras

**Dados de entrada:** uma tentativa por categoria: senha com 7 caracteres, senha sem maiúscula, senha sem minúscula e senha sem número. Os valores das senhas não foram preservados.

**Passos**

1. Substituir somente `senha` na massa válida, usando e-mail novo em cada tentativa.
2. Enviar cada senha diretamente à rota de cadastro, sem passar pela validação da interface.
3. Conferir a resposta e verificar que não houve criação de aluno.

**Resultado esperado**

- Rejeitar todas as quatro senhas com HTTP `400` ou `422`, `success: false` e mensagem de validação; não criar aluno.
- Aplicar o AC-03: mínimo de 8 caracteres, uma maiúscula, uma minúscula e um número. O validador atual é menos restritivo; eventual aceitação deve ser registrada como falha, não usada para mudar o esperado.

**Resultado obtido**

- Senha curta, com 7 caracteres: HTTP `201`; cadastro aceito indevidamente.
- Senha sem maiúscula: HTTP `201`; cadastro aceito indevidamente.
- Senha sem minúscula: HTTP `201`; cadastro aceito indevidamente.
- Senha sem número: HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e mensagem informando que a senha deve conter pelo menos um número.
- O PostgreSQL confirmou a persistência dos cadastros aceitos:

  | Cenário | ID |
  | --- | ---: |
  | Senha curta | 4 |
  | Senha sem maiúscula | 5 |
  | Senha sem minúscula | 6 |

- A consulta posterior por `email_hash` retornou zero usuários para a tentativa sem número. A investigação confirmou dois registros órfãos em `arquivos` e dois objetos no MinIO. Os três cadastros aceitos possuem arquivos associados; a rejeição HTTP correta não evitou o efeito colateral.
- Não foram preservados trechos JSON das três respostas HTTP `201`; os registros disponíveis contêm somente status e confirmação de persistência. O corpo da rejeição sem número contém o código indicado acima, mas sua mensagem completa também não foi transcrita.
- Status: ❌ Falhou.

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

- HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e `error.details` referente a `termos_de_uso`, conforme esperado.
- A consulta posterior por `email_hash` retornou zero usuários para a tentativa com termos de uso não aceitos.
- A investigação posterior confirmou dois registros órfãos em `arquivos` e dois objetos no MinIO. A resposta HTTP foi correta, mas os comprovantes não foram removidos.
- O texto completo da mensagem de validação não foi preservado; somente o código e o campo identificado estão registrados.
- Status: ⚠️ Parcial.

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

- Tentativa sem `comprovante_matricula`: HTTP `422`, `success: false`, `error.code: "REQUEST_VALIDATION_ERROR"` e `error.details` identificando `comprovante_matricula`, conforme esperado.
- Tentativa sem `comprovante_residencia`: HTTP `422`, `success: false`, `error.code: "REQUEST_VALIDATION_ERROR"` e `error.details` identificando `comprovante_residencia`, conforme esperado.
- As duas tentativas apresentaram as validações esperadas.
- As consultas posteriores por `email_hash` retornaram zero usuários para ambas as tentativas: sem comprovante de matrícula e sem comprovante de residência.
- A investigação posterior não encontrou arquivos órfãos atribuíveis às duas tentativas.
- O texto completo da mensagem não foi preservado; o código e o campo ausente estão registrados.
- Status: ✅ Aprovado.

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

- PDF vazio: HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e mensagem `O arquivo enviado está vazio`, conforme esperado.
- Arquivo TXT: HTTP `400`, `success: false`, `error.code: "VALIDATION_ERROR"` e mensagem informando que apenas PDF e imagens PNG, JPG, JPEG e WEBP são permitidos, conforme esperado.
- As duas tentativas apresentaram as validações esperadas.
- As consultas posteriores por `email_hash` retornaram zero usuários para ambas as tentativas: PDF vazio e arquivo TXT.
- A investigação posterior não encontrou arquivos órfãos atribuíveis às duas tentativas.
- A classificação permanece parcial porque os requisitos não explicitam os formatos aceitos e a confirmação da política técnica PDF/imagem, prevista no resultado esperado, não está registrada.
- Status: ⚠️ Parcial.

## Investigação de persistência

A investigação posterior foi realizada com consultas somente leitura ao PostgreSQL, logs da API e metadados do MinIO. Ela confirmou 10 registros órfãos na tabela `arquivos`, todos com `content_type=application/pdf`, distribuídos em cinco pares. Os 10 registros possuem objetos correspondentes no bucket `smp-fotos` do MinIO, um objeto por UUID do registro.

| Caso | Horário UTC | Resposta HTTP | Resultado da investigação |
| --- | --- | ---: | --- |
| `CT-HU001-API-002` — e-mail duplicado | `21:20:48` | `409` | 2 registros órfãos e 2 objetos no MinIO |
| `CT-HU001-API-004` — e-mail inválido | `21:38:28` | `422` | 2 registros órfãos e 2 objetos no MinIO |
| `CT-HU001-API-004` — data inválida | `21:39:51` | `400` | 2 registros órfãos e 2 objetos no MinIO |
| `CT-HU001-API-005` — senha sem número | `21:48:30` | `400` | 2 registros órfãos e 2 objetos no MinIO |
| `CT-HU001-API-006` — termos não aceitos | `22:05:32` | `400` | 2 registros órfãos e 2 objetos no MinIO |

As consultas posteriores por `email_hash` retornaram zero usuários para as tentativas rejeitadas, exceto a consulta do CT-002, que encontrou somente o usuário ID `2` e nenhum usuário adicional. Não há evidência de arquivos órfãos atribuível aos casos `CT-HU001-API-003`, `CT-HU001-API-007` ou `CT-HU001-API-008`.

Essas consultas foram realizadas após a execução dos testes e registram o estado encontrado naquele momento; não comprovam, isoladamente, a ausência de persistência de usuário durante todo o intervalo entre cada requisição e a consulta posterior.

A investigação distingue a validação da resposta HTTP dos efeitos colaterais de armazenamento: uma resposta `400`, `409` ou `422` pode estar correta e, ainda assim, o caso não deve ser aprovado se deixar registros ou objetos sem associação.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU001-API-003 | A API aceita o cadastro sem o campo obrigatório `telefone` e retorna HTTP `201`. | [BUG-HU001-API-001 — Issue #81](https://github.com/GOUOCE/GOUCE-app/issues/81) |
| CT-HU001-API-005 | A API aceita senhas sem comprimento mínimo, maiúscula ou minúscula, embora rejeite corretamente a ausência de número. | [BUG-HU001-API-002 — Issue #84](https://github.com/GOUOCE/GOUCE-app/issues/84) |
| CT-HU001-API-002, CT-HU001-API-004, CT-HU001-API-005 e CT-HU001-API-006 | A API rejeita as requisições, mas deixa comprovantes persistidos na tabela `arquivos` e no bucket `smp-fotos`, sem associação com alunos. | [BUG-HU001-API-003 — Issue #85](https://github.com/GOUOCE/GOUCE-app/issues/85) |

## Observações gerais

- Referências: [HU-001, seção 7.2.1](../../../../../docs/requisitos.md) e [contrato atual das rotas](../../../../../backend/src/modulos/usuarios/interface/http/usuario_routes.py). Conferir a versão implantada; esta suíte não foi executada durante sua criação.
- A suíte cobre somente a rota principal usada pelo app. Rotas de validação por etapa, cadastro JSON, limites extensos, concorrência, falhas de infraestrutura e verificações completas de hash/HTTPS ficam para outra rodada. Aprovar estes 8 casos não significa cobertura total da HU.
- Se o CT-001 falhar, registrar o defeito e executar os negativos que ainda possam ser isolados. Quando não houver acesso às consultas de persistência, registrar essa verificação como pendente. A ausência de aluno não implica que uploads temporários tenham sido removidos.
- A investigação de persistência desta execução está documentada em [BUG-HU001-API-003-arquivos-orfaos.md](issues/BUG-HU001-API-003-arquivos-orfaos.md); a ausência de registros em `aluno` não foi tratada como evidência de remoção dos arquivos.
- Registrar status e resposta obtidos em cada CT; ocultar senhas, tokens e dados pessoais nas evidências.
