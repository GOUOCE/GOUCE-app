# Testes manuais de API — HU-031 — Consultar Pendência de Cadastro

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta (EP-001) |
| Funcionalidade | HU-031 — Consultar Pendência de Cadastro |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `POST /auth/login`, `GET /usuarios/me`, `GET /usuarios/reenvio_documento` e `PUT`/`PATCH /usuarios/reenvio_documento` (`multipart/form-data` com `comprovante_matricula`, `comprovante_residencia` e `foto_perfil`). A reprovação que gera a pendência usa `PATCH /usuarios/alunos/{id}/status` (HU-027) |
| Ambiente | A preencher — URL, branch e commit testados (planejado sobre a `develop` `939921e3`) |
| Total de casos | 8 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 8 | 0 | 0 | 0 | 0 | 8 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e banco em **stack isolada com banco limpo** (ver [README](README.md)). Usar Postman, Insomnia ou Swagger em `/docs`. |
| PC-02 | Token do **administrador A**, para reprovar os alunos e conferir a fila. |
| PC-03 | Massa criada pela IA pelo fluxo real de cadastro (`POST /usuarios/cadastro`), com os comprovantes anotados: **R1** reprovado pela API da HU-027 com `comprovante_matricula` (motivo “Comprovante de matrícula desatualizado.”) e `comprovante_residencia` (motivo “Comprovante com mais de 3 meses.”); **R2** reprovado só com `foto_perfil` (motivo “Foto com baixa resolução.”); **P1** `pendente`; **AP** aprovado. |
| PC-04 | Arquivos de teste: PDF válido de 1 MB, imagem JPG válida, PDF de **6 MB**, arquivo `.txt` e arquivo vazio. |
| PC-05 | Acesso de leitura ao banco: tabelas `aluno`, `arquivos` e `log_auditoria`; acesso ao MinIO para conferir arquivos sem dono. |

## Resumo da execução

Executar na ordem abaixo. São **8 casos essenciais**. Cada chamada usa o token do aluno indicado.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU031-API-001 | Login e status de cada situação | Login de R1, P1 e AP | Os três entram e recebem o status do cadastro | ⏳ PENDENTE | Não executado. |
| CT-HU031-API-002 | Documentos reprovados e motivos | `GET /usuarios/reenvio_documento` e `GET /usuarios/me` com R1 | Só os documentos reprovados, cada um com o motivo do administrador | ⏳ PENDENTE | Não executado. |
| CT-HU031-API-003 | Sem pendências | `GET /usuarios/reenvio_documento` com AP e P1 | Lista vazia, sem erro | ⏳ PENDENTE | Não executado. |
| CT-HU031-API-004 | Reenviar documentos reprovados | R1: novos comprovantes de matrícula e residência | HTTP 200; status `pendente`; arquivos novos gravados; volta à fila | ⏳ PENDENTE | Não executado. |
| CT-HU031-API-005 | Impedir troca de documento não reprovado | R2: enviar comprovante; enviar nada; enviar foto + comprovante | Recusado com a mensagem do código; nenhum arquivo trocado | ⏳ PENDENTE | Não executado. |
| CT-HU031-API-006 | Falha no envio | R2: foto de 6 MB, `.txt` e vazia | Recusado; R2 continua rejeitado; nenhum arquivo sem dono | ⏳ PENDENTE | Não executado. |
| CT-HU031-API-007 | Reenvio fora da situação de reprovado | P1, AP, administrador e sem token; R1 de novo depois do CT-004 | 403 com a mensagem do código; 401 sem token | ⏳ PENDENTE | Não executado. |
| CT-HU031-API-008 | Situação depois do reenvio | R1 depois do CT-004: chamadas com o token, novo login, fila e detalhes no admin | Aluno vê “Pendente de Aprovação”; admin vê os documentos novos | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### CT-HU031-API-001 — Login e status de cada situação

**Dados de entrada:** `POST /auth/login` com R1 (rejeitado), P1 (pendente) e AP (aprovado).

**Passos**

1. Enviar o login de cada aluno.
2. Anotar o HTTP, o `status_cadastro` devolvido e a mensagem de cada um.

**Resultado esperado**

