FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package.json ./

# Instala dependências com suporte a conflitos de versão do React 19
RUN npm install --legacy-peer-deps

# Copia o restante do código
COPY . .

# Expõe as portas do Expo
EXPOSE 8081 19000 19001 19002

# Comando para iniciar o servidor Metro do Expo
CMD ["npx", "expo", "start", "--tunnel"]
