# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiamos package.json y package-lock.json si existe
COPY package*.json ./

# Instalamos TODAS las dependencias (prod + dev)
RUN npm install

# Copiamos el resto del código
COPY . .

ENV PORT=5000
ENV NODE_ENV=development

EXPOSE 5000

CMD ["npm", "run", "dev"]
