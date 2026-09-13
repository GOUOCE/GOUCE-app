# Organização da Estrutura do Projeto (Frontend)

Este plano visa organizar o repositório movendo todos os arquivos e pastas relacionados ao desenvolvimento do frontend (aplicação Expo) para um subdiretório dedicado chamado `frontend`. Isso permite que o backend seja integrado futuramente em seu próprio diretório, mantendo a raiz do projeto limpa.

## Mudanças Propostas

Criaremos a pasta `frontend` e moveremos os seguintes itens para dentro dela:

### [Projeto Frontend]

#### [NEW] [frontend/](file:///C:/Users/pinho/StudioProjects/atu-app/frontend)
Diretório base para a aplicação mobile.

#### [MOVE] [src/](file:///C:/Users/pinho/StudioProjects/atu-app/src) -> `frontend/src/`
Contém as telas, contextos e lógica da API do frontend.

#### [MOVE] [app.json](file:///C:/Users/pinho/StudioProjects/atu-app/app.json) -> `frontend/app.json`
Configuração do Expo.

#### [MOVE] [package.json](file:///C:/Users/pinho/StudioProjects/atu-api/package.json) -> `frontend/package.json`
Dependências do projeto.

#### [MOVE] [package-lock.json](file:///C:/Users/pinho/StudioProjects/atu-app/package-lock.json) -> `frontend/package-lock.json`
Travamento de versões das dependências.

#### [MOVE] [tsconfig.json](file:///C:/Users/pinho/StudioProjects/atu-app/tsconfig.json) -> `frontend/tsconfig.json`
Configuração do TypeScript.

#### [MOVE] [babel.config.js](file:///C:/Users/pinho/StudioProjects/atu-app/babel.config.js) -> `frontend/babel.config.js`
Configuração do Babel.

#### [MOVE] [Dockerfile](file:///C:/Users/pinho/StudioProjects/atu-app/Dockerfile) -> `frontend/Dockerfile`
Configuração de container específica da aplicação frontend.

#### [MOVE] [.env.example](file:///C:/Users/pinho/StudioProjects/atu-app/.env.example) -> `frontend/.env.example`
Template de variáveis de ambiente.

#### [MOVE] [node_modules/](file:///C:/Users/pinho/StudioProjects/atu-app/node_modules) -> `frontend/node_modules/`
Pasta de dependências instaladas.

---

### [Configurações Globais]

#### [MODIFY] [docker-compose.yml](file:///C:/Users/pinho/StudioProjects/atu-app/docker-compose.yml)
Atualizaremos o caminho do `build` e dos `volumes` para apontar para `./frontend`.

#### [KEEP] [docs/](file:///C:/Users/pinho/StudioProjects/atu-app/docs)
Manteremos na raiz por ser documentação geral do projeto.

#### [KEEP] [README.md](file:///C:/Users/pinho/StudioProjects/atu-app/README.md)
Arquivo de apresentação do repositório.

#### [KEEP] [.gitignore](file:///C:/Users/pinho/StudioProjects/atu-app/.gitignore)
Pode precisar de ajustes, mas deve permanecer na raiz para controlar o repositório todo.

## Plano de Verificação

### Verificação Manual
1. Verificar se a estrutura de pastas está correta.
2. Atualizar o `docker-compose.yml` e garantir que o comando `docker-compose build` funcione apontando para a nova pasta.
3. Verificar se o Expo consegue iniciar corretamente de dentro da pasta `frontend`.