- Os três alunos conseguem entrar para ver a tela **Status do Cadastro** (AC-01).
- O status devolvido permite mostrar **Pendente de aprovação**, **Aprovado** e **Reprovado** (AC-02, FA-001, FA-002).
- Risco no código: o login de **P1** é recusado com HTTP `401` “Sua conta está pendente de aprovação pela coordenação.”. Se acontecer, registrar como falha do AC-01/FA-002: o aluno pendente não consegue ver o status pela API.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU031-API-002 — Documentos reprovados e motivos

**Dados de entrada:** token de R1; `GET /usuarios/reenvio_documento`; `GET /usuarios/me`.

**Passos**

1. Consultar as pendências.
2. Consultar o perfil.

**Resultado esperado**

- `reenvio_documento`: HTTP `200` com `documentos` contendo **só** `comprovante_matricula` e `comprovante_residencia`, cada um com o seu motivo, exatamente como o administrador escreveu (AC-03, AC-04).
- A foto, que não foi reprovada, não aparece na lista.
- `/usuarios/me`: anotar o HTTP. O app usa essa rota para mostrar os motivos; se ela devolver `403` para o aluno rejeitado, registrar, porque a tela de pendências não vai conseguir carregar os motivos reais (ver UI-HU-031).
- Registrar se o **motivo geral** (`motivo_reprovacao`) aparece em alguma das duas respostas.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU031-API-003 — Sem pendências

**Dados de entrada:** `GET /usuarios/reenvio_documento` com o token do AP; com o token do P1, se o login dele funcionar no CT-001.

**Passos**

1. Enviar a consulta com cada aluno.

**Resultado esperado**

- HTTP `200` com `documentos` vazio (`[]`), sem erro (AC-08).
- Se o P1 não conseguir logar, marcar a parte dele como 🚫 e citar o CT-001.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU031-API-004 — Reenviar documentos reprovados

**Dados de entrada:** token de R1; `PUT /usuarios/reenvio_documento` com `comprovante_matricula` (PDF de 1 MB) e `comprovante_residencia` (JPG).

**Passos**

1. Anotar os ids atuais dos comprovantes do R1 (`GET /alunos/{R1}` com o administrador).
2. Enviar o reenvio.
3. Pedir à IA para conferir no banco os ids novos, `status_cadastro` e `data_hora_envio_analise`.
4. Consultar a fila do administrador (`GET /usuarios/alunos?status=pendente&ordem=asc`).

**Resultado esperado**

- HTTP `200` com “Documentos enviados com sucesso! Seu cadastro foi encaminhado para análise.” e `status` `pendente` (AC-05, AC-06).
- Os dois comprovantes apontam para os arquivos **novos**; a foto não muda.
- `data_hora_envio_analise` atualizada; R1 volta à fila na posição do novo envio (fluxo principal, passo 17).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU031-API-005 — Impedir troca de documento não reprovado

**Dados de entrada:** token de R2 (só a foto foi reprovada):

1. Enviar só `comprovante_matricula`.
2. Enviar nenhum arquivo.
3. Enviar `foto_perfil` e `comprovante_residencia` juntos.

**Passos**

1. Enviar cada chamada.
2. Pedir à IA para conferir que os ids dos documentos do R2 não mudaram e que ele continua rejeitado.

**Resultado esperado**

- Item 1: HTTP `400` “Este documento não foi solicitado pelo administrador: comprovante_matricula” (AC-07).
- Item 2: HTTP `400` “Selecione pelo menos um documento para continuar o reenvio.”.
- Item 3: HTTP `400` recusando o comprovante, **sem** trocar a foto nem o comprovante (AC-07).
- R2 continua `rejeitado`; nenhum arquivo novo fica gravado sem dono.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU031-API-006 — Falha no envio

**Dados de entrada:** token de R2; `foto_perfil` com o PDF de 6 MB, depois com o `.txt` e depois com o arquivo vazio.

**Passos**

1. Contar as linhas da tabela `arquivos` antes.
2. Enviar cada chamada.
3. Contar de novo e conferir o MinIO.

**Resultado esperado**

