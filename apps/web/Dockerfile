# ──────────────────────────────────────────────────────────────────────────────
# Multi-stage build para Next.js frontend
# ──────────────────────────────────────────────────────────────────────────────

# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Instalar dependências
RUN npm install --frozen-lockfile
RUN cd apps/web && npm install --frozen-lockfile

# Copiar código fonte
COPY apps/web ./apps/web

# Build Next.js
WORKDIR /app/apps/web
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Copiar apenas os arquivos necessários do builder
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Exposar porta
EXPOSE 3000

# Iniciar Next.js
CMD ["npm", "start"]
