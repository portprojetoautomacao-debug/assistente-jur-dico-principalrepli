FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifests primeiro para maximizar cache
COPY package*.json ./
COPY backend/package*.json ./backend/

# Instalar dependências (root + backend) para build
RUN npm ci --legacy-peer-deps
RUN cd backend && npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build do frontend
RUN npm run build

# Build do backend
RUN cd backend && npm run build

# Stage de produção: Node (API + servir SPA)
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copiar build do frontend e backend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend/dist ./backend/dist

# Instalar apenas dependências de produção do backend
COPY --from=builder /app/backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev --legacy-peer-deps

# Railway define PORT; o servidor lê PORT/BACKEND_PORT
EXPOSE 3001

# Iniciar servidor backend (também serve o frontend estático em produção)
# IMPORTANTE: NODE_OPTIONS para carregar datadog tracer ANTES do app
# Atualizado para usar Railpack config se disponível
CMD ["node", "-r", "./backend/dist/backend/src/datadog.js", "backend/dist/backend/src/server.js"]
