# BDD — Behavior Driven Development

Especificações executáveis em Gherkin (português) que documentam o comportamento esperado do sistema.

## Estrutura

```
bdd/
├── features/
│   └── epico-01/
│       ├── HU-001.feature  (Solicitação de Cadastro)
│       ├── HU-002.feature  (Login de Usuários)
│       ├── HU-003.feature  (Controle de Acesso)
│       ├── HU-004.feature  (Recuperação de Senha)
│       ├── HU-005.feature  (Edição de Perfil)
│       ├── HU-006.feature  (Gerenciamento de Admins)
│       ├── HU-027.feature  (Avaliação de Cadastro)
│       ├── HU-028.feature  (Renovação de Vínculo)
│       ├── HU-029.feature  (Carteirinha Digital)
│       └── HU-031.feature  (Consultar Pendência de Cadastro)
└── steps/  (step definitions — a implementar)
```

## Formato Gherkin

Cada `.feature` segue o padrão **Given-When-Then**:

```gherkin
Funcionalidade: Nome da funcionalidade
  Como [ator]
  Quero [ação]
  Para [benefício]

  Cenário: Caso de sucesso
    Dado que [pré-condição]
    Quando [ação do usuário]
    Então [resultado esperado]
    E [mais um resultado]

  Cenário: Caso de erro
    Dado que [pré-condição]
    Quando [ação problemática]
    Então [comportamento esperado]
```

## Rastreabilidade

Cada cenário é rastreável aos requisitos via **tags e IDs**:

```gherkin
@EP001 @HU001 @cadastro_aluno     # Épico, História, feature
@fluxo_feliz @smoke @prioridade_alta  # Tipo, prioridade
@FA001 @AC02 @RN011               # Fluxo Alternativo, Critério de Aceite, Regra de Negócio
```

| Tag                             | Significado                                     |
| ------------------------------- | ----------------------------------------------- |
| `@fluxo_feliz`                  | Cenário de sucesso (caminho feliz)              |
| `@fluxo_infeliz`                | Cenário de erro ou validação                    |
| `@FA00X`                        | Fluxo Alternativo (conforme docs/requisitos.md) |
| `@AC0X`                         | Critério de Aceite                              |
| `@RN0XX`                        | Regra de Negócio                                |
| `@RF0XX`                        | Requisito Funcional                             |
| `@RNF0XX`                       | Requisito Não-Funcional                         |
| `@teste_api`                    | Testável via API (não mobile UI)                |
| `@nao_automatizavel_via_appium` | Requer testes backend/banco                     |

## Épico 01 — Autenticação e Gestão de Conta

### Histórias de Usuário

**HU-001: Solicitação de Cadastro de Aluno**

- Fluxo: aluno preenche dados → anexa comprovantes → aceita termos → cadastro fica "Pendente"
- Cenários: 1 sucesso + 4 alternativas (e-mail duplicado, campo obrigatório, senha fraca, falha API) + 2 não-funcionais

**HU-002: Login de Usuários**

- Fluxo: usuário seleciona perfil → insere credenciais → autentica
- Suporta 3 perfis: Aluno, Representante, Administrador
- Cenários: 1 sucesso (Aluno) + 1 sucesso (Representante) + 1 perfil obrigatório + 3 alternativas + 2 não-funcionais

**HU-003: Controle de Acesso por Perfil**

- Fluxo: após login, sistema carrega interface com menus/ações específicos do perfil
- Restrição: cada perfil vê só seu escopo (Aluno ≠ Admin ≠ Representante)
- Cenários: 1 esquema (3 perfis × menus) + 1 RN + 1 combinações perfil/ação + 1 tentativa bypass + 1 alteração mid-session

**HU-004: Recuperação de Senha**

- Fluxo: usuário solicita recuperação → recebe link por e-mail → redefine senha
- Segurança: link com expiração, senha com hash, não revela se e-mail existe
- Cenários: 1 sucesso + 4 alternativas + 2 não-funcionais

**HU-005: Edição de Perfil do Aluno**

- Fluxo: aluno edita telefone/bairro/e-mail (campos académicos readonly)
- Segurança: alteração de e-mail exige confirmação de senha
- Cenários: 1 sucesso + 2 alternativas (e-mail duplicado, dados inválidos) + 1 campos readonly + 1 falha API

**HU-006: Gerenciamento de Administradores**

- Fluxo: admin cria/edita/inativa outros admins
- Restrição: não consegue inativar a si mesmo, mas consegue inativar outro admin
- Auditoria: cada ação registrada (quem fez, quê, quando)
- Cenários: 1 sucesso + 1 edição + 1 inativação com auditoria + 1 sucesso (outro admin) + 1 auto-inativação bloqueada + 1 acesso restrito

