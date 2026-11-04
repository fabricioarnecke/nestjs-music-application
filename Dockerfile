# Build stage: installs every dependency and compiles the app
FROM node:26-slim AS build

# Prisma needs OpenSSL to pick its query engine
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run prisma-generate \
  && npm run build \
  && npm prune --omit=dev

# Runtime stage: only the compiled app and the production dependencies
FROM node:26-slim

# ca-certificates lets Prisma verify the TLS certificate of a hosted database
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

# Run as the unprivileged user that comes with the Node image
USER node

EXPOSE 3000

# Applies pending migrations, creates the admin user if it's missing, then starts
# the API. exec makes Node PID 1, so it gets the stop signal and shuts down cleanly
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/prisma/seed.js && exec node dist/src/main"]
