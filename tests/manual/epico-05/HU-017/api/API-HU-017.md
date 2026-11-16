# Testes manuais de API — HU-017 — Alocação de Motoristas às Rotas

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-017 — Alocação de Motoristas às Rotas |
| Camada | API |
| Tipo de teste | Funcional manual essencial, integração, integridade, auditoria e autorização — baseado em risco |
| Endpoints | `POST /alocacao-diaria/distribuicao` (a escala é gravada junto da distribuição), `GET /motoristas`, `PATCH /motoristas/{id}/inativar` e `/reativar`. Apoio: HU-016 (distribuição), cadastros de frota e rotas, tabela `log_auditoria`. |
| Base do planejamento | `develop` `1eb2818d` (módulos `alocacao_diaria` e `motoristas`) |
| Branch de planejamento | `test/planejamento-api-ui-hu-017`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | A preencher — URL, SHA testado, banco e fuso; base analisada `develop` `1eb2818d`, PostgreSQL 15, Alembic `82_updated_at_faculdade_ponto`, `America/Fortaleza` |
| Total de casos | 10 |
| Última execução | Não realizada |
| Testador | LLM — execução de API; Cauan Ricardo — revisão |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 10 | 0 | 0 | 0 | 0 | 10 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | API e PostgreSQL reais em stack isolada, com as migrations da `develop` até `82_updated_at_faculdade_ponto` (head única). Registrar URL, SHA, data/fuso e acesso de leitura às tabelas `alocacao_diaria`, `alocacao_aluno`, `agendamento` e `log_auditoria`. Não usar `create_all` nem mock no lugar da integração HTTP. [Guia](README.md). |
| PC-02 | Tokens reais: administrador (seed `admin@gouce.app`); alunos A a F aprovados e com vínculo válido; representante R1 da UFC e R2 da IFCE; aluno pendente ou reprovado e representante inativo para os casos de acesso. Credenciais fora do Git. |
| PC-03 | Cadastros pela API administrativa: IES UFC e IFCE; bairros/pontos; **P1 Rota Centro - UFC** (06:30/17:30, atende UFC na ida e na volta) e **P2 Rota Campo - IFCE** (06:40/18:40, atende IFCE). Frota e escala: ônibus **V1 `ABC1D23`** (3 assentos e 2 em pé), **V2 `DEF4G56`** (2 assentos e 1 em pé), **V3 `HIJ7K89`** (4 assentos e 0 em pé) e **V4** inativo; motoristas **M1, M2, M3** ativos e **M4** inativo. |
| PC-04 | D = data local do servidor; anotar hora e fuso. Usar dias úteis válidos dentro da janela de agendamento (D+1 em diante) e registrar ids/datas reais; as datas fixas do BDD são exemplos. Sem alterar o relógio do host. |
| PC-05 | A distribuição automática considera **todos** os ônibus e motoristas ativos do sistema (e só usa tantos ônibus quantos forem os motoristas ativos). Para controlar o cenário, ativar/inativar ônibus e motoristas pela API administrativa (`PATCH /onibus/{placa}/inativar` e `/reativar`, `PATCH /motoristas/{id}/inativar` e `/reativar`) e devolver a frota ao estado base ao fim de cada caso. |
| PC-06 | A escala é gravada junto da distribuição do dia: cada caso monta o payload manual completo da data (rotas, ônibus, motoristas, turnos e alunos conforme a HU-016). Reservas ativas em D+1 em P1 e P2 preparadas pela HU-013 e ids registrados. |
| PC-07 | Anotar a contagem de `log_auditoria` antes do CT-007 e devolver motoristas e ônibus ao estado base ao fim de cada caso. |

## Contrato de referência

- Não há endpoint separado de escala: o vínculo motorista–ônibus–rota–data–turno vai em `alocacoes[]` do `POST /alocacao-diaria/distribuicao` (`motorista_id`, `onibus_id`, `rota_id`, `turno`).
- Recusas: 422 para motorista/ônibus/rota inexistente ou inativo e 409 para motorista (ou ônibus) repetido no mesmo dia e turno; a mensagem atual é “alocação N: motorista X conflitante no turno ida.”.
- Lista de motoristas: `GET /motoristas` (administrador), `incluir_inativos` falso por padrão.
- Banco: `alocacao_diaria` única por data, motorista e turno; auditoria em `log_auditoria` (`usuario_id`, `acao`, `entidade`, `entidade_id`, `valor_anterior`, `valor_novo`, `criado_em`).

## Resumo da execução

Todas as chamadas usam o token do administrador, salvo indicação. A escala só existe junto da distribuição do dia; conferir sempre o banco em nova conexão.