- HTTP `400` com mensagem em português: limite de 5 MB, formato inválido (só PDF, PNG, JPG, JPEG e WEBP) e arquivo vazio (FA-003).
- R2 continua `rejeitado`, com a mesma pendência.
- Nenhuma linha nova em `arquivos` e nenhum objeto novo no MinIO.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU031-API-007 — Reenvio fora da situação de reprovado

**Dados de entrada:** `PUT /usuarios/reenvio_documento` com um PDF válido em `comprovante_matricula`, usando: o AP; o P1 (se logar); o administrador A; sem token; o R1 de novo depois do CT-004.

**Passos**

1. Enviar cada chamada.
2. Pedir à IA para conferir que nenhum documento mudou.

**Resultado esperado**

- AP e P1: HTTP `403` “O reenvio de documentos está disponível somente para cadastros rejeitados.” (AC-07).
- Administrador: HTTP `403`.
- Sem token: HTTP `401`.
- R1 depois do reenvio: recusado (`403` ou `401`); não troca os documentos já reenviados.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU031-API-008 — Situação depois do reenvio

**Dados de entrada:** o mesmo token do R1 usado no CT-004; um novo login do R1; token do administrador A.

**Passos**

1. Com o token antigo, enviar `GET /usuarios/me` e `GET /usuarios/reenvio_documento`.
2. Fazer novo `POST /auth/login` com o R1.
3. Com o administrador, abrir `GET /alunos/{R1}` e os novos documentos em `/arquivos/{id}/view`.

**Resultado esperado**

- O aluno continua conseguindo ver que o status é **Pendente de Aprovação** (AC-06, FA-002). Se o token passar a dar `401` e o novo login for recusado como “pendente de aprovação”, registrar como falha (mesma causa do CT-001).
- Os motivos antigos não aparecem mais como pendência para o aluno.
- O administrador vê R1 na fila e abre os documentos novos (fluxo principal, passo 17).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Rastreabilidade

| Critério | Cenário BDD | Casos |
| --- | --- | --- |
| AC-01 — acessar o status depois do login | — (HU sem arquivo `.feature`) | CT-001 |
| AC-02 / FA-001 / FA-002 — status atual | — | CT-001, CT-008 |
| AC-03 — documentos reprovados | — | CT-002 |
| AC-04 — motivo de cada documento | — | CT-002 |
| AC-05 — reenviar documento reprovado | — | CT-004 |
| AC-06 — status volta para pendente | — | CT-004, CT-008 |
| AC-07 — não alterar documento aprovado | — | CT-005, CT-007 |
| AC-08 — sem pendências | — | CT-003 |
| FA-003 — falha no envio | — | CT-006 |
| RN-012 — aluno corrige e reenvia | — | CT-004 e CT-HU027-API-008 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-031, seção 7.2.10](../../../../../docs/requisitos.md), [suíte de UI](../ui/UI-HU-031.md) e a [HU-027](../../HU-027/api/API-HU-027.md), que gera a reprovação. A HU-031 **não tem** arquivo de BDD.
- **Riscos mapeados no código** (`backend/src/modulos/usuarios/` e `backend/src/modulos/auth/`, `develop` `939921e3`), que orientaram a escolha dos casos:
  - o login recusa aluno `pendente` e a sessão só vale para `ativado`, `analise_renovacao` e `rejeitado`: o aluno pendente não vê o status, e o R1 perde a sessão logo depois de reenviar (CT-001, CT-008);
  - `GET /usuarios/me` bloqueia aluno `rejeitado` com `403`, mas é a rota que o app usa para ler os motivos (CT-002);
  - não existe aprovação **por documento**: “documento aprovado” é qualquer um que não está em `documentos_reenvio`, e a regra é aplicada pelo “não foi solicitado” (CT-005);
  - depois do reenvio, `documentos_reenvio` continua gravado (com o `arquivo_id` novo), e os motivos antigos podem continuar aparecendo (CT-008);
  - o motivo geral (`motivo_reprovacao`) não é devolvido por `GET /usuarios/reenvio_documento` (CT-002).
- Ao final, deixar R1 pendente com os documentos novos e R2 rejeitado, sem apagar registros.
- Ocultar senhas, tokens e dados pessoais nas evidências.
