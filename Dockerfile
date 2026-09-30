FROM node:24

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run prisma-generate

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main"]
