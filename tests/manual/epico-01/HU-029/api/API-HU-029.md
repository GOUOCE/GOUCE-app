# Testes manuais de API — HU-029 — Carteirinha Digital do Aluno

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-029 — Carteirinha Digital do Aluno |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `GET /alunos/me/carteirinha` e `GET /arquivos/{id}/view` (foto) — com token de aluno |
| Ambiente | A preencher — URL e commit testado |
| Total de casos | 5 |
| Última execução | Não realizada |
| Testador | A definir |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 5 | 0 | 0 | 5 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API, banco e armazenamento de arquivos (MinIO) disponíveis. Usar Postman, Insomnia ou Swagger em `/docs`. |
| PC-02 | **Aluno A** aprovado (`ativado`), com foto de perfil, e token válido. Anotar nome, curso, instituição e o `id_foto_aluno`. |
| PC-03 | Alunos nos demais status, com token: **pendente**, **em análise de renovação** (`analise_renovacao`) e **inativado**. Preparar pelo administrador (ou pelo banco local) e registrar a preparação. |
| PC-04 | **Aluno B** aprovado (outro aluno), com token, para o CT-004; token de um **administrador** para o CT-003. |

## Resumo da execução

Executar na ordem abaixo. São **5 casos essenciais**.

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU029-API-001 | Carteirinha do aluno aprovado | Token do aluno A | HTTP 200 com nome, curso, instituição e foto; só dados necessários | ⏳ PENDENTE | Não executado. |
| CT-HU029-API-002 | Aluno sem status aprovado | Pendente; em análise; inativado | HTTP 403 “Carteirinha indisponível…”; nenhum dado do documento | ⏳ PENDENTE | Não executado. |
| CT-HU029-API-003 | Acesso sem permissão | Sem token; token de administrador | HTTP 401; HTTP 403 | ⏳ PENDENTE | Não executado. |
| CT-HU029-API-004 | Foto da carteirinha | Foto do aluno A com o token de A e com o de B | Imagem para A; bloqueada para B | ⏳ PENDENTE | Não executado. |
| CT-HU029-API-005 | Tempo de resposta | 5 chamadas do CT-001 | Cada resposta em até 1 s em rede local | ⏳ PENDENTE | Não executado. |

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU029-API-005 — Tempo de resposta

**Dados de entrada:** cinco chamadas seguidas de `GET /alunos/me/carteirinha` com o token do aluno A.

**Passos**

1. Enviar as cinco chamadas e anotar o tempo de cada uma (Postman/Insomnia mostram o tempo).

**Resultado esperado**

- Cada resposta em até **1 segundo** em rede local, sem erros (AC-05). Registrar a média e o maior tempo.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-029, seção 7.2.9](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-029.feature) e [suíte de UI](../ui/UI-HU-029.md).
- O limite de 1 segundo do CT-005 é a referência desta suíte para “carregamento rápido” (AC-05), que o requisito não quantifica. Ajustar se o líder definir outro valor.
- O cache offline (AC-03) e a leitura do QR Code (AC-04) são do app e ficam na suíte de UI.
- Restaurar o status dos alunos da PC-03 ao final. Ocultar tokens, fotos e dados pessoais nas evidências.
