#!/bin/bash

# Setup Backend
echo "================================================"
echo "Instalando dependências do Backend..."
echo "================================================"
npm install

# Create .env if not exists
if [ ! -f .env ]; then
  echo "Criando arquivo .env..."
  cp .env.example .env
  echo "⚠️  Edite .env com seus dados do Twilio"
fi

# Setup Frontend
echo ""
echo "================================================"
echo "Instalando dependências do Frontend..."
echo "================================================"
cd apps/web
npm install

# Create .env.local if not exists
if [ ! -f .env.local ]; then
  echo "Criando arquivo .env.local..."
  cp .env.example .env.local
fi

cd ../..

echo ""
echo "================================================"
echo "✅ Setup Completo!"
echo "================================================"
echo ""
echo "Próximos passos:"
echo "1. Edite .env com credenciais do Twilio"
echo "2. Backend:    npm run start:dev"
echo "3. Frontend:   cd apps/web && npm run dev"
echo ""
echo "Backend:   http://localhost:3000"
echo "Frontend:  http://localhost:3000"
echo ""
