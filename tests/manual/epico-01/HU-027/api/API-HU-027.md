# Testes manuais de API — HU-027 — Avaliação de Solicitação de Cadastro

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta (EP-001) |
| Funcionalidade | HU-027 — Avaliação de Solicitação de Cadastro |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial (baseada em risco) |
| Endpoints | `GET /usuarios/alunos?status=&ordem=` (fila), `GET /alunos/{id}` (detalhes), `GET /arquivos/{id}/view` (documento), `PATCH /usuarios/alunos/{id}/aprovar` e `PATCH /usuarios/alunos/{id}/status` — `application/json`. Corpo da reprovação: `{"status_cadastro": "rejeitado", "motivo_reprovacao": "...", "documentos_reenvio": [{"tipo": "comprovante_matricula", "motivo": "..."}]}` |
| Ambiente | A preencher — URL, branch e commit testados (planejado sobre a `develop` `939921e3`) |
| Total de casos | 10 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 10 | 0 | 0 | 0 | 0 | 10 |

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

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU027-API-001 | Fila de solicitações pendentes | `status=pendente` com e sem `ordem=asc`; `status=xyz` | Só pendentes, do envio mais antigo para o mais recente; status inválido recusado | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-002 | Dados e documentos do aluno | `GET /alunos/{A1}`; `GET /arquivos/{id}/view` dos comprovantes; id inexistente | Dados pessoais e acadêmicos completos; documentos abrem; 404 | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-003 | Aprovar solicitação | `PATCH /usuarios/alunos/{A1}/aprovar` | HTTP 200; status `ativado`; sai da fila; aluno consegue logar | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-004 | Notificar o aluno da aprovação | Caixa do A1 no Mailpit depois do CT-003 | E-mail informando a liberação do acesso | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-005 | Reprovar com motivo por documento | A2: matrícula e residência com motivos diferentes | HTTP 200; status `rejeitado`; motivos gravados; sai da fila; e-mail com cada motivo | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-006 | Motivo obrigatório na reprovação | Sem motivo; motivo em branco; tipo inválido; 256 caracteres | Recusado com mensagem clara; status do aluno não muda | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-007 | Avaliar quem não está na fila | Aprovar/reprovar aluno já ativo, já rejeitado e inexistente; repetir a aprovação | Recusado (fora da fila) ou 404; nada alterado | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-008 | Reprovação deixa o aluno conseguir corrigir | A3 reprovado só com `motivo_reprovacao`, sem documentos | Recusado, ou o aluno recebe ao menos um documento para reenviar | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-009 | Auditoria da avaliação | Operações dos CT-003, 005 e 007 | Um registro por avaliação, com o administrador, status anterior e novo | ⏳ PENDENTE | Não executado. |
| CT-HU027-API-010 | Acesso sem privilégio | Token de aluno, de representante e sem token | 403 (aluno e representante) e 401 (sem token); nada alterado | ⏳ PENDENTE | Não executado. |

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU027-API-004 — Notificar o aluno da aprovação

**Dados de entrada:** caixa de entrada do e-mail do A1 no Mailpit (`http://localhost:8025`).

**Passos**

1. Depois do CT-003, abrir o Mailpit e procurar mensagens para o A1.

**Resultado esperado**

- Um e-mail (ou push) informando que o cadastro foi aprovado e o acesso liberado (AC-04).
- Se não houver nenhum e-mail, registrar como falha. A rota de aprovação **não chama** o serviço de e-mail no código atual.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU027-API-009 — Auditoria da avaliação

**Dados de entrada:** aprovações e reprovações feitas nos CT-003, 005 e 008; recusas dos CT-006 e 007.

**Passos**

1. Pedir à IA para consultar `log_auditoria` com `entidade = 'aluno'`.

**Resultado esperado**

- Um registro por avaliação efetiva, com `usuario_id` do **administrador A**, a ação, o id do aluno, o status **anterior** e o **novo**, e a data/hora (RNF-013).
- Nenhum registro para as recusas.
- Riscos no código: o registro grava o `id` do **aluno** como usuário e lê o status anterior depois de já trocá-lo (anterior igual ao novo).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

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
- Ao final, deixar A1 aprovado, A2 rejeitado e A3 e A4 conforme o resultado, sem apagar registros.
- Ocultar senhas, tokens e dados pessoais nas evidências.
