FROM node:20-slim AS builder

WORKDIR /app

# Install client dependencies first for better layer caching.
COPY client/package*.json ./client/
RUN npm ci --prefix client

COPY client ./client
RUN npm run build --prefix client

FROM node:20-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY --from=builder /app/client/dist ./client/dist

RUN chown -R node:node /app
USER node

EXPOSE 5000

CMD ["node", "server/server.js"]
