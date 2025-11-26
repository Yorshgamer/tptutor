# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# MUY IMPORTANTE: --host 0.0.0.0 para que se vea desde afuera
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
