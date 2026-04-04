# 🛡️ Guia Completo: Setup Seguro VPS com Docker, SSL e Nginx

**Projeto:** botFinancaSheet  
**Domínios:** www.botfinanca.joannegton.com | botfinanca.joannegton.com  
**Data:** 2026  
**Versão:** 1.0

---

## 📋 Índice

1. [Checklist de Segurança](#checklist-de-segurança)
2. [Fase 1: Preparação do Servidor](#fase-1-preparação-do-servidor)
3. [Fase 2: Hardening de Segurança](#fase-2-hardening-de-segurança)
4. [Fase 3: Instalação de Dependências](#fase-3-instalação-de-dependências)
5. [Fase 4: Configuração do Docker](#fase-4-configuração-do-docker)
6. [Fase 5: Nginx como Reverse Proxy](#fase-5-nginx-como-reverse-proxy)
7. [Fase 6: SSL/TLS com Let's Encrypt](#fase-6-ssltls-com-lets-encrypt)
8. [Fase 7: Deploy da Aplicação](#fase-7-deploy-da-aplicação)
9. [Fase 8: Monitoramento e Manutenção](#fase-8-monitoramento-e-manutenção)
10. [Troubleshooting](#troubleshooting)

---

## ✅ Checklist de Segurança

Marque cada item conforme implementar:

### Usuários e Acesso

- [ ] Desabilitar acesso SSH via root
- [ ] Criar usuário dedicado (não-root)
- [ ] Configurar chaves SSH (sem password login)
- [ ] Configurar sudo sem password para tarefas críticas
- [ ] Remover acesso via password (apenas SSH keys)

### Firewall e Rede

- [ ] UFW ativado e configurado
- [ ] Abrir apenas portas necessárias (22, 80, 443)
- [ ] Rejeitar tráfego entrante por padrão
- [ ] Permitir tráfego sainte conforme necessário
- [ ] Fail2ban instalado e configurado (anti-brute force)

### Sistema Operacional

- [ ] Atualizações de sistema aplicadas (apt update && apt upgrade)
- [ ] Configurar unattended-upgrades (patches automáticos)
- [ ] NTP sincronizado
- [ ] Timezone configurado corretamente
- [ ] Logs do sistema monitorados (/var/log)

### Docker e Containers

- [ ] Docker instalado e atualizado
- [ ] Docker Compose instalado (v2.0+)
- [ ] Usuário agregado ao grupo docker
- [ ] Docker daemon configurado (resource limits)
- [ ] Containers rodam como non-root
- [ ] Volumes com permissões corretas

### SSL/TLS

- [ ] Let's Encrypt certificado instalado
- [ ] Certbot configurado para renovação automática
- [ ] HTTPS redirecionando HTTP
- [ ] Headers de segurança configurados (HSTS, CSP)
- [ ] Certificado válido por 90 dias

### Nginx

- [ ] Nginx instalado e otimizado
- [ ] Reverse proxy configurado
- [ ] Gzip e compressão ativada
- [ ] Rate limiting configurado
- [ ] Logs acessíveis e monitorados
- [ ] Configuração de SSL segura (A+ em ssllabs.com)

### Banco de Dados

- [ ] PostgreSQL em container com volume persistente
- [ ] Backup automatizado configurado (diário)
- [ ] Password forte para BD
- [ ] Backups testados (restauração)
- [ ] Políticas de retenção de backups definidas

### Monitoramento

- [ ] Logs centralizados
- [ ] Health checks integrados
- [ ] Alertas para serviços críticos
- [ ] Disk space monitoring
- [ ] CPU/Memory monitoring
- [ ] Uptime monitoring externo

### Aplicação

- [ ] Variáveis de ambiente em .env (não no git)
- [ ] Segredos do Twilio armazenados seguramente
- [ ] Credenciais Google em pasta segura
- [ ] Rate limiting na API
- [ ] Validação e sanitização de inputs
- [ ] Logs estruturados (JSON)

### Backup e DR

- [ ] Backup automático do banco de dados (diário)
- [ ] Backup de configurações (/etc/nginx, compose files)
- [ ] Plano de disaster recovery documentado
- [ ] Backup testado mensalmente
- [ ] Retenção mínima 30 dias

---

## Fase 1: Preparação do Servidor

### 1.1 Conectar ao VPS

```bash
# Conectar via SSH (remplace IP com seu IP ou hostname)
ssh root@seu_ip_vps

# Ou se usar porta customizada
ssh -p 2222 root@seu_ip_vps
```

### 1.2 Atualizar Sistema

```bash
apt update && apt upgrade -y
apt install -y wget curl git acl vim nano htop net-tools
```

### 1.3 Configurar Hostname (fazer depois)

```bash
hostnamectl set-hostname botfinanca-prod
nano /etc/hosts
# Adicione a linha:
# 127.0.0.1 localhost botfinanca-prod
```

### 1.4 Setuar Timezone

```bash
timedatectl set-timezone America/Sao_Paulo
# Verificar
timedatectl
```

### 1.5 Configurar NTP (horário sincronizado)

```bash
apt install -y chrony
systemctl enable chrony
systemctl start chrony
chronyc tracking
```

---

## Fase 2: Hardening de Segurança

### 2.1 Criar Usuário Não-Root

```bash
# Criar usuário
useradd -m -s /bin/bash -G sudo botadmin

# Definir password (temporário)
passwd botadmin

# Configurar sudo sem password para comandos específicos
visudo
# Adicionar esta linha no final:
# botadmin ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/docker, /usr/bin/apt

# Ou para permitir tudo sem password (menos seguro):
# botadmin ALL=(ALL) NOPASSWD: ALL
```

### 2.2 Configurar SSH com Chaves

**Na sua máquina local** (Windows PowerShell ou WSL):

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu_email@exemplo.com"

# Salvar em C:\Users\seu_usuario\.ssh\id_ed25519 (Windows)
# Ou ~/.ssh/id_ed25519 (Linux/Mac)
```

**De volta no servidor VPS:**

```bash
# Logar com novo usuário (com password temporário)
su - botadmin

# Criar diretório .ssh
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Copiar chave pública (da sua máquina local)
# Cole aqui a chave pública (conteúdo de id_ed25519.pub)
echo "sua_chave_publica_aqui" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verificar
cat ~/.ssh/authorized_keys
```

### 2.3 Desabilitar SSH via Root e Password

```bash
# Como root, editar SSH config
sudo nano /etc/ssh/sshd_config

# Procure e altere para:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
MaxSessions 5

# Reiniciar SSH
sudo systemctl restart ssh

# NÃO feche a conexão até testar em novo terminal!
```

**Testar nova conexão (local):**

```bash
# Deve conectar sem senha
ssh -i ~/.ssh/id_ed25519 botadmin@seu_ip_vps
```

### 2.4 Firewall (UFW)

```bash
# Como botadmin com sudo
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Regras essenciais
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS

# Verificar
sudo ufw status verbose

# Permitir SSH em porta customizada (se desejado)
# sudo ufw allow 2222/tcp
```

### 2.5 Fail2ban Anti-Brute Force

```bash
sudo apt install -y fail2ban

# Configuração básica
sudo nano /etc/fail2ban/jail.local

# Adicionar ou verificar:
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

# Iniciar
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban
```

### 2.6 SELinux ou AppArmor (Opcional mas Recomendado)

```bash
# Verificar AppArmor (Ubuntu/Debian)
systemctl status apparmor

# AppArmor já vem ativado por padrão em Ubuntu
# Docker tem suporte integrado
```

### 2.7 Desabilitar Serviços Desnecessários

```bash
# Listar serviços
sudo systemctl list-units --type=service --state=running

# Desabilitar se não precisar
sudo systemctl disable bluetooth
sudo systemctl disable cups
sudo systemctl disable avahi-daemon
```

---

## Fase 3: Instalação de Dependências

### 3.1 Instalar Docker

```bash
# Remover Docker antigo (se existir)
sudo apt remove -y docker docker-engine docker.io containerd runc

# Instalar dependências
sudo apt install -y curl gnupg lsb-release ca-certificates apt-transport-https

# Adicionar repositório Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Iniciar
sudo systemctl enable docker
sudo systemctl start docker

# Verificar
docker --version
sudo docker run hello-world

# Adicionar usuário ao grupo docker (requer logout/login)
sudo usermod -aG docker $USER
newgrp docker
```

### 3.2 Instalar Docker Compose v2

```bash
# URL da versão mais recente
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins

# Baixar (verificar versão em https://github.com/docker/compose/releases)
curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose

chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# Verificar
docker compose version
```

### 3.3 Instalar Nginx

```bash
sudo apt install -y nginx

# Iniciar
sudo systemctl enable nginx
sudo systemctl start nginx

# Verificar
sudo systemctl status nginx
curl http://localhost
```

### 3.4 Instalar Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Verificar
certbot --version
```

### 3.5 Instalar Git

```bash
sudo apt install -y git

# Configurar (opcional)
git config --global user.name "Seu Nome"
git config --global user.email "seu_email@exemplo.com"

# Gerar SSH para Git (se não tiver)
ssh-keygen -t ed25519 -C "seu_email@exemplo.com" -f ~/.ssh/github_key
cat ~/.ssh/github_key.pub  # Adicionar em https://github.com/settings/keys
```

### 3.6 Criar Estrutura de Diretórios

```bash
# Criar directories para aplicação
mkdir -p ~/apps

# Navegar
cd ~/apps
```

---

## Fase 4: Configuração do Docker

### 4.1 Clonar Repositório

```bash
cd ~/apps

# Clonar repositório (vai criar pasta botFinancaSheet/)
git clone https://github.com/Joannegton/botFinancaSheet.git
# Ou se tiver chaves SSH:
git clone git@github.com:Joannegton/botFinancaSheet.git

# Navegar para dentro
cd botFinancaSheet
```

### 4.2 Configurar Variáveis de Ambiente

```bash
# Entrar no repositório
cd ~/apps/botFinancaSheet

# Copiar .env se ainda não tiver
cp ../.env .env 2>/dev/null || echo "Criar .env manualmente"

# Verificar se existe
ls -la .env

# Se não existir, criar:
nano .env
```

**Conteúdo do `.env` (deve estar em `~/apps/botFinancaSheet/.env`):**

```env
# Aplicação
NODE_ENV=production
PORT=3000

# Banco de Dados
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=botdb_user
DB_PASSWORD=SenhaForteMuito123!@#
DB_NAME=bot_financa_prod

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=AC...seu_sid_aqui
TWILIO_AUTH_TOKEN=seu_token_aqui
TWILIO_WHATSAPP_NUMBER=+14155238886

# Google Sheets (se usar)
# Guardar credenciais em arquivo separado, não no .env
```

**Proteger .env:**

```bash
chmod 600 .env
cat .env  # Verificar conteúdo apenas uma vez
```

### 4.3 Configurar Docker Compose para Produção (fazer depois)

**Revisar/Atualizar `docker-compose.yml`:**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: bot-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - '5432:5432' # NÃO expor em produção, deixar interno apenas
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups # Volume para backups
    networks:
      - app-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USERNAME}']
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '5'

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: registro-gastos-bot
    restart: unless-stopped
    ports:
      - '127.0.0.1:3000:3000' # Apenas localhost, Nginx faz proxy
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
    volumes:
      - ./logs:/app/logs
      - ./secrets:/app/secrets:ro # Credenciais Google (read-only)
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '5'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

**Mudanças importantes:**

- PostgreSQL não exposto para internet (apenas rede interna)
- App escuta apenas em 127.0.0.1:3000
- Nginx será o reverse proxy público

### 4.4 Testar Docker Compose Localmente

```bash
# Validar arquivo
docker compose config

# Build (primeira vez)
docker compose build

# Teste com dry-run
docker compose --dry-run up

# Iniciar em background
docker compose up -d

# Verificar logs
docker compose logs -f

# Parar
docker compose down
```

---

## Fase 5: Nginx como Reverse Proxy

### 5.1 Criar Arquivo Global de Rate Limiting

```bash
# Criar arquivo global com diretivas HTTP-level
sudo nano /etc/nginx/conf.d/rate_limit.conf
```

**Conteúdo de `/etc/nginx/conf.d/rate_limit.conf`:**

```nginx
# Rate limiting zones (HTTP level)
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=webhook:10m rate=50r/m;
```

### 5.2 Criar Diretório para Let's Encrypt

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot

# Verificar se foi criado
ls -la /var/www/
```

### 5.3 Criar Configuração Nginx Temporária (Sem SSL)

**⚠️ IMPORTANTE:** Esta é uma configuração **temporária** apenas para validação do Let's Encrypt.

```bash
sudo nano /etc/nginx/sites-available/botfinanca
```

**Conteúdo TEMPORÁRIO (apenas HTTP, sem SSL):**

```nginx
# Configuração TEMPORÁRIA - apenas para validação Let's Encrypt
server {
    listen 80;
    listen [::]:80;
    server_name botfinanca.joannegton.com www.botfinanca.joannegton.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "OK";
    }
}
```

### 5.4 Ativar Configuração Nginx Temporária

```bash
# Link simbólico
sudo ln -s /etc/nginx/sites-available/botfinanca /etc/nginx/sites-enabled/

# Remover default se existir (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar sintaxe
sudo nginx -t

# Recarregar
sudo systemctl reload nginx

# Verificar
curl http://botfinanca.joannegton.com
```

---

## Fase 6: SSL/TLS com Let's Encrypt

### 6.1 Gerar Certificado com Certbot

```bash
# Gerar certificado com validação HTTP
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d botfinanca.joannegton.com \
  -d www.botfinanca.joannegton.com \
  --email seu_email_real@exemplo.com \
  --agree-tos \
  --non-interactive

# Deve exibir: "Successfully received certificate" e datas de validade
```

### 6.2 Criar Configuração Nginx Final (Com SSL)

**Agora vamos substituir a configuração temporária pela versão final com SSL e reverse proxy.**

```bash
sudo nano /etc/nginx/sites-available/botfinanca
```

**Cole este conteúdo COMPLETO:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name botfinanca.joannegton.com www.botfinanca.joannegton.com;

    # Allow Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect tudo pra HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS com SSL
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name botfinanca.joannegton.com www.botfinanca.joannegton.com;

    # SSL - Certificado Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/botfinanca.joannegton.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/botfinanca.joannegton.com/privkey.pem;

    # Segurança SSL/TLS
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logs
    access_log /var/log/nginx/botfinanca_access.log;
    error_log /var/log/nginx/botfinanca_error.log warn;

    # Compressão
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml;

    # Reverse Proxy para NestJS (porta 3000)
    location / {
        limit_req zone=general burst=20 nodelay;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Headers de proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;

        # Websockets (se usar)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint (sem rate limit)
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_set_header Host $host;
        access_log off;
        error_log off;
    }

    # Webhook do Twilio (com rate limit permissivo)
    location /webhook {
        limit_req zone=webhook burst=5 nodelay;

        proxy_pass http://127.0.0.1:3000/webhook;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Denegar acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
    }
}
```

Salve com `Ctrl+X`, `Y`, `Enter`

### 6.3 Ativar Configuração Final com SSL

```bash
# Testar sintaxe
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Testar HTTPS
curl https://botfinanca.joannegton.com/health/ready
```

### 6.4 Configurar Renovação Automática

```bash
# Certbot/Let's Encrypt já configura renovação automaticamente
# Verificar:
sudo systemctl status certbot.timer
sudo systemctl enable certbot.timer

# Testar renovação (sem executar)
sudo certbot renew --dry-run

# Ver próxima renovação:
sudo systemctl list-timers certbot.timer
```

---

// TODO refazer

## Fase 7: Deploy da Aplicação

### 7.0 Reorganizar Estrutura de Diretórios

✅ Os scripts de deploy (`start.sh`, `stop.sh`, `backup.sh`) devem estar **dentro do repositório** (`botFinancaSheet/`) junto com o `docker-compose.yml`.

✅ O arquivo `.env` deve estar **dentro do repositório** (`botFinancaSheet/.env`), não fora.

**Preparar estrutura:**

```bash
# Navegar até o repositório
cd ~/apps/botFinancaSheet

# Copiar .env para este diretório (a partir de onde estiver)
# Se .env estava em ~/apps/botfinanca/:
cp ../.env .env

# Ou criar se não existir:
# nano .env

mkdir -p ~/apps/botFinancaSheet/backups
mkdir -p ~/apps/botFinancaSheet/logs

# Verificar que .env está aqui
ls -la .env
```

### 7.1 Criar Script de Inicialização

```bash
cd ~/apps/botFinancaSheet
nano start.sh
```

**Conteúdo:**

```bash
#!/bin/bash

set -e

echo "🚀 Iniciando botFinancaSheet em produção..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado em $SCRIPT_DIR!"
    exit 1
fi

# Atualizar código (opcional)
# git pull origin main

# Build imagem Docker
echo "🔨 Building Docker image..."
docker compose build

# Iniciar containers
echo "🐳 Starting containers..."
docker compose up -d

# Aguardar aplicação iniciar
echo "⏳ Waiting for app to be ready..."
sleep 10

# Verificar health
echo "🏥 Checking health..."
curl -f http://localhost:3000/health || exit 1

echo "✅ Aplicação iniciada com sucesso!"
docker compose ps
```

```bash
chmod +x ./start.sh
```

### 7.2 Criar Script de Parada

```bash
nano ./stop.sh
```

**Conteúdo:**

```bash
#!/bin/bash

set -e

echo "🛑 Parando botFinancaSheet..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

docker compose down

echo "✅ Aplicação parada."
```

```bash
chmod +x ./stop.sh
```

### 7.3 Criar Script de Backup

```bash
nano ./backup.sh
```

**Conteúdo:**

```bash
#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKUP_DIR="$SCRIPT_DIR/../backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bot_financa_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"

echo "📦 Iniciando backup do banco de dados..."

cd "$SCRIPT_DIR"

# Executar pg_dump dentro do container
docker compose exec -T postgres pg_dump \
    -U $DB_USERNAME \
    $DB_NAME > "$BACKUP_FILE"

# Comprimir
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Backup concluído: $BACKUP_FILE"

# Manter apenas últimos 30 backups
find "$BACKUP_DIR" -name "bot_financa_backup_*.sql.gz" -mtime +30 -delete

echo "🧹 Backups antigos removidos (mais de 30 dias)"
```

```bash
chmod +x ./backup.sh
```

### 7.4 Primeira Execução

```bash
# Navegar para o repositório
cd ~/apps/botfinanca/botFinancaSheet

# ⚠️ IMPORTANTE: Verificar se .env está aqui
ls -la .env
# Se não estiver, copiar:
cp ../.env .env

# Testar start script
./start.sh

# Verificar containers
docker compose ps

# Ver logs
docker compose logs -f

# Verificar acesso HTTP (deve redirecionar para HTTPS)
curl -I http://botfinanca.joannegton.com

# Verificar acesso HTTPS
curl https://botfinanca.joannegton.com/health
```

### 7.5 Configurar Auto-Inicialização (Systemd)

```bash
sudo nano /etc/systemd/system/botfinanca.service
```

**Conteúdo:**

```ini
[Unit]
Description=botFinancaSheet Application
After=network.target docker.service
Requires=docker.service

[Service]
Type=exec
User=botadmin
WorkingDirectory=/home/botadmin/apps/botfinanca/botFinancaSheet
ExecStart=/bin/bash -c 'docker compose up'
ExecStop=/bin/bash -c 'docker compose down'
Restart=unless-stopped
RestartSec=10

# Resource limits
MemoryLimit=2G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable botfinanca
sudo systemctl start botfinanca
sudo systemctl status botfinanca
```

---

## Fase 8: Monitoramento e Manutenção

### 8.1 Logs e Monitoramento

```bash
# Navegar para repositório
cd ~/apps/botfinanca/botFinancaSheet

# Ver logs da aplicação
docker compose logs -f app

# Ver logs do PostgreSQL
docker compose logs -f postgres

# Ver logs do Nginx
sudo tail -f /var/log/nginx/botfinanca_access.log
sudo tail -f /var/log/nginx/botfinanca_error.log

# Ver logs do sistema
sudo journalctl -u botfinanca -f
```

### 8.2 Health Checks

```bash
# Navegar para repositório
cd ~/apps/botfinanca/botFinancaSheet

# Verificar saúde geral
sudo systemctl status botfinanca
docker compose ps

# Testar aplicação
curl https://botfinanca.joannegton.com/health

# Verificar certificado SSL
echo | openssl s_client -servername botfinanca.joannegton.com -connect botfinanca.joannegton.com:443 2>/dev/null | openssl x509 -dates
```

### 8.3 Setup de Backup Automatizado

```bash
# Adicionar ao crontab
crontab -e

# Adicionar linhas (rodar backup todo dia às 2 da manhã)
0 2 * * * /home/botadmin/apps/botfinanca/botFinancaSheet/backup.sh >> /home/botadmin/apps/botfinanca/logs/backup.log 2>&1

# Verificar crontab
crontab -l
```

### 8.4 Monitoramento de Disk Space

```bash
# Verificar espaço em disco
df -h

# Monitorar pasta de logs
du -sh ~/apps/botfinanca/botFinancaSheet/logs/
du -sh ~/apps/botfinanca/backups/

# Script para alertar se disco cheio
df -h | awk 'NR==2 {if ($5 > 80) print "⚠️  ALERTA: Disco " $5 " cheio!"}'
```

### 8.5 Atualizar Aplicação

```bash
# Navegar para o repositório
cd ~/apps/botfinanca/botFinancaSheet

# Método 1: Via Git
git pull origin main
docker compose build
docker compose up -d

# Método 2: Manual
docker compose down
# Editar código
git pull
docker compose up -d

# Verificar logs
docker compose logs -f
```

### 8.6 Status e Troubleshooting

```bash
# Navegar para repositório
cd ~/apps/botfinanca/botFinancaSheet

# Ver status geral
sudo systemctl status botfinanca
docker compose ps

# Reiniciar aplicação
sudo systemctl restart botfinanca

# Parar temporariamente
sudo systemctl stop botfinanca

# Ver processos Docker
docker ps -a

# Limpar containers para rebuild
docker compose down
docker system prune -a
docker compose up -d --build
```

---

## Troubleshooting

### Problema: "Connection refused" ao testar aplicação

```bash
# 1. Verificar se containers estão rodando
cd ~/apps/botfinanca/botFinancaSheet
docker compose ps

# 2. Ver logs da aplicação
docker compose logs app

# 3. Verificar porta 3000 (localhost apenas)
sudo netstat -tlnp | grep 3000
# Deve mostrar: 127.0.0.1:3000

# 4. Testar conexão interna
docker compose exec app curl http://localhost:3000/health
```

### Problema: "502 Bad Gateway" no Nginx

```bash
# 1. Verificar se app está rodando
docker compose ps

# 2. Ver logs do Nginx
sudo tail -50 /var/log/nginx/botfinanca_error.log

# 3. Testar proxy manualmente
curl -v http://127.0.0.1:3000/health

# 4. Recarregar Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Problema: Certificado SSL expirando

```bash
# Verificar datas
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Verificar renovação agendada
sudo systemctl list-timers certbot.timer
```

### Problema: PostgreSQL não conecta

```bash
# 1. Verificar container
cd ~/apps/botfinanca/botFinancaSheet
docker compose ps postgres

# 2. Testar conexão
docker compose exec postgres psql -U $DB_USERNAME -d $DB_NAME -c "SELECT 1"

# 3. Ver logs
docker compose logs postgres

# 4. Verificar volume
docker volume ls | grep postgres_data
```

### Problema: Sem espaço em disco

```bash
# Limpar containers e imagens antigas
docker system prune -a

# Limpar logs antigos
sudo find /var/log/nginx -name "*.log" -mtime +30 -delete

# Listar tamanho de pastas
du -sh ~/* | sort -h

# Comprimir backups antigos
gzip ~/apps/botfinanca/backups/*.sql 2>/dev/null || true
```

### Problema: Aplicação lenta

```bash
# Navegar para repositório
cd ~/apps/botfinanca/botFinancaSheet

# Monitorar recursos
docker stats

# Ver CPU/Memory
top -p $(docker inspect --format '{{.State.Pid}}' registro-gastos-bot)

# Aumentar limits no docker-compose.yml:
# resources:
#   limits:
#     cpus: '1'
#     memory: 1G
```

---

## 📋 Checklist de Pós-Deploy

- [ ] HTTPS redirecionando HTTP
- [ ] Certificado SSL válido e funcionando
- [ ] Health check respondendo
- [ ] Logs sendo gerados
- [ ] Backup automatizado testado
- [ ] Firewall permitindo porta 80 e 443
- [ ] Usuário root não consegue fazer SSH
- [ ] SSH por chave funcionando (sem password)
- [ ] Fail2ban ativado
- [ ] Updates automáticos agendados
- [ ] Certificado SSL renovação agendada
- [ ] PostgreSQL em volume persistente
- [ ] Secrets/credenciais fora do Git
- [ ] Monitor externos testados
- [ ] Plano de disaster recovery documentado

---

## 📞 Suporte e Referências

- Docker Docs: https://docs.docker.com
- Nginx Docs: https://nginx.org/en/docs/
- Certbot: https://certbot.eff.org
- Let's Encrypt: https://letsencrypt.org
- NestJS: https://docs.nestjs.com
- PostgreSQL: https://www.postgresql.org/docs/

---

**Versão:** 1.0  
**Última atualização:** 2026-04-04  
**Autor:** Equipe de infraestrutura
