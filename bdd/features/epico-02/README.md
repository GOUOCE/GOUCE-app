# BDD — Épico 02: Gestão de Cadastros Base

Especificações em Gherkin (português) do comportamento esperado para o cadastro e a manutenção das entidades estruturais do transporte: bairros e pontos de parada, faculdades, frota, motoristas e representantes.

O formato, as tags e a rastreabilidade seguem o padrão descrito em [`../epico-01/README.md`](../epico-01/README.md).

## Estrutura

```
bdd/features/epico-02/
├── HU-007.feature  (Bairros e Pontos de Parada)
├── HU-008.feature  (Faculdades)
├── HU-009.feature  (Frota / Ônibus)
├── HU-010.feature  (Motoristas)
└── HU-030.feature  (Representantes)
```

## Tags adicionais usadas neste épico

| Tag                 | Significado                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `@auditoria`        | Verifica o registro no log de auditoria (RNF-013)                            |
| `@depende_de_HU0XX` | Cenário que só pode ser executado depois que a HU indicada estiver entregue  |

## Histórias de Usuário

**HU-007: Gerenciamento de Bairros e Pontos de Parada**

- Fluxo: admin cadastra, edita, inativa e reativa bairros com ao menos um ponto de parada ativo; pontos podem ser inativados individualmente
- Unicidade: nome do bairro no sistema e nome do ponto dentro do bairro (ativo ou inativo, sem diferenciar maiúsculas/minúsculas)
- Bloqueio: bairro ou ponto vinculado a rota ativa não pode ser inativado (depende da HU-011)
- Organizado em blocos `Regra:` (gestão pelo admin, soft delete e auditoria, indisponibilidade de inativos, acesso restrito)
- Cenários: 1 listagem + 1 sucesso + 1 ponto com mesmo nome em outro bairro + 3 duplicidade (bairro no cadastro, bairro na edição, ponto no bairro) + 2 obrigatórios (cadastro e último ponto na edição) + 1 edição + 2 inativação (bairro e ponto) + 1 reativação + 1 bloqueio por rota + 1 inativos + 1 soft delete + 1 auditoria + 1 bairro inativo fora da seleção + 1 histórico (RN-004) + 2 acesso restrito (menu e API)

**HU-008: Gerenciamento de Faculdades**

