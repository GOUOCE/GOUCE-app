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
- **Node.js**: Versão LTS recomendada.
- **Gerenciador de Pacotes**: npm ou yarn.
- **Expo Go**: Instalado no seu smartphone (Android/iOS) para testar fisicamente.

### 2. Configuração Inicial
Clone o repositório e instale as dependências:
```bash
npm install
```

Crie o arquivo de variáveis de ambiente a partir do exemplo:
```bash
cp .env.example .env
```
> Certifique-se de definir a `EXPO_PUBLIC_API_URL` com o IP da sua máquina ou a URL do backend.

### 3. Execução Local
Inicie o servidor de desenvolvimento:
```bash
npm start
```
Após o comando, um QR Code aparecerá no terminal. Escaneie-o com o aplicativo **Expo Go** no seu celular.

### 4. Execução via Docker (Opcional)
Caso prefira rodar o ambiente isolado:
```bash
docker-compose up --build
```
O container servirá o Metro Bundler na porta `8081`.
---
Este projeto faz parte da disciplina de Projeto Integrado III - UFC Quixadá.