### Seção A — Escala e lista de motoristas

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-API-001 | Confirmar a escala e persistir o vínculo motorista–ônibus–rota–data | Reservas em D+1 em P1 (ida e volta) e P2 (ida); POST `/alocacao-diaria/distribuicao` `modo: manual` com M1 em V1 para P1 (ida) e M2 em V2 para P2 (ida). | 201 com a mensagem de escala confirmada; vínculo gravado com motorista, ônibus, rota, data e turno. | ⏳ PENDENTE | Risco de leitura: a API responde “Distribuição realizada com sucesso”. BDD: escala; persistência. |
| CT-HU017-API-002 | Lista de motoristas disponíveis: só ativos | GET `/motoristas` (administrador) com M1 a M3 ativos e M4 inativo; depois M2 inativado e M4 reativado. | Lista com apenas ativos; mudança de situação reflete na lista. | ⏳ PENDENTE | BDD: lista de motoristas disponíveis; inativo fora da lista; AC-03 e FA-002. |
| CT-HU017-API-003 | Campos obrigatórios e tipos na escala | POST manual sem `motorista_id`, com `motorista_id` 0 e texto, sem `onibus_id`, com `onibus_id` de 21 caracteres, sem `rota_id`, `turno` inválido e `modo` inválido. | 422 de validação em cada variação; nada gravado. | ⏳ PENDENTE | BDD: sistema bloqueia a confirmação quando falta o campo. |

### Seção B — Conflitos e revalidação

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-API-004 | Conflito: mesmo motorista em duas rotas no mesmo turno | POST manual com M1 em V1 para P1 e M1 em V2 para P2, ambos no turno da ida da mesma data; depois só um vínculo (controle). | 409 com a mensagem do requisito; nada gravado; escala anterior preservada. | ⏳ PENDENTE | Risco de leitura: o texto do código difere do requisito. BDD: conflito; AC-05 e FA-001. |
| CT-HU017-API-005 | Mesmo motorista na ida e na volta | POST manual com M1 em V1 para P1 na ida e M1 em V1 para P1 na volta, no mesmo dia. | 201; as duas linhas gravadas. | ⏳ PENDENTE | BDD: API aceita o mesmo motorista na ida e na volta. |
| CT-HU017-API-006 | Revalidação: motorista inativado depois de exibido | M2 listado como ativo; M2 inativado pela API; POST manual com M2 em P1; depois motorista inexistente (id 999999). | 422 com “motorista inexistente ou inativo”; nada gravado. | ⏳ PENDENTE | BDD: recusa a confirmação de motorista inativado depois de exibido; AC-06. |

### Seção C — Auditoria, integridade e acesso

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-API-007 | Auditoria da confirmação da escala | Confirmar uma escala (CT-001) e consultar `log_auditoria` por usuário, ação, entidade e data/hora; repetir a confirmação do mesmo dia. | Registro de auditoria com usuário, ação, dados e data/hora para cada confirmação. | ⏳ PENDENTE | Risco de leitura: o módulo de alocação não grava `log_auditoria`. BDD: auditoria da escala. |
| CT-HU017-API-008 | Inativar motorista com escala futura é bloqueado | M1 escalado em D+1 (CT-001); `PATCH /motoristas/{id}/inativar` para M1; para M3 sem escala; para um motorista só com escala em dia passado. | Bloqueio com a mensagem de alocações pendentes para escala futura; permitido nos demais. | ⏳ PENDENTE | Risco de leitura: a verificação de escalas futuras do cadastro de motoristas devolve sempre falso. HU-010, AC-06. |
| CT-HU017-API-009 | Confirmações simultâneas do mesmo motorista | Duas confirmações manuais simultâneas para a mesma data, ambas com M1 no turno da ida em ônibus diferentes. | Sem duplicidade e sem erro 500: uma aceita e a outra recusada, ou a última substitui a primeira de forma consistente. | ⏳ PENDENTE | Risco de leitura: a recusa final depende das restrições únicas do banco, sem tratamento específico. |
| CT-HU017-API-010 | Autenticação e perfis sem acesso | POST de escala e GET `/motoristas` sem token, com token inválido, aluno, representante e administrador (controle). | 401 sem credencial válida; 403 para aluno e representante; administrador com acesso; nada gravado. | ⏳ PENDENTE | BDD: API nega a escala sem perfil administrativo. |

## Detalhamento dos casos

### Seção A — Escala e lista de motoristas

#### CT-HU017-API-001 — Confirmar a escala e persistir o vínculo motorista–ônibus–rota–data

**Técnica/tipo:** Integração e persistência; verificação direta no banco.

