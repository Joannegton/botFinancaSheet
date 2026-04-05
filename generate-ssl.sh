#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# Self-signed SSL certificate generator
# Gera certificados para uso local/staging
# ─────────────────────────────────────────────────────────────────────────────

set -e

CERT_DIR="./nginx/ssl"
CERT_FILE="cert.pem"
KEY_FILE="key.pem"
DAYS=365

echo "🔐 Gerando certificado SSL autoassinado..."

# Criar diretório se não existir
mkdir -p "$CERT_DIR"

# Gerar certificate e private key
openssl req -x509 -newkey rsa:4096 -nodes \
  -out "$CERT_DIR/$CERT_FILE" \
  -keyout "$CERT_DIR/$KEY_FILE" \
  -days "$DAYS" \
  -subj "/C=BR/ST=São Paulo/L=São Paulo/O=Finanças Bot/CN=localhost"

echo "✅ Certificado gerado:"
echo "   Arquivo: $CERT_DIR/$CERT_FILE (público)"
echo "   Chave:   $CERT_DIR/$KEY_FILE (privado)"
echo ""
echo "Para usar em produção, obtenha um certificado válido de uma Certificate Authority"
echo "(p.ex. Let's Encrypt via Certbot)"
