# 🚀 Guia de Deployment - Finanças Bot

## 📋 Índice

1. [Deploy Local (Desenvolvimento)](#deploy-local-desenvolvimento)
2. [Deploy em Staging](#deploy-em-staging)
3. [Deploy em Produção](#deploy-em-produção)
4. [Arquitetura do Deploy](#arquitetura-do-deploy)
5. [Troubleshooting](#troubleshooting)
6. [Monitoramento](#monitoramento)

---

## Deploy Local (Desenvolvimento)

### Pré-requisitos

- Docker Desktop instalado (Windows/Mac) ou Docker + Docker Compose (Linux)
- PostgreSQL 16+ (ou usar container)
- Node.js 18+ (apenas para desenvolvimento local sem Docker)

### Setup Rápido

#### 1. Clonar repositório

```bash
git clone <seu-repo>
cd botFinancaSheet
```

#### 2. Configurar variáveis de ambiente

```bash
# Backend
cp .env.example .env
# Editar .env com valores locais (ou deixar defaults)

# Frontend
cd apps/web
cp .env.local.example .env.local
# Se necessário, editar com API URL local
```

#### 3. Instalar dependências localmente (opcional)

Se preferir executar sem Docker:

```bash
# Backend
npm install

# Frontend
cd apps/web
npm install
```

#### 4. Iniciar stack Docker Compose

```bash
# Do diretório raiz
docker-compose up -d

# Ou usar o script de deploy
./deploy.sh dev
```

#### 5. Verificar saúde dos serviços

```bash
# Ver logs
docker-compose logs -f

# Verificar containers
docker-compose ps

# Testar backend
curl http://localhost:3000/health

# Testar frontend
curl http://localhost:80
```

#### 6. Acessar aplicação

- **Frontend**: http://localhost (ou :80)
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **Webhook WhatsApp**: POST http://localhost:3000/webhook/whatsapp

### Estrutura de Desenvolvimento

```
botFinancaSheet/
├── src/                           # Backend NestJS
│   ├── domain/                   # Business logic
│   ├── application/              # Use cases, DTOs
│   └── infrastructure/           # Controllers, repos
├── apps/web/                      # Frontend Next.js
│   ├── src/app/                  # Páginas (app router)
│   └── src/components/           # Componentes React
├── docker-compose.yml            # Orquestração
├── Dockerfile                    # Backend image
└── nginx/nginx.conf              # Reverse proxy
```

---

## Deploy em Staging

### Setup inicial

#### 1. Provisionar servidor

Recomendações:

- **VPS**: DigitalOcean, Linode, ou similar
- **CPU**: 2+ cores
- **RAM**: 2-4GB mínimo
- **Disco**: 20GB+
- **OS**: Ubuntu 20.04 LTS

#### 2. Instalar Docker

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar
docker --version
docker-compose --version
```

#### 3. Clonar repositório

```bash
cd /opt
sudo git clone <seu-repo> botfinanca
cd botfinanca
```

#### 4. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado (para seu domínio)
sudo certbot certonly --standalone -d staging.seu-dominio.com

# Certificados estarão em:
# /etc/letsencrypt/live/staging.seu-dominio.com/

# Copiar para projeto (ou mapear volume em docker-compose)
sudo cp /etc/letsencrypt/live/staging.seu-dominio.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/staging.seu-dominio.com/privkey.pem ./nginx/ssl/key.pem
```

#### 5. Configurar variáveis

```bash
# Copiar e editar
cp .env .env.staging

# Editar com valores staging
nano .env.staging
# Valores importantes:
# - DB_PASSWORD (senha segura)
# - JWT_SECRET (chave aleatória longa)
# - TWILIO_* (credenciais)
# - NEXT_PUBLIC_API_URL=https://staging.seu-dominio.com
```

#### 6. Iniciar stack

```bash
# Dar permissões
chmod +x deploy.sh

# Deploy
./deploy.sh staging

# Ou docker-compose direto
docker-compose up -d
```

#### 7. Verificar

```bash
# Acessar
https://staging.seu-dominio.com   # Frontend
https://staging.seu-dominio.com/api/auth/solicitar-otp  # Backend

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

---

## Deploy em Produção

### ⚠️ Checklist Pré-Deploy

- [ ] Código testado em staging
- [ ] SSL/TLS certificados válidos (Let's Encrypt)
- [ ] Backups do banco de dados configurados
- [ ] Monitoração ativa (Sentry, Datadog, etc)
- [ ] CDN configurada (opcional)
- [ ] Firewall restritivo
- [ ] Alertas de uptime/performance

### 1. Setup do Servidor de Produção

```bash
# Mesmo processo de staging, mas com domínio de produção
cd /opt
sudo git clone <seu-repo> botfinanca-prod
cd botfinanca-prod

# SSL com certificado válido
sudo certbot certonly --standalone -d seu-dominio.com -d api.seu-dominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem ./nginx/ssl/key.pem
```

### 2. Variáveis de Produção

```bash
cp .env.prod .env.prod.local

# Editar com valores REAIS e SEGUROS
nano .env.prod.local

# Variáveis críticas:
# DB_PASSWORD: senha complexa (caracteres especiais, 20+ chars)
# JWT_SECRET: use `openssl rand -hex 32` para gerar
# TWILIO_*: credenciais do dashboard da Twilio
# DOMAIN: seu domínio (usado para cookies/CORS)
```

### 3. Automatizar Renovação de SSL

```bash
# Criar script de renovação
sudo nano /opt/botfinanca-prod/renew-ssl.sh

#!/bin/bash
certbot renew --quiet
docker-compose -f /opt/botfinanca-prod/docker-compose.yml restart nginx

# Fazer executável
sudo chmod +x /opt/botfinanca-prod/renew-ssl.sh

# Adicionar ao crontab (executar todo dia à 3 da manhã)
sudo crontab -e

# Adicionar linha:
# 0 3 * * * /opt/botfinanca-prod/renew-ssl.sh >> /var/log/renew-ssl.log 2>&1
```

### 4. Configurar Reverse Proxy (Nginx no Dockerfile)

O docker-compose.yml usa nginx automaticamente. Ver configuração em `nginx/nginx.conf`.

Key points:

- SSL handling (HTTPS redirect)
- Static file caching
- API routing
- Rate limiting (opcional)

### 5. Deploy com Zero Downtime

```bash
# Versioning - tag seu container
docker build -t botfinanca:v1.0.0 .

# Push para registry (Docker Hub, ECR, etc)
docker push seu-usuario/botfinanca:v1.0.0

# Update docker-compose.yml para usar tag specific
# services:
#   backend:
#     image: seu-usuario/botfinanca:v1.0.0

# Pull nova versão
docker-compose pull

# Restart com zero downtime (rolling updates)
docker-compose up -d
```

### 6. Backup de Banco de Dados

```bash
# Backup automático diário
sudo nano /opt/botfinanca-prod/backup-db.sh

#!/bin/bash
BACKUP_DIR="/opt/botfinanca-prod/backups"
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump \
  -U $(grep DB_USERNAME .env | cut -d = -f 2) \
  -d $(grep DB_NAME .env | cut -d = -f 2) \
  > "$BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql"

# Fazer executável
sudo chmod +x /opt/botfinanca-prod/backup-db.sh

# Adicionar ao crontab (executar todo dia à 2 da manhã)
# 0 2 * * * /opt/botfinanca-prod/backup-db.sh >> /var/log/backup-db.log 2>&1
```

### 7. CI/CD (GitHub Actions)

Criar `.github/workflows/deploy-prod.yml`:

```yaml
name: Deploy Produção

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login Docker Registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin

      - name: Build e Push
        run: |
          docker build -t seu-usuario/botfinanca:${{ github.ref_name }} .
          docker push seu-usuario/botfinanca:${{ github.ref_name }}

      - name: Deploy SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/botfinanca-prod
            docker-compose pull
            docker-compose up -d
```

---

## Arquitetura do Deploy

```
Internet
   │
   └── Nginx (Reverse Proxy)
        ├── HTTPS redirect
        ├── Load balancing
        └── Static serving
             │
        ┌────┴────┐
        │          │
    Backend    Frontend
    (NestJS)  (Next.js)
     :3000     :3001
        │
    PostgreSQL
      :5432
```

### Fluxo de Requisição

1. **HTTP/HTTPS** → Nginx (porta 80/443)
2. **Nginx** → determina rota:
   - `/api/*` → Backend (porta 3000)
   - `/webhook/*` → Backend (porta 3000, sem JWT)
   - `/*` → Frontend (porta 3001)
3. **Backend** → PostgreSQL (intra-rede Docker)
4. **Frontend** → Zustand store + Axios → Backend API

---

## Troubleshooting

### Backend não responde

```bash
# Ver logs do backend
docker-compose logs backend

# Verificar se banco está saudável
docker-compose exec backend curl postgres:5432

# Reiniciar backend
docker-compose restart backend

# Verificar porta 3000
docker-compose ps
```

### Frontend branco (erro ao conectar API)

```bash
# Verificar NEXT_PUBLIC_API_URL
docker-compose exec frontend env | grep API_URL

# Testar conectividade interna
docker-compose exec frontend curl http://backend:3000/health

# Ver logs frontend
docker-compose logs frontend
```

### Banco de dados não persiste

```bash
# Verificar volume Docker
docker volume ls
docker inspect botfinanca_postgres_data

# Checar permissões da pasta
ls -la volumes/
```

### SSL/TLS certificate expirado

```bash
# Renovar manually
sudo certbot renew

# Ou verificar status
sudo certbot certificates

# Restart nginx
docker-compose restart nginx
```

---

## Monitoramento

### Health Checks

```bash
# Backend
curl https://seu-dominio.com/api/health

# Frontend
curl https://seu-dominio.com/

# Banco
docker-compose exec postgres pg_isready
```

### Logs Centralizados

Recomendação: Integrar com ELK Stack ou Datadog

```yaml
# docker-compose.yml
logging:
  driver: splunk
  options:
    splunk-token: ${SPLUNK_TOKEN}
    splunk-url: https://seu-splunk.com
```

### Métricas

- **Uptime**: Pingdom, StatusPage.io
- **Performance**: New Relic, Datadog
- **Erros**: Sentry, Rollbar
- **Tráfego**: Google Analytics

### Alertas Recomendados

- Backend down (status 500 > 5min)
- Frontend down (status 404 > 5min)
- Banco de dados offline
- Certificado SSL expirando (7 dias antes)
- Disco quase cheio
- CPU/RAM acima de 80%

---

## Rollback de Emergency

```bash
# Listar versões anteriores
docker image ls | grep botfinanca

# Voltar para versão anterior
docker-compose up -d backend:v1.0.0

# Ou via docker-compose.yml
# services:
#   backend:
#     image: seu-usuario/botfinanca:v1.0.0

docker-compose up -d
```

---

## Conformidade & Segurança

- [ ] HTTPS/TLS obrigatório
- [ ] CORS configurado para seu domínio apenas
- [ ] Senhas do banco: 20+ caracteres
- [ ] JWT secret: gerado com `openssl rand -hex 32`
- [ ] Logs auditados (logins, mudanças de dados)
- [ ] Rate limiting no API gateway
- [ ] DDoS protection (Cloudflare, AWS Shield)
- [ ] Backups diários testados

---

**Dúvidas?** Ver [README.md](README.md) ou abrir issue no GitHub.
