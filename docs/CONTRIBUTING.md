# Contribuindo com o GOUOCE

Este documento define como o time trabalha no repositório do **GOUOCE (Gestão de Ônibus
Universitários de Ocara-CE)**: estratégia de branches e padrão de commits. Todo integrante
deve seguir essas regras para manter o histórico organizado e as contribuições de cada um
identificáveis — o que também facilita a avaliação do PI3.

---

## 1. Estratégia de Branches

| Branch                   | Papel                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------|
| `main`                   | Versão **estável**, pronta para apresentação/entrega ao professor. Só recebe merge vindo de `develop`, quando testado. |
| `develop`                | Branch de **homologação/integração** — onde as funcionalidades prontas (mobile + back-end) se juntam antes de ir para `main`. |
| `feature/nome-da-tarefa` | Uma branch por funcionalidade/história de usuário, criada a partir de `develop`. Aqui é onde o trabalho do dia a dia acontece. |

Como o projeto tem duas frentes (app mobile e API back-end), vale prefixar a feature com a
frente quando fizer sentido, por exemplo: `feature/mobile-agendamento-diario` ou
`feature/api-validacao-token`.

### Fluxo na prática

```
feature/auth-cadastro-aluno      ──┐
feature/api-gestao-rotas         ──┼──►  Pull Request  ──►  develop  ──►  (quando estável)  ──►  main
feature/mobile-carteirinha       ──┘
```

1. Nunca commitar direto em `main` ou `develop`.
2. Para começar uma tarefa (referente a uma HU do documento de requisitos): `git checkout develop` → `git pull` → `git checkout -b feature/nome-da-tarefa`
3. Ao terminar: abrir um **Pull Request** de `feature/nome-da-tarefa` para `develop`.
4. Pelo menos 1 pessoa do time revisa antes do merge (mesmo revisão rápida).
5. `develop → main` só acontece quando a etapa está estável e testada — normalmente perto de uma entrega da disciplina (sprint review).

---

## 2. Padrão de Commits (Conventional Commits)

Formato: `tipo: descrição breve no imperativo`

| Tipo       | Quando usar                                                 |
| ---------- | ------------------------------------------------------------|
| `feat`     | Nova funcionalidade (ex: nova rota da API, nova tela)        |
| `fix`      | Correção de bug                                              |
| `docs`     | Alteração em documentação (README, documento de requisitos, etc.) |
| `refactor` | Reorganização de código sem mudar comportamento              |
| `test`     | Criação ou ajuste de testes                                  |
| `chore`    | Tarefas de manutenção (configuração, dependências, etc.)     |

### Exemplos (baseados nos épicos do GOUOCE)

```
feat: adiciona endpoint de solicitação de cadastro de aluno
feat: implementa tela de confirmação diária de embarque
fix: corrige validação de token expirado na API
docs: atualiza regras de negócio do épico de agendamento
refactor: extrai lógica de alocação de veículos para service separado
test: adiciona testes automatizados do login com perfil de motorista
chore: adiciona biblioteca de notificações push às dependências do mobile
```

### Boas práticas

- Mensagem no **imperativo** ("adiciona", não "adicionado" ou "adicionando")
- Uma ideia por commit — evitar commits gigantes misturando várias mudanças (ex: não misturar mudança no back-end com mudança no mobile no mesmo commit)
- Descrição curta e direta; se precisar detalhar mais, usar o corpo do commit (linha em branco + parágrafo explicando)
- Sempre que o commit implementar parte de uma História de Usuário, referenciar o ID (ex: `feat: implementa validação de comprovantes (HU-001)`)

---

## 3. Pull Requests

- Título do PR deve seguir o mesmo padrão dos commits (ex: `feat: agendamento de transporte diário`)
- Descrever brevemente o que foi feito e, se aplicável, como testar (inclusive se a mudança depende da API estar rodando)
- Vincular a História de Usuário (HU-XXX) ou Épico (EP-XXX) correspondente do documento de requisitos, se houver
- Se a mudança envolver comunicação app ↔ API, indicar no PR se algum contrato de endpoint mudou
