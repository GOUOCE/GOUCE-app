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

- Fluxo: admin cadastra, edita, inativa e reativa bairros com ao menos um ponto de parada
- Unicidade: nome do bairro e do ponto de parada (ativo ou inativo)
- Bloqueio: bairro vinculado a rota ativa não pode ser inativado (depende da HU-011)
- Cenários: 1 listagem + 1 sucesso + 2 duplicidade + 1 campos obrigatórios + 1 edição + 1 inativação + 1 reativação + 1 bloqueio por rota + 1 inativos + 1 histórico (RN-004) + 1 acesso restrito

**HU-008: Gerenciamento de Faculdades**

- Fluxo: admin cadastra, edita, inativa e reativa faculdades (nome + campus)
- Unicidade: combinação nome + campus (mesmo nome em outro campus é permitido)
- Bloqueio: faculdade com alunos agendados para datas futuras não pode ser inativada (depende da HU-013)
- Cenários: 1 listagem + 1 sucesso + 1 mesmo nome em outro campus + 1 duplicidade + 1 campos obrigatórios + 1 edição + 1 inativação + 1 reativação + 1 bloqueio por agendamento + 1 inativos + 1 histórico + 1 acesso restrito

**HU-009: Gerenciamento de Frota (Ônibus)**

- Fluxo: admin cadastra, edita, inativa e reativa ônibus (placa, assentos e capacidade em pé)
- Unicidade: placa, no cadastro e na edição
- Bloqueio: ônibus escalado para rota futura não pode ser inativado (depende das HU-016 e HU-017)
- Cenários: 1 listagem + 1 sucesso + 1 duplicidade no cadastro + 1 duplicidade na edição + 1 campos obrigatórios + 1 edição + 1 inativação + 1 reativação + 1 bloqueio por alocação + 1 inativos + 1 histórico + 1 acesso restrito

**HU-010: Gerenciamento de Motoristas**

- Fluxo: admin cadastra (`+ Novo`), busca por nome, edita, inativa (com modal) e reativa motoristas
- Unicidade: telefone (ativo ou inativo)
- Bloqueio: motorista escalado para rota futura não pode ser inativado (depende da HU-017)
- Cenários: 1 listagem + 1 busca + 1 sucesso + 1 duplicidade + 1 campos obrigatórios + 1 edição + 1 inativação + 1 cancelamento no modal + 1 reativação + 1 bloqueio por alocação + 1 `Mostrar inativos` + 1 histórico + 1 acesso restrito

**HU-030: Gerenciamento de Representantes**

- Fluxo: admin atribui ou revoga a função de representante de um aluno aprovado e ativo
- Regra: revogar a função mantém o cadastro de aluno ativo
- Escopo: representante vê apenas a lista de embarque da sua universidade (RN-015, depende das HU-018 e HU-021)
- Cenários: 1 listagem + 1 atribuição + 1 revogação + 1 aluno não aprovado (4 status) + 1 já representante + 1 aluno não encontrado + 1 escopo do representante + 1 representante sem acesso administrativo + 1 perda de permissões após revogação + 1 acesso restrito

## Resumo de Cobertura

| HU     | Cenários | Esquemas | Execuções |
| ------ | -------- | -------- | --------- |
| HU-007 | 12       | 3        | 15        |
| HU-008 | 12       | 3        | 15        |
| HU-009 | 12       | 3        | 16        |
| HU-010 | 13       | 3        | 16        |
| HU-030 | 10       | 1        | 13        |
| Total  | 59       | 13       | 75        |

- Todos os critérios de aceite e fluxos alternativos de `docs/requisitos.md` (seção 7.3) têm ao menos um cenário.
- Cenários de RN-004 (preservação de histórico) dependem de consulta ao banco ou à API e estão marcados com `@teste_api @nao_automatizavel_via_appium`.
- Cenários com `@auditoria` validam a operação pela interface, mas a verificação do log de auditoria exige consulta ao banco ou à API.
- Arquivos validados com o parser oficial `@cucumber/gherkin`.

## Divergências encontradas nos requisitos

Pontos de `docs/requisitos.md` que precisam de alinhamento com o time. Os cenários seguem a opção indicada e trazem um comentário `# Observação` no arquivo.

| HU             | Divergência                                                                                                                   | Opção seguida nos cenários          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| HU-007 a 010   | O AC-03 bloqueia duplicidade com registro **ativo ou inativo**; o FA-002 cita apenas registros **ativos**                     | AC-03 (ativo ou inativo)            |
| HU-010         | AC-02/AC-03 usam o **telefone** como identificador único; o FA-002 cita **CNH ou CPF**; o RF-009 cita **número e categoria da CNH** | ACs (telefone)                      |
| HU-007         | Em "Requisitos Funcionais" aparece **RNF-011** (Backup); o requisito de bairros é o **RF-011**                                 | RF-011                              |
| HU-030         | O documento cita **RF-034**, mas a tabela de requisitos registra o item como **RF-34**                                        | RF-034                              |
| HU-009         | A mensagem do AC-03 está sem fechamento de aspas: `'Este veículo já está registrado`                                          | "Este veículo já está registrado."  |
| HU-030         | As mensagens de bloqueio (FA-002, FA-003 e FA-004) não têm texto definido                                                     | Cenários verificam o sentido da mensagem, não o texto exato |
