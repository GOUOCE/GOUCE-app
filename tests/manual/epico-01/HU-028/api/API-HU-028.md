# Testes manuais de API — HU-028 — Renovação de Vínculo Institucional

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Autenticação e Gestão de Conta |
| Funcionalidade | HU-028 — Renovação de Vínculo Institucional |
| Camada | API |
| Tipo de teste | Funcional manual — suíte essencial |
| Endpoints | `POST /alunos/renovar-vinculo` — `multipart/form-data`, com token de aluno; apoio: `POST /auth/login`, `GET /usuarios/me` e `GET /usuarios/alunos?status=` (administrador) |
| Ambiente | A preencher — URL e commit testado |
| Total de casos | 6 |
| Última execução | Não realizada |
| Testador | A definir |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 6 | 0 | 0 | 6 |

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

Executar na ordem abaixo. São **6 casos essenciais**. O CT-001 muda o status do aluno A para `analise_renovacao`; os casos 002 e 003 usam um aluno aprovado que ainda não renovou (o aluno A antes do CT-001, ou outro).

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU028-API-001 | Renovação válida | Corpo base + `comprovante.pdf` (2 MB) | HTTP 200; status `analise_renovacao`; aluno na fila do administrador | ⏳ PENDENTE | Não executado. |
| CT-HU028-API-002 | Renovação sem comprovante | Corpo base sem `comprovante_matricula` | HTTP 422 indicando o comprovante obrigatório; status inalterado | ⏳ PENDENTE | Não executado. |
| CT-HU028-API-003 | Arquivo inválido | `comprovante.docx`; `comprovante-grande.pdf` (8 MB) | HTTP 422 “Formato inválido” e “Arquivo excede o limite de tamanho” | ⏳ PENDENTE | Não executado. |
| CT-HU028-API-004 | Aluno com vínculo vencido consegue renovar | Login do aluno V; renovação válida | Login permitido para renovar (AC-01); renovação aceita | ⏳ PENDENTE | Não executado. |
| CT-HU028-API-005 | Acesso sem permissão | Sem token; token de administrador; aluno rejeitado | HTTP 401; 403; 403 | ⏳ PENDENTE | Não executado. |
| CT-HU028-API-006 | Efeitos do status “Em análise” | Aluno A após o CT-001 | Login permitido; carteirinha bloqueada (403) | ⏳ PENDENTE | Não executado. |

## Detalhamento dos casos

### CT-HU028-API-001 — Renovação válida

**Dados de entrada:** corpo base (PC-05) com `comprovante_matricula = comprovante.pdf` (~2 MB), token do aluno A.

**Passos**

1. Enviar `POST /alunos/renovar-vinculo`.
2. Conferir o status em `GET /usuarios/me` (token do aluno A).
3. Com o token do administrador, chamar `GET /usuarios/alunos?status=analise_renovacao`.

**Resultado esperado**

- HTTP `200` com `aluno_id` e `status_cadastro: "analise_renovacao"` (AC-05).
- `GET /usuarios/me` mostra o novo status e o novo comprovante vinculado.
- O aluno A aparece na listagem do administrador filtrada por `analise_renovacao` (fila de análise).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU028-API-002 — Renovação sem comprovante

**Dados de entrada:** corpo base sem o campo `comprovante_matricula`.

**Passos**

1. Enviar `POST /alunos/renovar-vinculo`.
2. Conferir o status do aluno em `GET /usuarios/me`.

**Resultado esperado**

- HTTP `422`, `error.code: "REQUEST_VALIDATION_ERROR"`, com detalhe no campo `comprovante_matricula` em português (AC-02).
- Status do aluno inalterado (continua `ativado`).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU028-API-004 — Aluno com vínculo vencido consegue renovar

**Dados de entrada:** aluno V (PC-03); corpo base com os dados dele e `comprovante.pdf`.

**Passos**

1. Enviar `POST /auth/login` com as credenciais do aluno V.
2. Se o login for aceito, enviar `POST /alunos/renovar-vinculo` com o token obtido.

**Resultado esperado**

- O login é permitido para que o aluno possa renovar: o AC-01 prevê que o aluno com vínculo vencido “faz login e visualiza um aviso destacado de necessidade de renovação” (RN-013).
- A renovação é aceita (HTTP `200`, status `analise_renovacao`).
- Se o login for recusado (ex.: “A validade de acesso da sua conta expirou”), registrar como falha: o aluno com vínculo vencido não consegue chegar à renovação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### CT-HU028-API-005 — Acesso sem permissão

**Dados de entrada:** corpo base válido, enviado: sem o cabeçalho `Authorization`; com token de administrador; com token de um aluno com status `rejeitado` (se existir).

**Passos**

1. Enviar `POST /alunos/renovar-vinculo` em cada situação.

**Resultado esperado**

- Sem token: HTTP `401`.
- Token de administrador: HTTP `403` (rota exclusiva do aluno).
- Aluno rejeitado: HTTP `403` (o rejeitado tem fluxo próprio de reenvio de documentos).
- Nenhum dado alterado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

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

- Não executado.
- Status: ⏳ Pendente.

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. | — |

## Observações gerais

- Referências: [HU-028, seção 7.2.8](../../../../../docs/requisitos.md), [cenários BDD](../../../../../bdd/features/epico-01/HU-028.feature) e [suíte de UI](../ui/UI-HU-028.md).
- Divergência de escopo: o requisito fala apenas em enviar o comprovante de matrícula, mas a API exige reenviar todos os dados das etapas 2 e 3 do cadastro (perfil demográfico, contato e vínculo). Registrar e levar ao líder.
- Ponto de atenção do CT-004: no código atual, o login recusa contas com `validade_acesso` vencida (“A validade de acesso da sua conta expirou”), o que impediria o aluno de chegar à renovação.
- A aprovação ou recusa da renovação pelo administrador pertence à HU-027 e fica fora desta suíte.
- Restaurar o status e a validade dos alunos A e V ao final (pelo administrador ou pelo banco local), registrando a restauração. Ocultar tokens e dados pessoais nas evidências.
