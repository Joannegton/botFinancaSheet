#!/bin/sh

echo "🔄 Sincronizando banco de dados..."
node dist/database-sync.js

if [ $? -ne 0 ]; then
  echo "❌ Falha na sincronização do banco"
  exit 1
fi

echo "✅ Banco sincronizado. Iniciando aplicação..."
node dist/main