**HU-027: Avaliação de Solicitação de Cadastro**

- Fluxo: admin visualiza fila de pendentes → aprova ou reprova com motivo
- Notificação: aluno é notificado da aprovação/reprovação
- Cenários: 1 fila ordenada + 1 visualização + 1 aprovação + 1 reprovação com motivo obrigatório + 1 acesso restrito

**HU-028: Renovação de Vínculo Institucional**

- Fluxo: aluno com vínculo vencido (novo semestre) → envia novo comprovante → volta a "Em Análise"
- Bloqueio: agendamento fica bloqueado durante análise
- Validação: aceita PDF/JPG/PNG até 5MB
- Cenários: 1 sucesso + 1 sem anexo + 1 formato/tamanho inválido + 1 falha API + 1 acesso bloqueado

**HU-031: Consultar Pendência de Cadastro**

- Fluxo: aluno com cadastro reprovado acessa "Status do Cadastro" → vê os documentos reprovados e o motivo de cada um → corrige e reenvia → cadastro volta para "Pendente de aprovação" e para a fila do administrador
- Status exibidos: Pendente de aprovação, Aprovado e Reprovado; aprovado informa que não há pendências e pendente aguarda a avaliação
- Regra: só os documentos reprovados podem ser reenviados, e todos os reprovados precisam ser reenviados juntos (AC-07); o reenvio é permitido somente para cadastro reprovado (RN-012)
- Falhas no envio (FA-003): conexão perdida e arquivo vazio, acima de 5MB ou em formato não permitido mantêm o cadastro reprovado e não gravam nada
- Organizado em blocos `Regra:` (status, documentos e motivos, reenvio, falhas no envio, acesso)
- Cenários: 1 acesso ao status + 1 esquema de status + 1 aprovado + 1 pendente + 1 login por situação (API) + 1 agendamento negado (API) + 1 documentos e motivos + 1 documentos e motivos (API) + 1 lista vazia (API) + 1 só o próprio cadastro + 1 reenvio + 1 reenvio (API) + 1 volta à fila + 1 sessão mantida + 1 documento não reprovado (tela) + 1 documento não reprovado (API) + 1 documento faltante + 1 sem arquivo + 1 reenvio só para reprovado + 1 conexão perdida + 1 arquivo inválido (tela) + 1 arquivo inválido (API) + 2 acesso (sem token e administrador) + 1 HTTPS

**HU-029: Carteirinha Digital do Aluno**

- Fluxo: aluno aprovado → visualiza carteirinha com foto + dados + QR Code
- Offline: funciona em cache se não houver conexão
- Cenários: 1 sucesso + 1 bloqueado (status ≠ "Aprovado") + 1 offline + 1 desempenho + 1 QR Code legível

### Resumo de Cobertura

- **10 histórias** = 91 cenários (incluindo data-driven)
- **3 perfis de usuário** cobertos (Aluno, Representante, Admin)
- **Rastreabilidade 100%**: cada cenário liga a RF/RNF/RN específica
- **Não-funcionais separados**: marcados como `@teste_api` (não rodam via Appium)

## Como Usar

### 1. Ler os cenários

```bash
cat bdd/features/epico-01/HU-001.feature
```

### 2. Implementar (dev)

Quando os step definitions forem criados (`bdd/steps/*.js`), devs vão ligar cada passo Gherkin a código real.

### 3. Automatizar (QA)

```bash
npm run test:bdd  # quando Cucumber.js + Detox estiverem configurados
```

### 4. Filtrar por tag (CI/CD)

```bash
# Apenas smoke tests
cucumber --tags "@smoke"

# Apenas não-funcionais
cucumber --tags "@teste_api"

# Apenas um épico
cucumber --tags "@EP001"
```

## Próximos Passos

- [x] Épico 02 (HU-007 a HU-010, HU-030) — Gestão de Cadastros Base ([`../epico-02/`](../epico-02/README.md))
- [x] Épico 03 (HU-011 e HU-012) — Gestão de Rotas e Horários ([`../epico-03/`](../epico-03/README.md))
- [x] Épico 04 (HU-013 a HU-015) — Agendamento de Transporte ([`../epico-04/`](../epico-04/README.md))
- [ ] Épico 05+ — Demais histórias
- [ ] Step definitions em Cucumber.js
- [ ] Integração com CI/CD
- [ ] Documento `docs/regras-validacao.md` — regras técnicas detalhadas

## Referências

- **Requisitos**: `docs/requisitos.md` (especificação original com ACs)
- **Arquitetura**: `docs/arquitetura.md` (visão técnica)
- **Padrão**: Gherkin + Given-When-Then (legível por todos: dev, QA, PO, stakeholder)
