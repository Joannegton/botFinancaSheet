#!/bin/bash

# Script de setup inicial do projeto

echo "🚀 Iniciando setup do projeto..."

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js 20 ou superior."
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verifica se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado."
    exit 1
fi

echo "✅ npm $(npm -v) detectado"

# Instala as dependências
echo "📦 Instalando dependências..."
npm install

# Verifica se o arquivo .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando .env.example..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Por favor, configure suas credenciais."
    echo ""
    echo "📝 Você precisa editar o arquivo .env e adicionar:"
    echo "   - TELEGRAM_BOT_TOKEN (obtenha com @BotFather)"
    echo "   - TELEGRAM_USER_ID (obtenha com @userinfobot)"
    echo "   - GOOGLE_SHEETS_SPREADSHEET_ID"
    echo "   - GOOGLE_SERVICE_ACCOUNT_EMAIL"
    echo "   - GOOGLE_PRIVATE_KEY"
    echo ""
    exit 0
fi

echo "✅ Arquivo .env encontrado"

# Verifica se as variáveis essenciais estão configuradas
if grep -q "your_bot_token_here" .env; then
    echo "⚠️  Você ainda precisa configurar o TELEGRAM_BOT_TOKEN no arquivo .env"
    exit 1
fi

if grep -q "your_telegram_user_id_here" .env; then
    echo "⚠️  Você ainda precisa configurar o TELEGRAM_USER_ID no arquivo .env"
    exit 1
fi

if grep -q "your_spreadsheet_id_here" .env; then
    echo "⚠️  Você ainda precisa configurar o GOOGLE_SHEETS_SPREADSHEET_ID no arquivo .env"
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"

# Build do projeto
echo "🔨 Compilando o projeto..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup concluído com sucesso!"
    echo ""
    echo "Para iniciar a aplicação:"
    echo "  - Desenvolvimento: npm run start:dev"
    echo "  - Produção: npm run start:prod"
    echo "  - Docker: docker-compose up -d"
    echo ""
else
    echo "❌ Erro ao compilar o projeto"
    exit 1
fi
