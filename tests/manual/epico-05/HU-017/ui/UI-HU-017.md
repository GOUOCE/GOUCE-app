# Testes manuais de UI — HU-017 — Alocação de Motoristas às Rotas

## Identificação da suíte

| Campo | Valor |
| --- | --- |
| Módulo | Alocação e Distribuição Logística (EP-005) |
| Funcionalidade | HU-017 — Alocação de Motoristas às Rotas |
| Camada | UI — celular ou web |
| Tipo de teste | Funcional manual essencial, integração e tratamento de falha — baseado em risco |
| Telas | Logística → Distribuição Logística → alocação da rota (ônibus e motorista por turno). |
| Base do planejamento | [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`, sobre a `develop` `1eb2818d`; a tela de escala (`alocar.tsx`) ainda não está na `develop` |
| Branch de planejamento | `test/planejamento-api-ui-hu-017`, com entrega para `develop` |
| Revisão do planejamento | 16/11/2026 — requisitos 7.6 com as decisões do PO (#465), BDD do épico 05 e leitura do código |
| Ambiente | A preencher — navegador (versão web) ou celular, URL, SHAs do front ([PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457) `80830b4d`) e da API; banco limpo, fuso America/Fortaleza |
| Total de casos | 9 |
| Última execução | Não realizada |
| Testador | Cauan Ricardo — execução manual; LLM — massa e conferência de API/banco |

## Resultado geral

| Situação | Total | ✅ Passaram | ❌ Falharam | ⚠️ Parciais | 🚫 Bloqueados | ⏳ Pendentes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ⏳ Não executada | 9 | 0 | 0 | 0 | 0 | 9 |

## Pré-condições

| ID | Descrição |
| --- | --- |
| PC-01 | Front do [PR #457](https://github.com/GOUOCE/GOUCE-app/pull/457), branch `feature/front-hu16e17`, commit `80830b4d`, com a API da `develop` `1eb2818d`. Sem esse build a tela de escala não existe e os casos ficam bloqueados. Registrar URL, SHAs e navegador. |
| PC-02 | Cauan executa a UI; a LLM prepara a massa e confere API/banco depois de cada caso, e inativa motoristas pela API quando o caso pedir. |
| PC-03 | Usar a massa da [suíte de API](../api/API-HU-017.md) e da [HU-016](../../HU-016/api/API-HU-016.md): P1/P2, V1/V2/V3, M1/M2/M3 ativos e M4 inativo, reservas em D+1. |
| PC-04 | Os esperados seguem requisitos 7.6, BDD e decisões do PO; os riscos de leitura do [guia da API](../api/README.md) não são defeitos reproduzidos. Toda a suíte está pendente. |

## Resumo da execução

Executar na ordem e registrar cada variação. A LLM confere API e banco depois dos casos de confirmação e prepara as mudanças feitas por API (motorista inativado).

### Seção A — Escala na tela

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-UI-001 | Abrir a alocação da rota com ônibus e motorista no mesmo formulário | Administrador; dia com rotas P1 e P2 distribuídas; detalhe de uma rota na tela de distribuição. | Formulário da rota com ônibus e motorista por turno. | ⏳ PENDENTE | BDD: seleciona o ônibus e o motorista e confirma a escala; AC-01. |
| CT-HU017-UI-002 | Lista de motoristas ao selecionar o ônibus | M1 a M3 ativos e M4 inativo; M2 já escalado em outra rota no mesmo turno. | Apenas ativos; M4 ausente; indisponível no turno não aparece ou é sinalizado. | ⏳ PENDENTE | Risco de leitura: a tela lista todos os motoristas ativos sem filtrar pelo turno. BDD: motoristas disponíveis; inativo fora da lista. |
| CT-HU017-UI-003 | Confirmar a escala e ver a mensagem de sucesso | Selecionar V3 e M2 para P1 na ida e confirmar; reabrir a rota; recarregar a página. | Popup de confirmação, mensagem “Escala de motoristas confirmada com sucesso”, vínculo salvo e mantido ao reabrir. | ⏳ PENDENTE | Risco de leitura: a confirmação regrava todas as rotas do dia e a tela guarda a escala em memória. BDD: confirma a escala. |

### Seção B — Conflitos

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-UI-004 | Conflito: motorista já escalado em outra rota no mesmo turno | M1 escalado em P1 na ida; tentar escalar M1 em P2 na ida; a LLM pode forçar por API para comparar. | Bloqueio na seleção ou alerta com a mensagem do requisito; nada salvo. | ⏳ PENDENTE | Risco de leitura: o texto da API é “alocação N: motorista X conflitante no turno ida.”. BDD: bloqueia escala de motorista já designado. |
| CT-HU017-UI-005 | Mesmo motorista na ida e na volta | M1 em P1 na ida e na volta do mesmo dia. | Aceito nos dois turnos. | ⏳ PENDENTE | BDD: mesmo motorista na ida e na volta; AC-08. |
| CT-HU017-UI-006 | Campos obrigatórios do formulário | Confirmar sem escolher ônibus; sem escolher motorista; ambos vazios. | Confirmação bloqueada com indicação do campo; nada gravado. | ⏳ PENDENTE | BDD: bloqueia a confirmação quando falta o campo. |

### Seção C — Falhas

| ID | Cenário | Dados de entrada | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- |
| CT-HU017-UI-007 | Motorista inativado depois de exibido | Tela aberta com M2 na lista; a LLM inativa M2 pela API; confirmar com M2. | Confirmação recusada com mensagem; sem sucesso falso. | ⏳ PENDENTE | BDD: recusa a confirmação de motorista inativado depois de exibido; AC-06. |
| CT-HU017-UI-008 | Falha de comunicação ao confirmar a escala | Rede desligada ao confirmar; religar e repetir. | Falha informada, nada gravado, repetição funciona. | ⏳ PENDENTE | BDD: AC-07 e RNF-012. |
| CT-HU017-UI-009 | Perfis sem acesso à escala | Aluno, representante e sem sessão; endereço direto da alocação da rota. | Menu e tela indisponíveis; URL direta negada. | ⏳ PENDENTE | BDD: menu de alocação diária não é exibido sem perfil administrativo; RN-006. |

## Detalhamento dos casos

### Seção A — Escala na tela

#### CT-HU017-UI-001 — Abrir a alocação da rota com ônibus e motorista no mesmo formulário

**Técnica/tipo:** Funcional positivo e navegação.

**Dados de entrada:** Administrador; dia com rotas P1 e P2 distribuídas; detalhe de uma rota na tela de distribuição.

**Passos**

1. Abrir Logística → Distribuição Logística e escolher o dia.
2. Abrir a alocação de P1.
3. Conferir o formulário por turno (Ida e Volta).

**Resultado esperado**

- O painel de detalhes da rota mostra o ônibus e, no mesmo formulário, o campo do motorista (AC-01).
- Os turnos aparecem separados e os valores iniciais correspondem à prévia da API.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-UI-002 — Lista de motoristas ao selecionar o ônibus

**Técnica/tipo:** Partição ativo/inativo e disponível/indisponível no turno.

**Dados de entrada:** M1 a M3 ativos e M4 inativo; M2 já escalado em outra rota no mesmo turno.

**Passos**

1. Selecionar um ônibus no formulário e abrir a lista de motoristas.
2. Procurar M4 (inativo) e M2 (já escalado em outra rota no mesmo turno).
3. Comparar com `GET /motoristas`.

**Resultado esperado**

- A lista mostra só motoristas ativos; M4 não aparece (AC-03 e FA-002).
- O motorista já escalado em outra rota no mesmo turno não aparece como disponível ou exibe o alerta de indisponibilidade (AC-02 e AC-05).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-UI-003 — Confirmar a escala e ver a mensagem de sucesso

**Técnica/tipo:** Transição de estado e persistência; popup padrão do app.

**Dados de entrada:** Selecionar V3 e M2 para P1 na ida e confirmar; reabrir a rota; recarregar a página.

**Passos**

1. Escolher o ônibus e o motorista e tocar em confirmar; desistir uma vez no popup.
2. Confirmar de novo e ler a mensagem.
3. Reabrir a rota e recarregar a página; comparar com o banco.

**Resultado esperado**

- O popup identifica a rota e a data; desistir não grava nada.
- A confirmação mostra “Escala de motoristas confirmada com sucesso” em popup padrão, sem toast preto.
- A escala persiste no banco (motorista, ônibus, rota, data e turno) e continua exibida depois de reabrir e de recarregar; as outras rotas do dia não mudam.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção B — Conflitos

#### CT-HU017-UI-004 — Conflito: motorista já escalado em outra rota no mesmo turno

**Técnica/tipo:** Tabela de decisão motorista × rota × turno (RN-002).

**Dados de entrada:** M1 escalado em P1 na ida; tentar escalar M1 em P2 na ida; a LLM pode forçar por API para comparar.

**Passos**

1. Escalar M1 em P1 (ida) e confirmar.
2. Abrir P2 e tentar selecionar M1 na ida.
3. Se a tela permitir, confirmar e ler a mensagem; conferir o banco.

**Resultado esperado**

- M1 não aparece como disponível para P2 na ida ou a tela exibe “Este motorista já está escalado para outra rota neste horário” (AC-05, FA-001).
- Nenhuma escala conflitante é gravada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-UI-005 — Mesmo motorista na ida e na volta

**Técnica/tipo:** Tabela de decisão por turno; funcional positivo.

**Dados de entrada:** M1 em P1 na ida e na volta do mesmo dia.

**Passos**

1. Escolher M1 para a ida e para a volta de P1 e confirmar.
2. Conferir o banco.

**Resultado esperado**

- A tela permite o mesmo motorista nos dois turnos, mostra o sucesso e grava duas linhas (AC-08).

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-UI-006 — Campos obrigatórios do formulário

**Técnica/tipo:** Partição de entradas válidas e inválidas.

**Dados de entrada:** Confirmar sem escolher ônibus; sem escolher motorista; ambos vazios.

**Passos**

1. Limpar o ônibus e tentar confirmar.
2. Limpar o motorista e tentar confirmar.
3. Limpar os dois e tentar confirmar; conferir o banco.

**Resultado esperado**

- A confirmação não é enviada e a tela indica o campo obrigatório pendente.
- Nenhuma alocação é criada ou alterada.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

### Seção C — Falhas

#### CT-HU017-UI-007 — Motorista inativado depois de exibido

**Técnica/tipo:** Transição de estado entre listar e confirmar; revalidação.

**Dados de entrada:** Tela aberta com M2 na lista; a LLM inativa M2 pela API; confirmar com M2.

**Passos**

1. Abrir a alocação com M2 disponível.
2. Pedir à LLM que inative M2 pela API.
3. Confirmar a escala com M2 e ler a mensagem; conferir o banco.

**Resultado esperado**

- A tela mostra a recusa (motorista inexistente ou inativo) e não exibe sucesso.
- Nada é gravado e a escala anterior continua.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-UI-008 — Falha de comunicação ao confirmar a escala

**Técnica/tipo:** Transição online/offline; erro sem efeito parcial.

**Dados de entrada:** Rede desligada ao confirmar; religar e repetir.

**Passos**

1. Selecionar ônibus e motorista, desligar a rede e confirmar.
2. Religar a rede e repetir.
3. Conferir o banco nas duas etapas.

**Resultado esperado**

- Sem rede, a mensagem é de falha, a escala não é gravada e não há popup de sucesso.
- Com a rede de volta, a repetição grava a escala.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

#### CT-HU017-UI-009 — Perfis sem acesso à escala

**Técnica/tipo:** Partição por perfil; acesso por URL direta.

**Dados de entrada:** Aluno, representante e sem sessão; endereço direto da alocação da rota.

**Passos**

1. Entrar como aluno e como representante e procurar o menu de logística.
2. Abrir o endereço direto da alocação da rota com cada perfil e sem sessão.

**Resultado esperado**

- Aluno e representante não veem o menu; a URL direta leva a acesso negado ou ao login, sem dados de escala.

**Resultado obtido**

- Não executado.
- Status: ⏳ Pendente.

---

## Rastreabilidade

| Critério/regra | Casos UI | Complemento |
| --- | --- | --- |
| AC-01 — formulário com ônibus e motorista | UI-001, UI-006 | API-003 |
| AC-02 / AC-03 / FA-002 — motoristas disponíveis | UI-002 | API-002 |
| AC-04 / AC-07 — confirmar e mensagem de sucesso | UI-003 | API-001, API-007 |
| AC-05 / AC-08 / FA-001 — conflito e ida/volta | UI-004, UI-005 | API-004, API-005 |
| AC-06 — revalidação | UI-007 | API-006 |
| RNF-012 — falha sem efeito parcial | UI-008 | API-009 |
| RN-006 — somente administrador | UI-009 | API-010 |

## Defeitos encontrados

| Caso | Defeito | Issue |
| --- | --- | --- |
| — | Nenhuma execução realizada. Os riscos de leitura estão no [guia de execução da API](../api/README.md). | — |

## Observações gerais

- Referências: [requisitos, seção 7.6](../../../../../docs/requisitos.md), [BDD do épico 05](../../../../../bdd/features/epico-05/README.md) e as [decisões do PO na #465](https://github.com/GOUOCE/GOUCE-app/issues/465).
- O PR #457 está aberto e pode mudar; registrar o SHA efetivamente testado.
- Nenhum caso foi executado nesta entrega.
