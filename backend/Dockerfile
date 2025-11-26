# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

ENV PORT=5000
ENV NODE_ENV=development

EXPOSE 5000

# En lugar de "npm run dev" (nodemon) mejor usar start
CMD ["npm", "start"]
