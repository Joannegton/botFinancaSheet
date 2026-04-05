#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# Deploy Script - Finanças Bot Backend + Frontend
# 
# Uso:
#   ./deploy.sh dev      # Deploy em desenvolvimento
#   ./deploy.sh prod     # Deploy em produção
# ─────────────────────────────────────────────────────────────────────────────

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🚀 Iniciando Deploy - Ambiente: $ENVIRONMENT"
echo "═══════════════════════════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────────────────
# 1. Validar ambiente
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "📋 Validando ambiente..."

if ! command -v docker &> /dev/null; then
  echo "❌ Docker não encontrado. Por favor, instale Docker."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose não encontrado. Por favor, instale Docker Compose."
  exit 1
fi

echo "✅ Docker e Docker Compose encontrados"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Carregar variáveis de ambiente
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "⚙️  Carregando variáveis de ambiente..."

if [ "$ENVIRONMENT" = "prod" ]; then
  ENV_FILE=".env.prod"
else
  ENV_FILE=".env"
fi

if [ ! -f "$SCRIPT_DIR/$ENV_FILE" ]; then
  echo "❌ Arquivo $ENV_FILE não encontrado em $SCRIPT_DIR"
  exit 1
fi

export $(cat "$SCRIPT_DIR/$ENV_FILE" | grep -v '^#' | xargs)
echo "✅ Variáveis carregadas de $ENV_FILE"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Parar containers antigos
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "🛑 Parando containers antigos (se houver)..."

docker-compose -f "$SCRIPT_DIR/docker-compose.yml" down || true
echo "✅ Containers antigos parados"

# ─────────────────────────────────────────────────────────────────────────────
# 4. Build containers
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "🔨 Construindo containers..."

docker-compose -f "$SCRIPT_DIR/docker-compose.yml" build --no-cache
echo "✅ Containers construídos"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Iniciar stack
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "▶️  Iniciando stack Docker Compose..."

docker-compose -f "$SCRIPT_DIR/docker-compose.yml" up -d
echo "✅ Stack iniciada"

# ─────────────────────────────────────────────────────────────────────────────
# 6. Aguardar health checks
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "⏳ Aguardando serviços ficarem saudáveis..."

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if docker-compose -f "$SCRIPT_DIR/docker-compose.yml" exec -T backend curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Backend saudável"
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "⏳ Tentativa $ATTEMPT/$MAX_ATTEMPTS..."
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "⚠️  Backend não respondeu a tempo. Verificando logs..."
  docker-compose -f "$SCRIPT_DIR/docker-compose.yml" logs backend
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# 7. Verificar status
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "📊 Status dos containers:"
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" ps

# ─────────────────────────────────────────────────────────────────────────────
# 8. Exibir informações de acesso
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "✅ Deploy concluído com sucesso!"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "📍 Acessar aplicação:"
echo "   🌐 Frontend:  http://localhost:80"
echo "   📡 Backend:   http://localhost:3000"
echo "   📚 API Docs:  http://localhost:3000/docs"
echo ""
echo "🐳 Comandos úteis:"
echo "   docker-compose logs -f backend     # Ver logs do backend"
echo "   docker-compose logs -f frontend    # Ver logs do frontend"
echo "   docker-compose logs -f postgres    # Ver logs do banco"
echo "   docker-compose down                 # Parar stack"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