- Fluxo: admin cadastra, edita, inativa e reativa faculdades (nome + campus); a listagem mostra só as ativas, com a chave "Mostrar inativos"
- Unicidade: combinação nome + campus, no cadastro e na edição, ativa ou inativa, sem diferenciar maiúsculas/minúsculas (mesmo nome em outro campus é permitido)
- Bloqueio: faculdade com alunos agendados para datas futuras não pode ser inativada (depende da HU-013); faculdade atendida por rota ativa, na ida ou na volta, também não (decisão do PO na #207, item 9)
- Organizado em blocos `Regra:` (gestão pelo admin, soft delete e auditoria, indisponibilidade de inativas, acesso restrito)
- Cenários: 1 listagem + 1 sucesso + 1 mesmo nome em outro campus + 2 duplicidade (cadastro e edição) + 2 obrigatórios (cadastro e edição) + 1 edição + 1 inativação + 1 reativação + 1 bloqueio por agendamento + 1 bloqueio por rota ativa (ida e volta) + 1 inativação com rota só inativa + 1 inativos + 1 soft delete + 1 auditoria + 1 faculdade inativa fora da seleção + 1 histórico (RN-004) + 2 acesso restrito (menu e API)

**HU-009: Gerenciamento de Frota (Ônibus)**

- Fluxo: admin cadastra, edita, inativa e reativa ônibus (placa, assentos e capacidade em pé); a listagem mostra só os ativos, com a chave "Mostrar inativos"
- Unicidade: placa, no cadastro e na edição, ativa ou inativa, sem diferenciar maiúsculas/minúsculas nem hífen (a placa é guardada em maiúsculas e sem hífen)
- Validações: formato da placa (Mercosul ou antigo) e assentos inteiro ≥ 1 / em pé inteiro ≥ 0 (confirmados pelo PO na #207, itens 3 e 4)
- Bloqueio: ônibus escalado para rota futura não pode ser inativado (depende das HU-016 e HU-017)
- Organizado em blocos `Regra:` (gestão pelo admin, soft delete e auditoria, indisponibilidade de inativos, acesso restrito)
- Cenários: 1 listagem + 1 sucesso + 1 normalização da placa + 2 duplicidade (cadastro e edição) + 2 obrigatórios (cadastro e edição) + 1 formato da placa + 1 quantidade inválida + 1 edição + 1 inativação + 1 reativação + 1 bloqueio por alocação + 1 inativos + 1 soft delete + 1 auditoria + 1 ônibus inativo fora da escalação + 1 histórico (RN-004) + 2 acesso restrito (menu e API)

**HU-010: Gerenciamento de Motoristas**

- Fluxo: admin cadastra (`+ Novo`), busca por nome, edita, inativa (com modal) e reativa motoristas; a listagem mostra só os ativos, com a chave `Mostrar inativos`
- Unicidade: telefone, no cadastro e na edição, ativo ou inativo, comparando só os dígitos (com ou sem máscara); nomes iguais são permitidos
- Validação: telefone com DDD + 8 dígitos (fixo) ou 9 (celular), com máscara automática; mensagem do formulário "Informe um telefone válido com DDD" (confirmado pelo PO na #207, item 5)
- Bloqueio: motorista escalado para rota futura não pode ser inativado (depende da HU-017); até a HU-017 existir, a inativação é permitida sem essa checagem (decisão do PO na #207, item 8)
- Organizado em blocos `Regra:` (gestão pelo admin, soft delete e auditoria, indisponibilidade de inativos, acesso restrito)
- Cenários: 1 listagem + 1 busca + 1 sucesso + 1 telefones aceitos (fixo e celular) + 1 homônimos + 2 duplicidade (cadastro e edição) + 2 obrigatórios (cadastro e edição) + 1 formato do telefone + 1 edição + 1 inativação + 1 cancelamento no modal + 1 reativação + 1 bloqueio por alocação + 1 `Mostrar inativos` + 1 soft delete + 2 auditoria (operações e cancelamento) + 1 motorista inativo fora da escalação + 1 histórico (RN-004) + 2 acesso restrito (menu e API)

**HU-030: Gerenciamento de Representantes**

- Fluxo: admin atribui ou revoga a função de representante de um aluno aprovado e ativo, escolhendo a instituição de ensino responsável (obrigatória); a listagem mostra representantes ativos e revogados
- Regra: revogar a função mantém o cadastro de aluno ativo; aluno com função revogada pode receber a função novamente
- Escopo: representante vê apenas a lista de embarque da sua universidade (RN-015, depende das HU-018 e HU-021)
- Organizado em blocos `Regra:` (atribuição e revogação, auditoria, escopo do representante, acesso restrito)
- Cenários: 1 listagem + 1 atribuição + 1 instituição obrigatória + 1 revogação + 1 reatribuição + 1 aluno não aprovado (4 status) + 1 já representante + 1 aluno não encontrado + 1 auditoria + 1 escopo do representante + 1 perda de permissões após revogação + 2 acesso restrito (menu e API)

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-007 | 25       | 10       | 40        |
| HU-008 | 26       | 12       | 50        |
| HU-009 | 20       | 9        | 45        |
| HU-010 | 30       | 14       | 59        |
| HU-030 | 13       | 4        | 19        |
| Total  | 114      | 49       | 213       |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.3) têm ao menos um cenário.
- Cenários de RN-004 (preservação de histórico) dependem de consulta ao banco ou à API e estão marcados com `@teste_api @nao_automatizavel_via_appium`.
- Cenários com `@auditoria` validam a operação pela interface, mas a verificação do log de auditoria exige consulta ao banco ou à API.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Divergências encontradas nos requisitos

**Resolvidas em `docs/requisitos.md`:**

- HU-007: duplicidade vale para ativo ou inativo; ponto único dentro do bairro; listagem só de ativos com a chave "Mostrar inativos"; auditoria de todas as operações de escrita; bloqueio de remover o último ponto; comparação de nomes sem diferenciar maiúsculas/minúsculas; inativação de ponto individual; bairros inativos fora da seleção; referência RNF-011 corrigida para RF-011.
- HU-008: mesmas decisões da HU-007 (listagem só de ativas com "Mostrar inativos", duplicidade também na edição e sem diferenciar maiúsculas/minúsculas, auditoria de todas as escritas, inativas fora da seleção).
- HU-009: mesmas decisões, mais critérios novos de formato da placa (Mercosul ou antigo, mensagem "Placa inválida.") e de quantidade (assentos ≥ 1, em pé ≥ 0, só inteiros), e normalização da placa na duplicidade.
- HU-010: mesmas decisões, mais critério novo de formato do telefone (DDD + 8 dígitos de fixo ou 9 de celular, mensagem "Informe um telefone válido com DDD"), duplicidade comparando só os dígitos do telefone e homônimos permitidos.
- HU-030: mesmas decisões, mais critérios novos de instituição de ensino obrigatória na atribuição (já exigida pela tela) e de reatribuição após revogação.
- Decisões do PO na [issue #207](https://github.com/GOUOCE/GOUCE-app/issues/207) (27/10/2026), todas na opção sugerida: duplicidade bloqueada contra registro **ativo ou inativo** também no FA-002 (HU-007 a 010); RF-009 só com nome e telefone, sem CNH; formato da placa, capacidade e telefone confirmados; instituição do representante obrigatória e livre (pode ser diferente da matrícula), com reatribuição permitida e só para alunos aprovados e ativos; inativos fora das novas seleções; motorista pode ser inativado sem a checagem de escala até a HU-017; faculdade atendida por rota ativa não pode ser inativada (HU-008, AC-12 e FA-004).

**Pendentes:** nenhuma.