**Dados de entrada:** Reservas em D+1 em P1 (ida e volta) e P2 (ida); POST `/alocacao-diaria/distribuicao` `modo: manual` com M1 em V1 para P1 (ida) e M2 em V2 para P2 (ida).

**Passos**

1. Montar o payload manual do dia com os dois vínculos e enviar com o token do administrador.
2. Guardar HTTP e corpo e comparar com `alocacao_diaria` em nova conexão.
3. Conferir que as outras datas e os agendamentos não mudaram.

**Resultado esperado**

- HTTP 201 com a mensagem “Escala de motoristas confirmada com sucesso” (requisito, AC-07).
- `alocacao_diaria` tem uma linha por vínculo com `motorista_id`, `onibus_id`, `rota_id`, `data` e `turno` corretos.
- Somente a data enviada é alterada; os agendamentos continuam ATIVOS.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-API-002 — Lista de motoristas disponíveis: só ativos

**Técnica/tipo:** Partição ativo/inativo; transição de estado (inativar → reativar).

**Dados de entrada:** GET `/motoristas` (administrador) com M1 a M3 ativos e M4 inativo; depois M2 inativado e M4 reativado.

**Passos**

1. Consultar `/motoristas` sem `incluir_inativos` e conferir ids e situação.
2. Consultar com `incluir_inativos=true` para comparar.
3. Inativar M2 e reativar M4, consultar de novo e devolver ao estado base.

**Resultado esperado**

- Sem `incluir_inativos`, a resposta traz somente motoristas ativos (M1, M2 e M3) e não traz M4.
- Com `incluir_inativos=true`, M4 aparece como inativo.
- Depois da mudança, a lista acompanha a situação real (M2 sai; M4 entra).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-API-003 — Campos obrigatórios e tipos na escala

**Técnica/tipo:** Partição de entradas válidas e inválidas; validação de contrato.

**Dados de entrada:** POST manual sem `motorista_id`, com `motorista_id` 0 e texto, sem `onibus_id`, com `onibus_id` de 21 caracteres, sem `rota_id`, `turno` inválido e `modo` inválido.

**Passos**

1. Partir de um payload válido e remover/alterar um campo por vez.
2. Enviar cada variação e guardar HTTP e corpo.
3. Conferir que `alocacao_diaria` não mudou.

**Resultado esperado**

- 422 indicando o campo inválido ou ausente em cada variação.
- Nenhuma alocação é criada nem alterada; a escala já confirmada continua igual.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Conflitos e revalidação

#### CT-HU017-API-004 — Conflito: mesmo motorista em duas rotas no mesmo turno

**Técnica/tipo:** Tabela de decisão motorista × rota × turno (RN-002); funcional negativo.

**Dados de entrada:** POST manual com M1 em V1 para P1 e M1 em V2 para P2, ambos no turno da ida da mesma data; depois só um vínculo (controle).

**Passos**

1. Confirmar uma escala válida do dia e anotar as linhas.
2. Enviar o payload com M1 repetido no mesmo turno e guardar HTTP e corpo.
3. Comparar o banco com a escala anterior.

**Resultado esperado**

