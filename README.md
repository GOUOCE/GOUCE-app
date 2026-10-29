# GOUCE - Gestão de Ônibus Universitários de Ocara-CE (Mobile)

Este repositório contém o código-fonte da aplicação mobile do sistema GOUCE, desenvolvido em React Native com Expo. O objetivo é gerenciar o transporte universitário de Ocara-CE.

## Tecnologias Utilizadas

- **React Native** (v0.74.5)
- **Expo** (v51)
- **Expo Router** (Navegação baseada em arquivos)
- **TypeScript**
- **TanStack Query** (Gerenciamento de estado e cache de rede)
- **Axios** (Cliente HTTP)
- **Zod & React Hook Form** (Validação e gestão de formulários)

## Estrutura de Pastas

```text
src/
 ├── api/        # Instância do Axios e definições de serviços
 ├── app/        # Rotas e telas (Navegação Expo Router)
 ├── components/ # Componentes visuais reutilizáveis
 ├── constants/  # Cores, temas e configurações globais
 ├── contexts/   # Provedores de estado global (ex: Autenticação)
 ├── hooks/      # Hooks customizados
 └── utils/      # Funções auxiliares e helpers
```

## Como Executar o Projeto

### 1. Pré-requisitos
- **Docker Desktop** com o engine Linux ativo.
- **Expo Go** instalado no seu smartphone (Android/iOS), caso queira testar em um dispositivo físico.

### 2. Configuração do backend
O backend usa as variáveis definidas em `backend/.env`. Se o arquivo ainda não existir, copie o exemplo:
```bash
cp backend/.env.example backend/.env
```

### 3. Executar frontend e backend com Docker
Na raiz do projeto, execute:
```bash
docker compose up --build
```

Os serviços ficarão disponíveis em:
- **Frontend/Expo:** `http://localhost:8081`
- **Backend/API:** `http://localhost:8000`
- **Health check:** `http://localhost:8000/health`

Para parar os containers:
```bash
docker compose down
```

### 4. Executar somente o frontend localmente (Desenvolvimento Mobile)
Com o Node.js instalado, siga estes passos para garantir a comunicação com a API:

1.  **Instale as dependências:**
    ```bash
    npm install --legacy-peer-deps
    ```

2.  **Configure o IP da API:**
    Para que o celular/emulador encontre o backend na sua rede, crie um arquivo `.env` na raiz do projeto com o seu IP local (descubra usando `ipconfig` no Windows):
    ```text
    EXPO_PUBLIC_API_URL=http://SEU_IP_AQUI:3000
    ```

3.  **Inicie o Expo:**
    ```bash
    npx expo start --tunnel
    ```

---
Este projeto faz parte da disciplina de Projeto Integrado III - UFC Quixadá.
