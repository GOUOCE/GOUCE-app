# Testes manuais de API — HU-023 — Publicação de Avisos

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Comunicação e Mural de Avisos (EP-007) |
| Funcionalidade | HU-023 — Publicação de Avisos |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, autorização, integridade e validação de campos — baseado em risco |
| Endpoints | `POST /avisos` e `GET /avisos`. Apoio: `GET /avisos/notificacoes` ([HU-024](../../HU-024/api/API-HU-024.md)), `POST /auth/login`, cadastro e aprovação de alunos, `log_auditoria` e migrations. |
| Base do planejamento | `feature/hu-023-publicacao-de-avisos` (commit `5466b1de`, [PR #382](https://github.com/GOUOCE/GOUCE-app/pull/382) fechado sem merge), 345 commits atrás da `develop` `1bc67d02`; **o módulo de avisos ainda não está na `develop`** |
| Branch de planejamento | `test/planejamento-api-ui-hu-023`, com entrega para `develop` |
| Revisão do planejamento | 25/11/2026 — requisitos 7.8 com as decisões do PO ([#539](https://github.com/GOUOCE/GOUCE-app/issues/539), sugestões ⭐), BDD do épico 07 e leitura do código das branches |
| Ambiente | HTTP real `http://127.0.0.1:8130`; Docker `atu-exec-api-hu023`; PostgreSQL 15 em banco novo; Alembic `86_create_avisos` (head única, após renumerar); `America/Fortaleza` |
| Total de casos | 11 |
| Última execução | 25/11/2026 — 11/11 casos concluídos; início cerca de 10h30 (America/Fortaleza) |
| Branch de execução | `test/execucao-api-hu-023`, criada da `develop` atualizada `2e87cccc` |
| Código executado | `develop` `2e87cccc` mais o backend do `feature/hu-023-publicacao-de-avisos` (`5466b1de`), integrado só no ambiente de teste (migration renumerada para `86_create_avisos` e conflitos de `main.py` e `db.py` resolvidos); nenhuma alteração de produto foi commitada |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ❌ Concluída com falhas | 11 | 7 | 3 | 1 | 0 | 0 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | A `develop` ainda **não tem** o módulo de avisos. A execução exige o build integrado: `develop` + `feature/hu-023-publicacao-de-avisos` (e, para a HU-024, `feature/hu-024-mural-aluno-e-notificacoes`), com a migration renumerada. Registrar o SHA exato testado e não executar sobre a branch antiga, 345 commits atrás. |
| PC-02 | API e PostgreSQL reais em stack isolada, com migrations até a head única do build integrado; acesso de leitura às tabelas `aviso` e `log_auditoria`. Não usar `create_all` nem mock no lugar da integração HTTP. [Guia](README.md). |
| PC-03 | Tokens reais por `POST /auth/login`: administradores A1 e A2 (seed `admin@gouce.app` e um segundo), aluno aprovado com vínculo válido, aluno pendente, representante e sem token. Credenciais fora do Git. |
| PC-04 | Conferir no OpenAPI os endpoints `GET /avisos`, `POST /avisos` e, se existirem, edição e inativação (`PATCH/PUT/DELETE /avisos/{id}`); não presumir o caminho. Anotar a contagem de `aviso` e de `log_auditoria` antes de cada caso. |
| PC-05 | Os esperados seguem requisitos 7.8, BDD e decisões do PO (#539, sugestões ⭐ adotadas como regra do épico); os riscos de leitura do [guia da API](README.md) não são defeitos reproduzidos. Edição, inativação e push nativo são lacunas conhecidas: registrar, não aprovar. |

## Contrato de referência

- `POST /avisos` (somente administrador): corpo `{titulo, descricao}` (o alias `conteudo` é aceito no lugar de `descricao`; campos extras são recusados). Título de 3 a 150 e descrição de 3 a 2000 caracteres, com espaços das pontas removidos e espaços repetidos do título reduzidos a um. Resposta 201: `{success, message, data}` com `data` = `{id, titulo, descricao, conteudo, autor_id, data_criacao}`.
- `GET /avisos` (qualquer perfil autenticado): lista do mais recente ao mais antigo; filtro `titulo` (ou `busca`), por contém e sem diferenciar maiúsculas de minúsculas.
- Erros de validação: 422 `REQUEST_VALIDATION_ERROR`, “Requisição inválida”, com `details: [{field, message}]` em português (“Título é obrigatório.”, “O título deve ter pelo menos 3 caracteres.” etc.); 401 `UNAUTHORIZED` e 403 `FORBIDDEN` no mesmo envelope.
- A publicação grava o aviso e, na mesma transação, um registro em `log_auditoria` (ação `CRIAR`, entidade `aviso`); em seguida dispara o evento de notificação da HU-024, e uma falha desse disparo não desfaz a publicação.
- Fora do código lido: edição, inativação (soft delete) e coluna de situação na tabela `aviso` não existem; os requisitos (AC-04, AC-05, FA-002) e o BDD os exigem.

## Resumo da execução

Usar o token de A1, salvo indicação. Conferir cada resposta com o banco em nova conexão e com a contagem de `log_auditoria` antes e depois. Os casos 006 e 007 dependem de recursos que o código lido não tem: registrar a resposta real e não aprovar por leitura.

### Seção A — Publicação e consulta

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU023-API-001 | Publicar um aviso com sucesso | Administrador A1; `POST /avisos` com título “Manutenção na Rota Centro” e descrição “O ônibus V1 passa por manutenção na quinta-feira.”. | 201 com a mensagem do requisito, aviso gravado com o autor correto e visível na lista. | ✅ PASSOU | Risco de leitura: a mensagem do código termina com ponto (“Aviso publicado com sucesso.”) e a resposta repete o texto em `descricao` e `conteudo`. BDD: administrador publica; AC-03. Execução (25/11/2026): 201; mensagem com ponto final. |
| CT-HU023-API-002 | Lista de avisos: ordem e busca por título | Quatro avisos: “Manutenção na Rota Centro”, “manutenção preventiva”, “Greve de ônibus” e “Desconto de 100% no passe_livre”; `GET /avisos`, `?titulo=manut`, `?busca=GREVE`, `?titulo=%`, `?titulo=_` e `?titulo=xyz`. | Ordem do mais recente ao mais antigo; busca por parte do título sem diferenciar maiúsculas; sem resultado devolve lista vazia; `%` e `_` são tratados como texto. | ❌ FALHOU | Risco de leitura: o filtro usa `ilike` sem escapar `%` e `_`, então `?titulo=%` pode devolver todos os avisos; `titulo` prevalece sobre `busca`. BDD: lista de avisos publicados. Execução (25/11/2026): `%` e `_` devolvem todos os avisos. |
| CT-HU023-API-003 | Campos obrigatórios e preenchidos só com espaços | `POST /avisos` sem `titulo`; sem `descricao`; `titulo` nulo, vazio e “   ”; `descricao` vazia e “   ”; `titulo` numérico; corpo `{}`; JSON inválido; campo extra `autor_id`. | 422 por campo com a mensagem em português; só espaços vale como vazio; campo extra recusado; nada gravado. | ✅ PASSOU | BDD: obrigatórios e só espaços; API recusa a publicação sem o campo; FA-001. O campo extra `autor_id` testa a tentativa de forjar o autor. Execução (25/11/2026): 10 variações recusadas; JSON inválido com mensagem em inglês. |
| CT-HU023-API-004 | Valores-limite de título e descrição | Título com 2, 3, 150 e 151 caracteres; descrição com 2, 3, 2000 e 2001; título com espaços repetidos e acentuado (“Aviso   com   espaços   e acentuação ç ã”); texto com emoji. | Recusa abaixo de 3 e acima de 150 e 2000; aceita os limites; a contagem é em caracteres, depois de remover os espaços. | ✅ PASSOU | Risco de leitura: o título tem os espaços repetidos reduzidos antes de contar, então um título de 151 com espaços duplos pode ser aceito; conferir o valor gravado. BDD: valor-limite do título e da descrição. Execução (25/11/2026): limites corretos; título de 151 com espaços duplos aceito. |

### Seção B — Autoria, edição e inativação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU023-API-005 | Autoria e auditoria da publicação | Dois administradores A1 e A2 publicam um aviso cada; uma terceira publicação é recusada por campo inválido. | Autor igual ao usuário do token; um registro de auditoria por publicação; recusa não audita. | ✅ PASSOU | Risco de leitura: o README do BDD diz que a publicação não grava log, mas `AvisoRepository.criar` registra `CRIAR`; conferir o que o banco mostra. Edição e inativação não existem, então só a criação é auditável hoje. Execução (25/11/2026): autor e auditoria `CRIAR` corretos. |
| CT-HU023-API-006 | Editar um aviso publicado | Aviso publicado por A1; edição do título e da descrição pelo endereço descoberto no OpenAPI (ou `PATCH/PUT /avisos/{id}`). | 200, alteração refletida na lista na hora e auditada; mesmas regras de tamanho; só administrador. | ❌ FALHOU | Risco de leitura: não há rota de edição no código lido; a decisão 1 do PO (⭐) manda implementar. Esperado falhar até existir; registrar, não aprovar. BDD: edita o aviso e a alteração aparece; AC-04. Execução (25/11/2026): rota inexistente (404). |
| CT-HU023-API-007 | Inativar um aviso (soft delete) | Aviso ativo; inativação pelo endereço do OpenAPI; id inexistente; inativar duas vezes. | Aviso some da lista na hora, o registro continua no banco com situação inativa e a operação é auditada. | ❌ FALHOU | Risco de leitura: a tabela `aviso` não tem coluna de situação nem rota de exclusão; decisão 1 do PO (⭐). Esperado falhar até existir. BDD: inativa; soft delete mantém o registro; FA-002. Execução (25/11/2026): rota e coluna inexistentes (404). |

### Seção C — Acesso e integridade

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU023-API-008 | Acesso restrito ao administrador (RN-006) | Administrador, aluno aprovado, aluno pendente, representante, token inválido e sem token; `POST /avisos` e `GET /avisos`. | Só o administrador publica (201); aluno e representante recebem 403; sem token 401; nada é gravado nas recusas. | ✅ PASSOU | Risco de leitura: `GET /avisos` usa `verify_any_user`, então qualquer perfil autenticado lê o mural, inclusive aluno pendente. BDD: API nega para quem não é administrador; sem token; RN-006. Execução (25/11/2026): 403 e 401 corretos; pendente e representante leem a lista. |
| CT-HU023-API-009 | Integridade, concorrência e texto especial | 10 publicações simultâneas por A1 e A2; descrição com `<script>`, aspas, quebras de linha e emoji; corpo de cerca de 1 MB. | 10 avisos com ids distintos e 10 auditorias; texto gravado e devolvido sem alteração; corpo gigante recusado sem derrubar a API. | ✅ PASSOU | Risco de leitura: o caso de uso engole qualquer erro do disparo de notificação, então a publicação não depende do push; a escrita do aviso e da auditoria usa uma transação só. Execução (25/11/2026): 10 simultâneas sem duplicidade; corpos grandes recusados. |
| CT-HU023-API-010 | Migration e registro do módulo no build integrado | Build integrado da `develop` com a branch de avisos: `alembic heads`, `upgrade head`, `downgrade -1`, `upgrade head`; OpenAPI. | Head única; tabela `aviso` com colunas, índices e chave estrangeira; os endpoints aparecem no OpenAPI. | ⚠️ PARCIAL | Risco de leitura: `81_create_avisos` e `81_add_updated_at_rotas` têm o mesmo `down_revision` (`80_remove_horarios_agendamento`), o que gera duas heads; `main.py`, `db.py` e `orm_registry.py` também conflitam. Execução (25/11/2026): duas heads no branch original; passa depois de renumerar. |
| CT-HU023-API-011 | Lista com muitos avisos e data de publicação | 200 avisos publicados por script (títulos distintos, descrições de 2000 caracteres); `GET /avisos` sem filtro e com `?titulo=` ; aviso publicado às 23h50 de Fortaleza. | A lista responde completa e em tempo razoável; `data_criacao` traz o fuso e corresponde ao horário de Fortaleza. | ✅ PASSOU | Risco de leitura: `GET /avisos` devolve todos os avisos de uma vez, sem paginação nem limite; a coluna `data_criacao` é gravada em UTC e a tela formata a data. RNF-001 (tempo de resposta). Execução (25/11/2026): 224 avisos em 0,03 s e 796 KB, sem paginação. |

## Detalhamento dos casos

### Seção A — Publicação e consulta

#### CT-HU023-API-001 — Publicar um aviso com sucesso

**Técnica/tipo:** Funcional positivo; integração com persistência.

**Dados de entrada:** Administrador A1; `POST /avisos` com título “Manutenção na Rota Centro” e descrição “O ônibus V1 passa por manutenção na quinta-feira.”.

**Passos**

1. Anotar a contagem de `aviso` e de `log_auditoria`.
2. Enviar o `POST /avisos` com o token de A1.
3. Conferir a resposta e, em nova conexão, a linha criada em `aviso`.
4. Consultar `GET /avisos` com o token de um aluno.

**Resultado esperado**

- HTTP 201, `success` verdadeiro e `message` “Aviso publicado com sucesso” (a diferença de pontuação é registrada).
- `data` traz `id`, `titulo`, `descricao`, `autor_id` igual ao id de A1 e `data_criacao` no fuso correto.
- Uma única linha nova em `aviso`, com o mesmo texto enviado; o aviso aparece no topo da lista do aluno.

**Resultado obtido**

- 201, `success` verdadeiro, `message` “Aviso publicado com sucesso.” (diferença só de pontuação, registrada).
- `data`: `id` 1, `autor_id` 1 (o administrador), `data_criacao` 2026-11-25T10:30:55-03:00, `descricao` e `conteudo` com o mesmo texto.
- Banco em nova conexão: 1 linha em `aviso` e 1 em `log_auditoria`; o aluno aprovado vê o aviso no topo de `GET /avisos`.
- Status: ✅ PASSOU.

---

#### CT-HU023-API-002 — Lista de avisos: ordem e busca por título

**Técnica/tipo:** Partição por filtro; valor especial (curingas de busca).

**Dados de entrada:** Quatro avisos: “Manutenção na Rota Centro”, “manutenção preventiva”, “Greve de ônibus” e “Desconto de 100% no passe_livre”; `GET /avisos`, `?titulo=manut`, `?busca=GREVE`, `?titulo=%`, `?titulo=_` e `?titulo=xyz`.

**Passos**

1. Publicar os quatro avisos em sequência, anotando os ids.
2. Consultar a lista sem filtro e comparar a ordem com `data_criacao` e `id`.
3. Repetir com cada filtro, inclusive com `titulo` e `busca` ao mesmo tempo.
4. Comparar cada resposta com o banco.

**Resultado esperado**

- Sem filtro: 4 avisos do mais recente ao mais antigo.
- `manut` devolve os dois de manutenção; `GREVE` devolve o de greve; `xyz` devolve `[]` com 200.
- `%` e `_` procuram o caractere literal (só o aviso com “100%” e o com “passe_livre”), e não todos os registros.
- Com `titulo` e `busca` juntos vale `titulo`.

**Resultado obtido**

- Sem filtro: 4 avisos do mais recente ao mais antigo. `?titulo=manut`: 2 avisos; `?busca=GREVE`: 1; `?titulo=xyz`: `[]` com 200; `titulo` e `busca` juntos: vale `titulo`.
- ❌ `?titulo=%25` e `?titulo=_` devolveram os 4 avisos (esperado: só o aviso com “100%” e só o com “passe_livre”, tratados como texto).
- Observação: `?titulo=manutencao` (sem acento) devolve `[]`; a busca diferencia acentos.

```json
{
  "requisicao": "GET /avisos?titulo=%25",
  "perfil": "aluno aprovado",
  "esperado": "1 aviso: “Desconto de 100% no passe_livre”",
  "obtido": {
    "status": 200,
    "titulos": [
      "Desconto de 100% no passe_livre",
      "Greve de ônibus",
      "manutenção preventiva",
      "Manutenção na Rota Centro"
    ]
  }
}
```

```json
{
  "requisicao": "GET /avisos?titulo=_",
  "perfil": "aluno aprovado",
  "esperado": "1 aviso: “Desconto de 100% no passe_livre”",
  "obtido": {
    "status": 200,
    "titulos": [
      "Desconto de 100% no passe_livre",
      "Greve de ônibus",
      "manutenção preventiva",
      "Manutenção na Rota Centro"
    ]
  }
}
```
- Status: ❌ FALHOU.

---

#### CT-HU023-API-003 — Campos obrigatórios e preenchidos só com espaços

**Técnica/tipo:** Partição de classes inválidas; tabela de decisão campo × valor.

**Dados de entrada:** `POST /avisos` sem `titulo`; sem `descricao`; `titulo` nulo, vazio e “   ”; `descricao` vazia e “   ”; `titulo` numérico; corpo `{}`; JSON inválido; campo extra `autor_id`.

**Passos**

1. Anotar a contagem de `aviso` e de `log_auditoria`.
2. Enviar cada variação com o token de A1 e registrar status, `code` e `details`.
3. Repetir a contagem ao final.

**Resultado esperado**

- 422 `REQUEST_VALIDATION_ERROR` com `details` por campo: “Título é obrigatório.” e “Descrição é obrigatória.”.
- “   ” é tratado como vazio (mesma mensagem de obrigatório); tipo errado informa “… deve ser um texto válido.”.
- Campo extra recusado (“Campo não permitido.”); JSON inválido responde 422 sem erro 500.
- A contagem de `aviso` e de `log_auditoria` não muda.

**Resultado obtido**

- 422 por campo: “Título é obrigatório.”, “Descrição é obrigatória.”, “Título deve ser um texto válido.” (tipo errado) e “Campo não permitido.” (`autor_id`); só espaços tratado como vazio.
- JSON inválido: 422 com `details: [{field: "1", message: "JSON decode error"}]` (mensagem em inglês; mesmo padrão das #479 e #486, registrado como observação).
- Contagem de `aviso` e de `log_auditoria` igual antes e depois (4 e 4).
- Status: ✅ PASSOU.

---

#### CT-HU023-API-004 — Valores-limite de título e descrição

**Técnica/tipo:** Análise de valor-limite; normalização de texto.

**Dados de entrada:** Título com 2, 3, 150 e 151 caracteres; descrição com 2, 3, 2000 e 2001; título com espaços repetidos e acentuado (“Aviso   com   espaços   e acentuação ç ã”); texto com emoji.

**Passos**

1. Montar os textos com o tamanho exato (conferir com `len`).
2. Enviar cada um e registrar status e mensagem.
3. Para os aceitos, comparar o texto gravado em `aviso` com o enviado.

**Resultado esperado**

- 2 e 151 (título) e 2 e 2001 (descrição) recusados com “O título deve ter pelo menos 3 caracteres.”, “O título deve ter no máximo 150 caracteres.”, “A descrição deve ter pelo menos 3 caracteres.” e “A descrição deve ter no máximo 2000 caracteres.”.
- 3, 150 e 2000 aceitos com 201, sem erro 500 por tamanho de coluna.
- O texto gravado é o normalizado (pontas e espaços repetidos do título) e preserva acentos e emoji.

**Resultado obtido**

- Recusas 422 com “O título deve ter pelo menos 3 caracteres.”, “O título deve ter no máximo 150 caracteres.”, “A descrição deve ter pelo menos 3 caracteres.” e “A descrição deve ter no máximo 2000 caracteres.”.
- 3, 150 (título) e 3, 2000 (descrição) aceitos com 201, sem erro 500; coluna `titulo` com 150.
- Texto com espaços repetidos gravado normalizado (“Aviso com espaços e acentuação ç ã”) e emoji preservado; título bruto de 151 com dois espaços aceito e gravado com 150 caracteres.
- Status: ✅ PASSOU.

---

### Seção B — Autoria, edição e inativação

#### CT-HU023-API-005 — Autoria e auditoria da publicação

**Técnica/tipo:** Rastreabilidade (RNF-013); integridade (RNF-012).

**Dados de entrada:** Dois administradores A1 e A2 publicam um aviso cada; uma terceira publicação é recusada por campo inválido.

**Passos**

1. Anotar a contagem de `log_auditoria`.
2. Publicar como A1 e como A2; provocar uma recusa com título inválido.
3. Comparar `autor_id` de cada aviso e as linhas novas de `log_auditoria` (usuário, ação, entidade, `entidade_id`, valores e timestamp).

**Resultado esperado**

- `autor_id` é o de quem publicou, sem como informar outro.
- Cada publicação aceita gera um registro (`CRIAR`, entidade `aviso`, usuário e data/hora); a recusada não gera nada.
- Aviso e auditoria são gravados juntos: não existe aviso sem registro nem registro sem aviso.

**Resultado obtido**

- `autor_id` 1 e 3 conforme o administrador que publicou; tentativa de informar `autor_id` recusada no CT-003.
- Cada aviso aceito tem um registro (`CRIAR`, entidade `aviso`, `usuario_id`, `entidade_id`, `valor_novo` com o título, `criado_em`); a publicação recusada não alterou nenhuma contagem (12 e 12).
- `valor_anterior` vazio na criação; edição e inativação não existem, então não há outras ações para auditar.
- Status: ✅ PASSOU.

---

#### CT-HU023-API-006 — Editar um aviso publicado

**Técnica/tipo:** Transição de estado; autorização.

**Dados de entrada:** Aviso publicado por A1; edição do título e da descrição pelo endereço descoberto no OpenAPI (ou `PATCH/PUT /avisos/{id}`).

**Passos**

1. Procurar no OpenAPI a rota de edição; se não existir, registrar a resposta de `PATCH` e `PUT` em `/avisos/{id}`.
2. Editar o aviso e consultar a lista com o token de um aluno.
3. Tentar a edição com um token de aluno e sem token.
4. Conferir banco e `log_auditoria`.

**Resultado esperado**

- Aviso atualizado (título e descrição novos) e refletido imediatamente em `GET /avisos`; `autor_id` e `data_criacao` preservados.
- Edição com texto inválido recusada como na publicação; aluno recebe 403 e sem token 401.
- Uma entrada de auditoria da edição, com valor anterior e novo.

**Resultado obtido**

- ❌ `PATCH /avisos/1` e `PUT /avisos/1` com o token do administrador: 404 `{"detail": "Not Found"}`; com token de aluno, o mesmo 404.
- OpenAPI: `/avisos` só tem `get` e `post`. Banco: título do aviso 1 inalterado.

```json
{
  "requisicao": "PATCH /avisos/1",
  "perfil": "administrador",
  "corpo": {
    "titulo": "Título editado",
    "descricao": "Descrição editada"
  },
  "esperado": "200 com o aviso atualizado e auditoria (AC-04)",
  "obtido": {
    "status": 404,
    "corpo": {
      "detail": "Not Found"
    }
  }
}
```
- Status: ❌ FALHOU.

---

#### CT-HU023-API-007 — Inativar um aviso (soft delete)

**Técnica/tipo:** Transição de estado; integridade (RNF-012); partição de ids.

**Dados de entrada:** Aviso ativo; inativação pelo endereço do OpenAPI; id inexistente; inativar duas vezes.

**Passos**

1. Localizar a rota de inativação no OpenAPI e registrar a resposta de `DELETE /avisos/{id}`.
2. Inativar o aviso e consultar `GET /avisos`.
3. Conferir a linha em `aviso` (situação) e `log_auditoria`.
4. Repetir a inativação e usar um id inexistente.

**Resultado esperado**

- O aviso deixa de aparecer em `GET /avisos` imediatamente.
- A linha continua em `aviso`, marcada como inativa, e a operação gera auditoria.
- Inativar de novo ou usar id inexistente responde 404 com mensagem em português; aluno recebe 403.

**Resultado obtido**

- ❌ `DELETE /avisos/1`, `PATCH /avisos/1/inativar` e `DELETE /avisos/99999`: 404 `{"detail": "Not Found"}` (a resposta é a mesma para id existente e inexistente porque a rota não existe).
- Colunas de `aviso`: `id, titulo, descricao, autor_id, data_criacao`; sem situação. O aviso 1 continua listado.

```json
{
  "requisicao": "DELETE /avisos/1",
  "perfil": "administrador",
  "esperado": "aviso deixa de aparecer em GET /avisos e o registro continua no banco marcado como inativo (AC-05)",
  "obtido": {
    "status": 404,
    "corpo": {
      "detail": "Not Found"
    },
    "aviso_na_lista": true
  }
}
```
- Status: ❌ FALHOU.

---

### Seção C — Acesso e integridade

#### CT-HU023-API-008 — Acesso restrito ao administrador (RN-006)

**Técnica/tipo:** Partição por perfil; tabela de decisão perfil × operação.

**Dados de entrada:** Administrador, aluno aprovado, aluno pendente, representante, token inválido e sem token; `POST /avisos` e `GET /avisos`.

**Passos**

1. Obter um token por perfil.
2. Enviar o `POST /avisos` com cada token e sem token.
3. Consultar `GET /avisos` com cada token.
4. Conferir que só a chamada do administrador criou linha.

**Resultado esperado**

- POST: administrador 201; aluno (aprovado e pendente) e representante 403 `FORBIDDEN`; sem token ou inválido 401 `UNAUTHORIZED`.
- As recusas não criam linha em `aviso` nem em `log_auditoria`.
- A leitura da lista por aluno aprovado funciona; registrar o que acontece com o aluno pendente e o representante.

**Resultado obtido**

- POST: administrador 201 (id 13); aluno aprovado, pendente e representante 403 “Acesso negado”; sem token 401 “Não autenticado”; token inválido 401 “Sessão inválida ou expirada”.
- Só 1 aviso “Teste acesso” no banco e contagens 13 e 13.
- GET: 200 para aluno aprovado, pendente e representante; 401 sem token ou com token inválido.
- Status: ✅ PASSOU.

---

#### CT-HU023-API-009 — Integridade, concorrência e texto especial

**Técnica/tipo:** Concorrência; conteúdo malicioso; tamanho do corpo.

**Dados de entrada:** 10 publicações simultâneas por A1 e A2; descrição com `<script>`, aspas, quebras de linha e emoji; corpo de cerca de 1 MB.

**Passos**

1. Disparar as 10 publicações em threads com conexões independentes.
2. Publicar o texto especial e o corpo grande.
3. Comparar as contagens de `aviso` e de `log_auditoria` e o texto gravado.

**Resultado esperado**

- 10 respostas 201, ids distintos, 10 linhas de auditoria, sem 500 nem duplicidade.
- O texto especial é guardado e devolvido como foi enviado (sem executar nem perder caracteres).
- O corpo acima do limite recebe 422 ou 413 sem queda do serviço.

**Resultado obtido**

- 10 × 201, ids distintos, `aviso` e `log_auditoria` de 13 para 23, sem duplicidade nem 500.
- Texto especial devolvido por `GET /avisos` e gravado exatamente como enviado (a exibição é que precisa tratar o HTML; ver UI-005 e UI-007).
- 1 MB e 6 MB: 422 `REQUEST_VALIDATION_ERROR` (“A descrição dev…” — limite de 2000) em menos de 0,2 s; a API continuou respondendo.
- Status: ✅ PASSOU.

---

#### CT-HU023-API-010 — Migration e registro do módulo no build integrado

**Técnica/tipo:** Integração; compatibilidade de versões.

**Dados de entrada:** Build integrado da `develop` com a branch de avisos: `alembic heads`, `upgrade head`, `downgrade -1`, `upgrade head`; OpenAPI.

**Passos**

1. Integrar a branch na `develop` (ou renumerar a migration depois da head atual) e registrar como foi feito.
2. Rodar `alembic heads` e o ciclo `upgrade`/`downgrade`.
3. Conferir a estrutura de `aviso` e a lista de rotas do OpenAPI.
4. Tentar excluir do banco um usuário que seja autor de um aviso.

**Resultado esperado**

- Uma única head; `upgrade` e `downgrade` sem erro.
- `aviso` com `id`, `titulo` (150), `descricao`, `autor_id` (chave estrangeira com `RESTRICT`) e `data_criacao`, com índices em autor e data.
- A exclusão de um autor com avisos é recusada (RN-004); `/avisos` aparece no OpenAPI.

**Resultado obtido**

- ❌ Como o branch está: `alembic heads` lista `81_create_avisos (head)` e `85_repair_orm_timestamp_columns (head)`; `alembic upgrade head` termina com `FAILED: Multiple head revisions are present for given argument 'head'`.
- ✅ Build executado (integrado e renumerado): head única `86_create_avisos`; `downgrade -1` remove `aviso` e `upgrade head` recria com `aviso_pkey`, `ix_aviso_autor_id` e `ix_aviso_data_criacao`; FK `aviso_autor_id_fkey` com `ON DELETE RESTRICT`: `delete from usuario` de um autor falha com “violates foreign key constraint”.
- Conflitos de integração em `main.py` e `db.py` (imports e `include_router`), resolvidos mantendo os dois lados.

```json
{
  "comando": "alembic upgrade head (numeração original do branch)",
  "esperado": "head única e upgrade sem erro",
  "obtido": {
    "heads": [
      "81_create_avisos",
      "85_repair_orm_timestamp_columns"
    ],
    "erro": "Multiple head revisions are present for given argument 'head'; please specify a specific target revision, '<branchname>@head' to narrow to a specific head, or 'heads' for all heads"
  }
}
```
- Status: ⚠️ PARCIAL.

---

#### CT-HU023-API-011 — Lista com muitos avisos e data de publicação

**Técnica/tipo:** Volume; valor-limite de quantidade; fuso horário.

**Dados de entrada:** 200 avisos publicados por script (títulos distintos, descrições de 2000 caracteres); `GET /avisos` sem filtro e com `?titulo=` ; aviso publicado às 23h50 de Fortaleza.

**Passos**

1. Publicar os 200 avisos pela API e anotar o horário de cada um.
2. Consultar `GET /avisos` três vezes e registrar o tempo e o tamanho da resposta.
3. Comparar a contagem e a ordem com o banco.
4. Comparar `data_criacao` do aviso das 23h50 com o horário local (America/Fortaleza) e com o valor gravado.

**Resultado esperado**

- A resposta traz os 200 avisos do mais recente ao mais antigo, sem 500 nem corte silencioso; tempo de até 3 segundos em condições normais.
- Se não houver paginação, o tamanho da resposta e o tempo ficam registrados como risco de crescimento.
- `data_criacao` vem com o fuso (por exemplo `Z` ou `-03:00`) e converte para o dia e a hora corretos em Fortaleza, sem virar o dia errado.

**Resultado obtido**

- 200 publicações com 201; `GET /avisos` ×3: 200, 224 avisos, 796 KB, 0,02 a 0,03 s (local, sem latência de rede).
- Sem paginação nem limite: tamanho proporcional ao número de avisos (risco de crescimento).
- `data_criacao` com o fuso -03:00 e o dia correto perto da meia-noite; depende da configuração de fuso do PostgreSQL.
- Status: ✅ PASSOU.

---

## Rastreabilidade

| Critério/regra | Casos API | Complemento |
| --- | --- | --- |
| AC-01, AC-03 — publicar e autoria | API-001, API-005 | UI-002 |
| AC-02 / FA-001 — obrigatórios e limites | API-003, API-004 | UI-003, UI-004 |
| Lista e busca | API-002 | UI-005, UI-007 |
| AC-04 — editar | API-006 | UI-006 |
| AC-05 / FA-002 — inativar (soft delete) | API-007 | UI-006 |
| AC-06 / RN-006 — acesso do administrador | API-008 | UI-001, UI-008 |
| Volume e data de publicação | API-011 | UI-005, UI-007 |
| RNF-012 / RNF-013 — integridade e auditoria | API-005, API-009, API-010 | — |

## Defeitos encontrados

| Caso | Defeito ou dependência | Issue |
| --- | --- | --- |
| CT-HU023-API-002 | A busca por título trata `%` e `_` como curinga e devolve todos os avisos. | [#546](https://github.com/GOUOCE/GOUCE-app/issues/546) — JSON de falha no corpo |
| CT-HU023-API-006 | Não existe rota para editar aviso (404). | lacuna conhecida: decisão 1 do PO, [#539](https://github.com/GOUOCE/GOUCE-app/issues/539) |
| CT-HU023-API-007 | Não existe rota nem coluna para inativar aviso (404). | lacuna conhecida: decisão 1 do PO, [#539](https://github.com/GOUOCE/GOUCE-app/issues/539) |
| CT-HU023-API-010 | A migration do branch (`81_create_avisos`) gera duas heads com a `develop`; precisa renumerar. | [#547](https://github.com/GOUOCE/GOUCE-app/issues/547) (Bloqueante) — JSON de falha no corpo |

## Observações gerais

- As lacunas conhecidas (edição, inativação, push nativo e alteração de alocação) vêm da [decisão do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539) e estão detalhadas no README do BDD; ficam como casos que tendem a falhar, para o resultado real ficar registrado.
- A numeração `81` da migration de avisos conflita com a `develop`; o ambiente integrado precisa disso resolvido antes do CT-010 e de toda a suíte.
- Referências: [requisitos, seção 7.8](../../../../../docs/requisitos.md), [BDD do épico 07](../../../../../bdd/features/epico-07/README.md) e as [decisões do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539).
- Execução real em 25/11/2026: cadastros, aprovação, promoção e publicações por HTTP (cerca de 313 chamadas, incluindo preparação e logins); banco conferido por consultas em nova conexão; a segunda conta de administrador foi criada promovendo um aluno aprovado. Sem mocks. Evidência registrada somente dos casos que falharam.
