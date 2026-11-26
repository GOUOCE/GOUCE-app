# Testes manuais de API — HU-024 — Recebimento de Notificações Push

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Comunicação e Mural de Avisos (EP-007) |
| Funcionalidade | HU-024 — Recebimento de Notificações Push |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, autorização, resiliência e confiabilidade — baseado em risco |
| Endpoints | `GET /avisos/notificacoes`. Apoio: `POST /avisos` ([HU-023](../../HU-023/api/API-HU-023.md)), distribuição e consulta de alocação (HU-016 e HU-019), `POST /auth/login` e cadastros. |
| Base do planejamento | `feature/hu-024-mural-aluno-e-notificacoes` (commit `e15f398a`, [PR #383](https://github.com/GOUOCE/GOUCE-app/pull/383) fechado sem merge), 345 commits atrás da `develop` `1bc67d02`; **o módulo de avisos ainda não está na `develop`** |
| Branch de planejamento | `test/planejamento-api-ui-hu-024`, com entrega para `develop` |
| Revisão do planejamento | 25/11/2026 — requisitos 7.8 com as decisões do PO ([#539](https://github.com/GOUOCE/GOUCE-app/issues/539), sugestões ⭐), BDD do épico 07 e leitura do código das branches |
| Ambiente | A preencher — API e PostgreSQL reais em stack isolada, URL, SHA do build integrado (`develop` + branch de avisos), fuso America/Fortaleza |
| Total de casos | 9 |
| Última execução | Não realizada |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 9 | 0 | 0 | 0 | 0 | 9 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | O módulo de avisos e o serviço de notificação **não estão na `develop`**. Executar sobre o build integrado `develop` + `feature/hu-023-publicacao-de-avisos` + `feature/hu-024-mural-aluno-e-notificacoes` (a HU-024 contém a HU-023), com a migration renumerada. Registrar o SHA exato; a branch de origem está 345 commits atrás. |
| PC-02 | API e PostgreSQL reais em stack isolada, com migrations até a head única; acesso de leitura a `aviso`, `agendamento`, `alocacao_diaria` e `log_auditoria`. A API deve rodar com **um** processo; para o CT-007 repetir com dois. [Guia](README.md). |
| PC-03 | Tokens reais por `POST /auth/login`: administrador, alunos A e B aprovados com vínculo válido, aluno pendente, aluno reprovado (rejeitado), aluno com vínculo vencido, representante e sem token. Estados pendente, reprovado e vencido por fixture no banco isolado, depois de reservar e alocar como aprovados. Credenciais fora do Git. |
| PC-04 | Para a alteração de alocação (CT-004 e CT-005), usar a massa da HU-016/HU-019: reservas de A e B em D+1, distribuição confirmada e depois uma nova distribuição manual que mude o ônibus de A. |
| PC-05 | Os esperados seguem requisitos 7.8, BDD e decisões do PO (#539, ⭐); os riscos de leitura do [guia da API](README.md) não são defeitos reproduzidos. Push nativo (Firebase/APNs) e alteração de alocação como gatilho são lacunas conhecidas: registrar, não aprovar. |

## Contrato de referência

- `GET /avisos/notificacoes?apos_id=&limite=` (qualquer perfil autenticado): devolve eventos do mais recente ao mais antigo; `apos_id` inteiro maior ou igual a zero; `limite` de 1 a 50 (padrão 10). Item: `{id, tipo, app_nome, titulo, mensagem, aviso_id, data_criacao}`, com `tipo` `aviso` ou `realocacao` e `app_nome` “GOUOCE”.
- Publicar um aviso (HU-023) registra um evento `aviso` cujo `id` é o do aviso e cuja `mensagem` é a descrição. O serviço guarda os eventos **em memória do processo** (no máximo 100) e, enquanto o buffer estiver vazio, completa a resposta com os avisos do banco.
- A mensagem de realocação existe (“Você foi realocado” / “Seu ônibus para hoje é o ônibus X. Toque para ver os detalhes.”), com ids a partir de 1.000.001, mas **nenhum código chama** `disparar_realocacao_onibus`.
- Não há destinatário no evento: a consulta devolve os mesmos eventos a qualquer perfil autenticado. O aplicativo do aluno consulta a cada 5 segundos, com `limite` 5, e filtra no cliente (ignora só o status “pendente”).
- Não há integração com Firebase ou APNs nem cadastro do token do dispositivo; o aplicativo mostra uma notificação **local** com o aplicativo aberto.

## Resumo da execução

Usar o token indicado em cada caso e conferir o banco em nova conexão. Os casos 003, 004, 005 e 009 dependem de recursos que o código lido não tem; registrar a resposta real e não aprovar por leitura.

### Seção A — Disparo

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU024-API-001 | Publicar um aviso gera o evento de notificação | Administrador publica “Manutenção na Rota Centro”; aluno A consulta `GET /avisos/notificacoes` antes e depois. | Um evento `aviso` novo, com título, mensagem, `aviso_id` e `app_nome` corretos, sem duplicar. | ⏳ PENDENTE | BDD: aviso publicado dispara a notificação; AC-01. Risco de leitura: o evento vive em memória do processo. |
| CT-HU024-API-002 | Destinatários do aviso: só alunos aprovados com vínculo válido | Aluno aprovado com vínculo válido, aluno pendente, aluno reprovado, aluno com vínculo vencido, representante, administrador e sem token; aviso publicado; `GET /avisos/notificacoes` com cada token. | Só o aluno aprovado com vínculo válido recebe o evento; pendente, reprovado e vencido não. | ⏳ PENDENTE | Decisão 6 do PO (⭐). Risco de leitura: `verify_any_user` entrega o evento a qualquer perfil autenticado e a exclusão do “pendente” é só no cliente. Esperado falhar até haver filtro no servidor. |
| CT-HU024-API-003 | Editar ou inativar um aviso não notifica de novo | Aviso publicado e notificado; edição e inativação pelos endereços do OpenAPI (HU-023). | Os eventos não aumentam depois da edição ou da inativação. | ⏳ PENDENTE | Decisão 7 do PO (⭐). Depende da edição e da inativação (HU-023, CT-006 e CT-007), que o código lido não tem; sem elas o caso fica bloqueado. |
| CT-HU024-API-004 | Alteração de alocação notifica somente o aluno afetado | Alunos A e B alocados em D+1; nova distribuição manual muda o ônibus de A; consultas de A e de B em `/avisos/notificacoes`. | A recebe “Você foi realocado” com o ônibus novo; B não recebe nada. | ⏳ PENDENTE | AC-01, AC-03 e AC-06; decisão 4 do PO (⭐). Risco de leitura: `disparar_realocacao_onibus` não é chamado por nenhuma alteração e o evento não tem destinatário (seria global). Esperado falhar. |
| CT-HU024-API-005 | Dados da notificação sempre atualizados (RN-009) | A realocado duas vezes em sequência (V1 → V3 → V2); evento e `minha-viagem` depois de cada troca. | Cada troca gera a sua notificação e o ônibus citado é sempre o mais recente, igual ao da consulta de alocação. | ⏳ PENDENTE | Depende do CT-004; sem gatilho de realocação o caso fica bloqueado. BDD: dados atualizados; AC-06 e RN-009. |

### Seção B — Consulta, infraestrutura e entrega

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU024-API-006 | Cursor `apos_id`, limite e validação dos parâmetros | `apos_id` ausente, 0, id de aviso, -1, “abc” e 1,5; `limite` 0, 1, 10, 50 e 51; 7 avisos publicados. | Parâmetros inválidos recusados em português; `apos_id` devolve só eventos posteriores; limite respeitado e ordem do mais novo ao mais antigo. | ⏳ PENDENTE | Risco de leitura: os ids de realocação começam em 1.000.001 e usam o mesmo cursor dos avisos; depois de um evento de realocação o cliente passaria `apos_id` enorme e **nenhum aviso novo (id pequeno) voltaria**. Não é reproduzível por HTTP enquanto a realocação não disparar; cobrir pelo teste unitário do serviço. |
| CT-HU024-API-007 | Buffer em memória: capacidade, reinício e vários processos | 105 avisos publicados em sequência; reinício do serviço da API; repetir com a API em dois processos (`--workers 2`). | Nenhum aviso se perde nem duplica no reinício; com dois processos, a resposta não depende de qual processo atende. | ⏳ PENDENTE | Risco de leitura: `NotificacaoPushService` guarda `deque(maxlen=100)` na classe; enquanto o buffer tem algo, a resposta ignora o banco; cada processo tem o seu buffer. RNF-014 (confiabilidade). |
| CT-HU024-API-008 | Acesso e erros da consulta de notificações | Sem token, token inválido, token expirado, administrador, representante e aluno aprovado em `GET /avisos/notificacoes`. | Sem token ou token inválido recebem 401; perfis autenticados seguem a regra de destinatários. | ⏳ PENDENTE | BDD: acesso por perfil; relaciona-se ao CT-002. |
| CT-HU024-API-009 | Push nativo e retenção com o aparelho offline | Aviso publicado com o aparelho do aluno offline; busca no OpenAPI e no banco de endpoint e tabela para o token do dispositivo e de integração com Firebase ou APNs. | A API cadastra o token do dispositivo, envia ao serviço de mensageria e este retém a notificação até o aparelho voltar. | ⏳ PENDENTE | AC-02, AC-04, FA-001 e RNF-014; decisão 3 do PO (⭐). Risco de leitura: não há Firebase, APNs nem token de dispositivo; o aplicativo só consulta a API com o app aberto. Esperado falhar; registrar a ausência, não aprovar. |

## Detalhamento dos casos

### Seção A — Disparo

#### CT-HU024-API-001 — Publicar um aviso gera o evento de notificação

**Técnica/tipo:** Integração HU-023 × HU-024; conferência de contrato.

**Dados de entrada:** Administrador publica “Manutenção na Rota Centro”; aluno A consulta `GET /avisos/notificacoes` antes e depois.

**Passos**

1. Consultar `/avisos/notificacoes` com o token de A e anotar o último `id`.
2. Publicar o aviso como administrador.
3. Consultar de novo com `apos_id` igual ao último `id` e sem `apos_id`.
4. Comparar o evento com a linha de `aviso`.

**Resultado esperado**

- Aparece um evento `tipo` `aviso`, `id` e `aviso_id` iguais ao do aviso, `titulo` igual, `mensagem` igual à descrição, `app_nome` “GOUOCE” e `data_criacao` correta.
- Com `apos_id`, só o evento novo volta; sem `apos_id`, a lista traz o evento uma única vez.
- Publicar duas vezes seguidas gera dois eventos distintos.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-API-002 — Destinatários do aviso: só alunos aprovados com vínculo válido

**Técnica/tipo:** Partição por perfil e por situação do cadastro.

**Dados de entrada:** Aluno aprovado com vínculo válido, aluno pendente, aluno reprovado, aluno com vínculo vencido, representante, administrador e sem token; aviso publicado; `GET /avisos/notificacoes` com cada token.

**Passos**

1. Preparar os perfis e os estados por fixture no banco isolado.
2. Publicar o aviso.
3. Consultar `/avisos/notificacoes` com cada token e registrar o status e a lista.
4. Comparar com a regra de destinatários.

**Resultado esperado**

- O aluno aprovado com vínculo válido recebe o evento.
- Pendente, reprovado e vínculo vencido não recebem (403 ou lista vazia, conforme o padrão adotado).
- Registrar o que o representante e o administrador recebem; sem token 401.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-API-003 — Editar ou inativar um aviso não notifica de novo

**Técnica/tipo:** Contagem de eventos antes e depois; dependência da HU-023.

**Dados de entrada:** Aviso publicado e notificado; edição e inativação pelos endereços do OpenAPI (HU-023).

**Passos**

1. Registrar os eventos do aviso.
2. Editar o aviso e depois inativá-lo.
3. Consultar `/avisos/notificacoes` com `apos_id` do último evento.
4. Comparar a contagem.

**Resultado esperado**

- Nenhum evento novo depois da edição nem da inativação.
- Se a edição ou a inativação não existirem, registrar a dependência e não aprovar.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-API-004 — Alteração de alocação notifica somente o aluno afetado

**Técnica/tipo:** Integração HU-016 × HU-024; privacidade entre alunos.

**Dados de entrada:** Alunos A e B alocados em D+1; nova distribuição manual muda o ônibus de A; consultas de A e de B em `/avisos/notificacoes`.

**Passos**

1. Confirmar a distribuição de D+1 e anotar o ônibus de A e de B.
2. Confirmar uma nova distribuição manual que troque o ônibus de A.
3. Consultar `/avisos/notificacoes` com A e com B.
4. Comparar com `minha-viagem` de A.

**Resultado esperado**

- Evento `realocacao` para A: título “Você foi realocado” e mensagem com o ônibus novo.
- B não recebe esse evento.
- Se nenhum evento for gerado, registrar a lacuna do gatilho.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-API-005 — Dados da notificação sempre atualizados (RN-009)

**Técnica/tipo:** Transição de estado; consistência entre fontes.

**Dados de entrada:** A realocado duas vezes em sequência (V1 → V3 → V2); evento e `minha-viagem` depois de cada troca.

**Passos**

1. Realocar A para o V3 e depois para o V2, com a distribuição manual.
2. Consultar eventos e `minha-viagem` depois de cada troca.
3. Comparar o ônibus citado com o da consulta.

**Resultado esperado**

- Duas notificações, uma por troca, a segunda citando o V2.
- O ônibus do último evento é o mesmo de `minha-viagem`.
- Sem gatilho, registrar o bloqueio.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Consulta, infraestrutura e entrega

#### CT-HU024-API-006 — Cursor `apos_id`, limite e validação dos parâmetros

**Técnica/tipo:** Análise de valor-limite; tabela de decisão; ordenação.

**Dados de entrada:** `apos_id` ausente, 0, id de aviso, -1, “abc” e 1,5; `limite` 0, 1, 10, 50 e 51; 7 avisos publicados.

**Passos**

1. Publicar os 7 avisos e anotar os ids.
2. Consultar cada combinação de parâmetros e registrar status, mensagem e itens.
3. Conferir a ordem e o corte do limite.
4. Rodar o teste unitário do serviço com um evento de realocação seguido de um aviso novo e registrar o resultado.

**Resultado esperado**

- `apos_id` negativo ou não numérico e `limite` fora de 1 a 50 recusados com 422 e mensagem em português.
- `apos_id` devolve só os eventos com id maior; `limite` corta a lista; ordem do mais novo ao mais antigo.
- Um aviso publicado depois de um evento de realocação continua sendo entregue ao cliente que já viu a realocação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-API-007 — Buffer em memória: capacidade, reinício e vários processos

**Técnica/tipo:** Resiliência; partição por estado do buffer.

**Dados de entrada:** 105 avisos publicados em sequência; reinício do serviço da API; repetir com a API em dois processos (`--workers 2`).

**Passos**

1. Publicar 105 avisos e consultar com `limite=50` e `apos_id` variados.
2. Reiniciar a API e consultar de novo, comparando com o banco.
3. Subir a API com dois processos, publicar e consultar várias vezes seguidas, registrando as variações.

**Resultado esperado**

- Depois de 105 avisos, os eventos retornados batem com os 50 avisos mais recentes do banco.
- Depois do reinício, a consulta reconstrói os eventos a partir do banco, sem perder nem duplicar avisos.
- Com dois processos, todas as consultas devolvem o mesmo resultado.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-API-008 — Acesso e erros da consulta de notificações

**Técnica/tipo:** Partição por perfil; envelope de erro.

**Dados de entrada:** Sem token, token inválido, token expirado, administrador, representante e aluno aprovado em `GET /avisos/notificacoes`.

**Passos**

1. Consultar com cada token e sem token.
2. Registrar status, `code` e mensagem de cada resposta.
3. Conferir que nenhuma consulta altera o banco.

**Resultado esperado**

- 401 `UNAUTHORIZED` com mensagem em português para token ausente, inválido ou expirado.
- Os perfis autenticados recebem o que a regra de destinatários definir.
- A consulta é só leitura.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU024-API-009 — Push nativo e retenção com o aparelho offline

**Técnica/tipo:** Verificação de existência de recurso; lacuna conhecida.

**Dados de entrada:** Aviso publicado com o aparelho do aluno offline; busca no OpenAPI e no banco de endpoint e tabela para o token do dispositivo e de integração com Firebase ou APNs.

**Passos**

1. Procurar no OpenAPI um endpoint para registrar o token do dispositivo e verificar se existe tabela correspondente.
2. Procurar no código e no ambiente a configuração de Firebase ou APNs.
3. Publicar um aviso com o aparelho offline e, depois, ligá-lo, registrando o que chega.

**Resultado esperado**

- Existe cadastro do token do dispositivo por aluno e o envio é feito ao serviço de mensageria (Firebase ou APNs).
- Com o aparelho offline, o serviço retém a mensagem e a entrega quando a conexão volta.
- Sem essas peças, registrar a lacuna.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos API | Complemento |
| --- | --- | --- |
| AC-01 — aviso e alteração de alocação disparam | API-001, API-004 | UI-002, UI-004 |
| Edição e inativação não notificam | API-003 | UI-009 |
| Destinatários (decisão 6) | API-002, API-008 | UI-008 |
| AC-02, AC-04 / FA-001 — push, app fechado e offline | API-009 | UI-005, UI-006 |
| AC-06 / RN-009 — dados atualizados | API-005 | UI-004 |
| RNF-014 — confiabilidade | API-006, API-007, API-009 | UI-009 |

## Defeitos encontrados

| Caso | Defeito ou dependência | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](../api/README.md) e não são defeitos reproduzidos. | — |

## Observações gerais

- As lacunas conhecidas (push nativo, gatilho de realocação, filtro de destinatários no servidor) vêm da [decisão do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539) e estão detalhadas no README do BDD; ficam como casos que tendem a falhar, para o resultado real ficar registrado.
- O ambiente integrado precisa da migration de avisos renumerada, como descrito na [suíte da HU-023](../../HU-023/api/API-HU-023.md).
- Referências: [requisitos, seção 7.8](../../../../../docs/requisitos.md), [BDD do épico 07](../../../../../bdd/features/epico-07/README.md) e as [decisões do PO na #539](https://github.com/GOUOCE/GOUCE-app/issues/539).
- Nenhum caso foi executado nesta entrega; a leitura do código não aprova caso.
