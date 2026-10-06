# Testes manuais de API — HU-029 — Carteirinha Digital do Aluno

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-029 — Carteirinha Digital do Aluno |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `GET /alunos/me/carteirinha` e `GET /arquivos/{id}/view` (foto) — com token de aluno |
| Ambiente | Docker local isolado — `http://localhost:8001` — branch `feature/testes-api-hu-029` — commit `46a79355` |
| Total de casos | 6 |
| Última execução | 2026-10-06 — execução dos CT-HU029-API-001 a 006 |
| Testador | Cauan Ricardo — execução com apoio de IA (Claude Code) |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: |
| ⚠️ Execução parcial | 6 | 5 | 0 | 1 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API, banco e armazenamento de arquivos (MinIO) disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`. |
| PC-02 | **Aluno A** aprovado (`ativado`), com foto de perfil, e token válido. Anotar nome, curso, instituição e o `id_foto_aluno`. |
| PC-03 | Alunos nos demais status, com token: **pendente**, **em análise de renovação** (`analise_renovacao`) e **inativado**. Preparar pelo administrador (ou pelo banco local) e registrar a preparação. |
| PC-04 | **Aluno B** aprovado (outro aluno), com token, para o CT-004; token de um **administrador** para o CT-003. |

## Resumo da execução

Executar na ordem abaixo. São **6 casos essenciais**.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU029-API-001 | Carteirinha do aluno aprovado | Token do aluno A | HTTP 200 com nome, curso, instituição e foto; só dados necessários | ⚠️ PARCIAL | HTTP 200 com nome, curso, instituição/campus e `id_foto_aluno` do próprio aluno A, em 0,012 s. Porém a resposta devolve o perfil completo, com dados sensíveis que a carteirinha não exibe (data de nascimento, gênero, raça, orientação sexual, filhos, telefone, bairro e IDs dos comprovantes). |
| CT-HU029-API-002 | Aluno sem status aprovado | Pendente; em análise; inativado | HTTP 403 “Carteirinha indisponível…”; nenhum dado do documento | ✅ APROVADO | Em análise: HTTP 403 “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” Pendente e inativado não obtêm sessão (login HTTP 401), e o token emitido antes da inativação passa a ser recusado (HTTP 401). Nenhum dado da carteirinha. |
| CT-HU029-API-003 | Acesso sem permissão | Sem token; token de administrador | HTTP 401; HTTP 403 | ✅ APROVADO | Sem token: HTTP 401 “Não autenticado”; token de administrador: HTTP 403 “Acesso negado”. |
| CT-HU029-API-004 | Foto da carteirinha | Foto do aluno A com o token de A e com o de B | Imagem para A; bloqueada para B | ✅ APROVADO | Token de A: HTTP 200, `image/png`, idêntica à foto enviada. Token de B: HTTP 404 “Arquivo não encontrado”, sem a imagem; sem token: HTTP 401. |
| CT-HU029-API-005 | Tempo de resposta | 5 chamadas do CT-001 | Cada resposta em até 1 s em rede local | ✅ APROVADO | Cinco chamadas com HTTP 200; média de 0,012 s e maior tempo de 0,013 s. |
| CT-HU029-API-006 | Status muda durante a sessão | Token do aluno A emitido quando aprovado; status muda para em análise | HTTP 403 na carteirinha com o token antigo | ✅ APROVADO | Com o mesmo token: HTTP 200 enquanto aprovado e HTTP 403 “Carteirinha indisponível…” logo após o aluno passar para `analise_renovacao`; volta a 200 após nova aprovação. |

## Detalhamento dos casos

### CT-HU029-API-001 — Carteirinha do aluno aprovado

**Dados de entrada:** `GET /alunos/me/carteirinha` com o token do aluno A.

**Passos**

1. Enviar a requisição.
2. Comparar os dados com os anotados na PC-02.
3. Listar os campos retornados.

**Resultado esperado**

- HTTP `200` com os dados de identificação do aluno A: nome completo, curso, instituição/campus e o identificador da foto de perfil (AC-01).
- Os dados são do próprio aluno A.
- A resposta traz só o necessário para a carteirinha. Se vierem dados sensíveis que a carteirinha não exibe (ex.: data de nascimento, raça, gênero, orientação sexual), registrar como observação de LGPD (RNF-010).

**Resultado obtido**

- `GET /alunos/me/carteirinha` com o token do aluno A: HTTP `200` em 0,012 s. ✅
- Dados de identificação corretos e do próprio aluno A: `nome`, `curso`, `faculdade_id`, `campus` e `id_foto_aluno`. ✅
- A resposta é o perfil completo do aluno (`PerfilAlunoResponseDTO`), e não só o necessário para a carteirinha. Campos retornados que a carteirinha não usa: `data_nascimento`, `identificacao_genero`, `raca`, `identificacao_sexual`, `tem_filhos`, `transgenero`, `telefone`, `bairro_id`, `semestre_atual`, `id_comprovante_matricula`, `id_comprovante_residencia`, `motivo_reprovacao`, `validade_acesso` e `data_criacao`. ⚠️ Dados pessoais sensíveis (LGPD, art. 5º, II: origem racial, vida sexual) expostos sem necessidade, contrariando o princípio da necessidade (RNF-010).
- Status: ⚠️ Parcial — [BUG-HU029-API-001](issues/BUG-HU029-API-001-carteirinha-expoe-dados-sensiveis.md).

---

### CT-HU029-API-002 — Aluno sem status aprovado

**Dados de entrada:** `GET /alunos/me/carteirinha` com o token de cada aluno da PC-03: pendente, em análise de renovação e inativado.

**Passos**

1. Enviar a requisição com cada token.
2. Anotar o status e a mensagem.

**Resultado esperado**

- Pendente e em análise: HTTP `403` com “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” (AC-02).
- Inativado: HTTP `403` com a mesma mensagem, ou `401` se a sessão do inativado já for recusada (registrar qual).
- Nenhum dado da carteirinha na resposta.

**Resultado obtido**

- **Em análise** (aluno N, que enviou renovação): `GET /alunos/me/carteirinha` → HTTP `403`, “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” ✅
- **Pendente** (aluno P): o login é recusado (HTTP `401`, “Sua conta está pendente de aprovação pela coordenação.”), então não há sessão para consultar a carteirinha. ✅
- **Inativado** (aluno I): o login é recusado (HTTP `401`, “Sua conta está inativada. Entre em contato com a coordenação.”); com o token obtido antes da inativação, a carteirinha responde HTTP `401` “Sessão inválida ou expirada”. ✅
- Nenhuma resposta trouxe dados da carteirinha.
- Status: ✅ Aprovado.

---

### CT-HU029-API-003 — Acesso sem permissão

**Dados de entrada:** `GET /alunos/me/carteirinha` sem o cabeçalho `Authorization`; depois com o token de um administrador.

**Passos**

1. Enviar as duas requisições.

**Resultado esperado**

- Sem token: HTTP `401`.
- Token de administrador: HTTP `403` (rota exclusiva do aluno).
- Nenhum dado de aluno nas respostas.

**Resultado obtido**

- Sem `Authorization`: HTTP `401`, “Não autenticado”. ✅
- Token do administrador padrão: HTTP `403`, “Acesso negado”. ✅
- Status: ✅ Aprovado.

---

### CT-HU029-API-004 — Foto da carteirinha

**Dados de entrada:** `GET /arquivos/{id_foto_aluno do aluno A}/view`, primeiro com o token do aluno A, depois com o token do aluno B.

**Passos**

1. Enviar a requisição com o token de A e conferir o conteúdo.
2. Repetir com o token de B.

**Resultado esperado**

- Token de A: HTTP `200` com a imagem da foto de perfil.
- Token de B: HTTP `403` ou `404`, sem a imagem: um aluno não acessa a foto de outro.

**Resultado obtido**

- `GET /arquivos/{id_foto_aluno de A}/view` com o token de A: HTTP `200`, `image/png`, 179 bytes, conteúdo idêntico ao arquivo enviado no cadastro. ✅
- Mesma rota com o token de B: HTTP `404`, “Arquivo não encontrado”, sem a imagem (também com o token no parâmetro `?token=`). ✅
- Sem token: HTTP `401`. ✅
- Status: ✅ Aprovado.

---

### CT-HU029-API-005 — Tempo de resposta

**Dados de entrada:** cinco chamadas seguidas de `GET /alunos/me/carteirinha` com o token do aluno A.

**Passos**

1. Enviar as cinco chamadas e anotar o tempo de cada uma (Postman/Insomnia mostram o tempo).

**Resultado esperado**

- Cada resposta em até **1 segundo** em rede local, sem erros (AC-05). Registrar a média e o maior tempo.

**Resultado obtido**

- Cinco chamadas seguidas, todas HTTP `200`: 0,0114 s; 0,0119 s; 0,0108 s; 0,0105 s; 0,0128 s.
- Média de 0,0115 s e maior tempo de 0,0128 s, bem abaixo do limite de 1 s. ✅
- Status: ✅ Aprovado.

---

### CT-HU029-API-006 — Status muda durante a sessão

**Dados de entrada:** token do aluno A obtido enquanto aprovado; depois, o administrador muda o status de A para `analise_renovacao`.

**Passos**

1. Com o token de A, chamar `GET /alunos/me/carteirinha` (deve responder `200`).
2. Mudar o status de A pelo administrador.
3. Com o **mesmo** token, chamar `GET /alunos/me/carteirinha` de novo.
4. Ao final, voltar A para aprovado.

**Resultado esperado**

- A segunda chamada responde HTTP `403` com “Carteirinha indisponível…”: a situação vem do banco, não do token (AC-02).
- Se ainda responder `200` com os dados, registrar como falha.

**Resultado obtido**

- Com o token do aluno A emitido enquanto aprovado: HTTP `200`. ✅
- O aluno A passou para `analise_renovacao` enviando uma renovação (`PUT /alunos/renovar-vinculo`), que é o caminho real para esse status; a rota de status do administrador não oferece `analise_renovacao` diretamente.
- Com o **mesmo** token: HTTP `403`, “Carteirinha indisponível. Seu cadastro está inativo ou em análise.” A situação é lida do banco, não do token. ✅
- Após nova aprovação pelo administrador, o mesmo token voltou a receber HTTP `200`.
- Status: ✅ Aprovado.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| CT-HU029-API-001 | A rota da carteirinha devolve o perfil completo do aluno, incluindo dados sensíveis (raça, orientação sexual, gênero, data de nascimento) que a carteirinha não exibe. | [BUG-HU029-API-001](issues/BUG-HU029-API-001-carteirinha-expoe-dados-sensiveis.md) — #140 |

## Observações gerais

- Referências: [HU-029, seção 7.2.9](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-029.feature) e [suíte de UI](../ui/UI-HU-029.md).
- O limite de 1 segundo do CT-005 é a referência desta suíte para “carregamento rápido” (AC-05), que o requisito não quantifica. Ajustar se o líder definir outro valor.
- O cache offline (AC-03) e a leitura do QR Code (AC-04) são do app e ficam na suíte de UI.
- Execução em banco isolado e limpo, com massa criada pela API (`POST /usuarios/cadastrar` com foto + aprovação pelo administrador padrão): alunos A e B aprovados com foto, P pendente, N em análise (renovação enviada pela API) e I inativado pelo administrador. Nenhum dado do ambiente de desenvolvimento foi alterado.
- Observação fora do escopo: no aluno A, `transgenero` volta `null`, embora o cadastro tenha enviado “Não”; e `validade_acesso` fica `null` após a aprovação, então a validade do vínculo (RN-013) não é definida na aprovação. Levar ao líder.
- Restaurar o status dos alunos da PC-03 ao final. Ocultar tokens, fotos e dados pessoais nas evidências.