- HTTP 409 com a mensagem “Este motorista já está escalado para outra rota neste horário” (decisão do PO na #465, AC-05).
- Nenhuma linha é gravada e a escala confirmada antes permanece idêntica.
- Com M1 em apenas um vínculo, a confirmação funciona (controle).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-API-005 — Mesmo motorista na ida e na volta

**Técnica/tipo:** Tabela de decisão por turno (RN-002); funcional positivo.

**Dados de entrada:** POST manual com M1 em V1 para P1 na ida e M1 em V1 para P1 na volta, no mesmo dia.

**Passos**

1. Enviar o payload com o mesmo motorista nos dois turnos.
2. Conferir as duas linhas em `alocacao_diaria` e a ausência de conflito.

**Resultado esperado**

- HTTP 201: o mesmo motorista atende a ida e a volta do mesmo dia (AC-08).
- Duas linhas em `alocacao_diaria`, uma por turno, com o mesmo `motorista_id`.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-API-006 — Revalidação: motorista inativado depois de exibido

**Técnica/tipo:** Transição de estado (ativo → inativo) entre listar e confirmar; segurança da regra.

**Dados de entrada:** M2 listado como ativo; M2 inativado pela API; POST manual com M2 em P1; depois motorista inexistente (id 999999).

**Passos**

1. Listar os motoristas e guardar M2 como ativo.
2. Inativar M2 e enviar o payload com M2 usando o token do administrador.
3. Repetir com um id inexistente e comparar o banco.

**Resultado esperado**

- 422 com “alocação 0: motorista 2 inexistente ou inativo.” (id real do M2); a API revalida na confirmação e não confia na lista exibida (AC-06).
- Motorista inexistente: 422 com a mesma mensagem para o id informado.
- Nenhuma alocação é gravada nem alterada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Auditoria, integridade e acesso

#### CT-HU017-API-007 — Auditoria da confirmação da escala

**Técnica/tipo:** Verificação de rastreabilidade (RNF-013) no banco.

**Dados de entrada:** Confirmar uma escala (CT-001) e consultar `log_auditoria` por usuário, ação, entidade e data/hora; repetir a confirmação do mesmo dia.

**Passos**

1. Anotar a quantidade de linhas de `log_auditoria` e o horário.
2. Confirmar a escala e consultar as linhas novas.
3. Repetir a confirmação e conferir o novo registro.

**Resultado esperado**

- Cada confirmação gera registro com `usuario_id` do administrador, `acao`, `entidade`, dados novos (e anteriores na substituição) e `criado_em` coerente (AC-07, RNF-013).
- Recusas e prévias não geram registro de confirmação.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-API-008 — Inativar motorista com escala futura é bloqueado

**Técnica/tipo:** Integração entre HU-010 e HU-017; tabela de decisão (escala futura × histórica).

**Dados de entrada:** M1 escalado em D+1 (CT-001); `PATCH /motoristas/{id}/inativar` para M1; para M3 sem escala; para um motorista só com escala em dia passado.

**Passos**

1. Confirmar a escala de D+1 com M1.
2. Tentar inativar M1, M3 e o motorista com escala só no passado, conferindo a situação depois de cada tentativa.
3. Reativar o que for inativado e devolver a frota ao estado base.

**Resultado esperado**

- M1 (escala futura): recusa com “Este profissional possui alocações pendentes e não pode ser inativado no momento.” e permanece ativo.
- M3 sem escala futura e o motorista com escala só no passado: inativação aceita.
- Quando a escala deixar de ser futura ou for desfeita, a inativação volta a ser permitida.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-API-009 — Confirmações simultâneas do mesmo motorista

**Técnica/tipo:** Concorrência e integridade (RNF-012); restrições únicas do banco.

**Dados de entrada:** Duas confirmações manuais simultâneas para a mesma data, ambas com M1 no turno da ida em ônibus diferentes.

**Passos**

1. Preparar dois payloads válidos isoladamente que entrem em conflito entre si.
2. Enviar os dois ao mesmo tempo (duas conexões) e guardar HTTP e corpo de cada um.
3. Conferir as linhas de `alocacao_diaria` e `alocacao_aluno` da data.

**Resultado esperado**

- Nenhum motorista nem ônibus repetido no mesmo dia e turno, e nenhum aluno duplicado.
- Nenhuma resposta 500: a perdedora recebe recusa controlada (409/422) ou a distribuição final é a de uma única requisição.
- O banco termina em estado consistente e rastreável.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-API-010 — Autenticação e perfis sem acesso

**Técnica/tipo:** Partição por perfil; autorização (RN-006).

**Dados de entrada:** POST de escala e GET `/motoristas` sem token, com token inválido, aluno, representante e administrador (controle).

**Passos**

1. Enviar o POST da escala e o GET da lista com cada credencial.
2. Conferir que os perfis negados não criaram alocação.

**Resultado esperado**

- Sem token ou token inválido: 401.
- Aluno e representante: 403 e nenhuma alocação criada.
- Administrador: 201 e 200.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos API | Complemento |
| --- | --- | --- |
| AC-04 / AC-07 — selecionar, confirmar e persistir a escala | 001 | UI-003 |
| AC-02 / AC-03 / FA-002 — lista só de ativos | 002 | UI-002 |
| AC-01 — ônibus e motorista no mesmo formulário | 003 (campos) | UI-001, UI-006 |
| AC-05 / AC-08 / FA-001 / RN-002 — conflito de motorista | 004, 005 | UI-004, UI-005 |
| AC-06 — revalidação na confirmação | 006 | UI-007 |
| AC-07 / RNF-013 — mensagem e auditoria | 001, 007 | UI-003 |
| RN-006 / HU-010 AC-06 — inativação com escala futura | 008 | — |
| RNF-012 — consistência | 003, 006, 009 | UI-007, UI-008 |
| RN-006 — somente administrador | 010 | UI-009 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](README.md). | — |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465). A mensagem do conflito e a de sucesso seguem o requisito; o texto atual do código está nos riscos.
- Pendências do README do BDD que valem aqui: mensagem do conflito de motorista, auditoria da escala e mensagem de sucesso da escala.
- Nenhum caso foi executado nesta entrega. Não confundir defeito reproduzido, risco de leitura e dependência ausente.
