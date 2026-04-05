# 💻 Finanças Bot - Command Cheat Sheet

Referência rápida de todos os comandos úteis.

---

## 🚀 Deploy

### Development (Local)

```bash
# Iniciar stack
./deploy.sh dev
# ou
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar stack
docker-compose down

# Parar e limpar volumes
docker-compose down -v
```

### Staging

```bash
# Deploy staging
./deploy.sh staging

# Via SSH no servidor
ssh user@staging-server
cd /opt/botfinanca-staging
./deploy.sh staging
```

### Produção

```bash
# Deploy produção
./deploy.sh prod

# Via SSH no servidor
ssh user@prod-server
cd /opt/botfinanca-prod
./deploy.sh prod
```

### Windows

```bash
# Dev
deploy.bat dev

# Staging
deploy.bat staging

# Produção
deploy.bat prod
```

---

## 🐳 Docker

### Containers

```bash
# Ver containers rodando
docker-compose ps

# Ver containers (incluindo parados)
docker-compose ps -a

# Ver detalhes de um container
docker-compose exec backend ps aux

# Entrar em um container (bash shell)
docker-compose exec backend /bin/bash
docker-compose exec frontend /bin/sh
docker-compose exec postgres /bin/bash
```

### Logs

```bash
# Ver todos os logs
docker-compose logs

# Ver logs com 100 últimas linhas
docker-compose logs --tail 100

# Ver logs em tempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs nginx

# Ver logs com timestamp
docker-compose logs -t backend

# Ver logs últimas 5 minutos
docker-compose logs --since 5m backend
```

### Restart & Rebuild

```bash
# Restart um serviço
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres

# Rebuild um container
docker-compose build backend
docker-compose build frontend

# Rebuild e restart
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Cleanup

```bash
# Remover containers parados
docker-compose rm -f

# Limpar volumes não usados
docker volume prune

# Limpar images não usadas
docker image prune

# Limpeza completa (⚠️ CUIDADO!)
docker system prune -a --volumes
```

---

## 🔍 Health Checks & Testing

### Backend

```bash
# Health check
curl http://localhost:3000/health

# API Docs (Swagger)
open http://localhost:3000/docs

# Testar OTP (sem JWT)
curl -X POST http://localhost:3000/api/auth/solicitar-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+5521999999999"}'

# Testar protected endpoint (sem JWT = 401)
curl -X GET http://localhost:3000/api/gastos

# Com JWT token
TOKEN="seu_jwt_token_aqui"
curl -X GET http://localhost:3000/api/gastos \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend

```bash
# Verificar aplicação rodando
curl http://localhost

# Ver JavaScript bundle
curl http://localhost/_next/static/

# Testar WebSocket (se usado)
wscat -c ws://localhost
```

### Database

```bash
# Conectar ao postgres
docker-compose exec postgres psql -U postgres -d bot_financa

# Comandos úteis dentro do psql:
# \dt                    - Listar tabelas
# \d "Usuario"           - Ver schema de uma tabela
# \l                     - Listar databases
# SELECT * FROM "Usuario"; - Query

# Query rápida (sem entrar no psql)
docker-compose exec postgres psql -U postgres -d bot_financa -c "SELECT * FROM \"Usuario\" LIMIT 5;"
```

---

## 📦 Node.js / NPM

### Backend

```bash
# Instalar dependências
npm install

# Build
npm run build

# Desenvolvimento (hot reload)
npm run start:dev

# Produção
npm run start:prod

# Testes
npm run test
npm run test:cov  # Com coverage

# Lint
npm run lint

# Format
npm run format
```

### Frontend

```bash
# Entrar no diretório
cd apps/web

# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm run start

# Testes
npm run test

# Lint
npm run lint
```

---

## 🔐 SSL & Certificates

### Gerar Self-Signed Certificate

```bash
# Automático (Linux/Mac)
./generate-ssl.sh

# Manual
openssl req -x509 -newkey rsa:4096 -nodes \
  -out nginx/ssl/cert.pem \
  -keyout nginx/ssl/key.pem \
  -days 365
```

### Let's Encrypt (Staging/Prod)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone \
  -d seu-dominio.com

# Copiar para projeto
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem nginx/ssl/key.pem

# Renovar certificado
sudo certbot renew

# Setup auto-renewal
sudo crontab -e
# Adicionar: 0 3 * * * certbot renew >> /var/log/certbot-renew.log 2>&1
```

---

## 📊 Database

### Backup & Restore

```bash
# Backup completo
docker-compose exec postgres pg_dump \
  -U postgres -d bot_financa > backup.sql

# Restore de backup
docker-compose exec -T postgres psql \
  -U postgres -d bot_financa < backup.sql

# Backup com timestamp
mkdir -p backups
docker-compose exec postgres pg_dump \
  -U postgres -d bot_financa > backups/backup-$(date +%Y%m%d-%H%M%S).sql
```

### Database Queries

```bash
# Conectar
docker-compose exec postgres psql -U postgres -d bot_financa

# Dentro do psql:
# Ver usuários
SELECT * FROM "Usuario";

# Ver gastos
SELECT * FROM "Gasto" ORDER BY "dataCriacao" DESC LIMIT 10;

# Ver categorias
SELECT * FROM "Categoria";

# Count gastos por usuário
SELECT "usuarioPhoneNumber", COUNT(*) FROM "Gasto" GROUP BY "usuarioPhoneNumber";

# Total gasto por categoria
SELECT "categoria", SUM("valor") FROM "Gasto" GROUP BY "categoria";

# Sair
\q
```

---

## 🔧 Environment Variables

### Ver variáveis carregadas

```bash
# Backend
docker-compose exec backend env | grep -E "DB_|JWT_|TWILIO"

# Frontend
docker-compose exec frontend env | grep NEXT_PUBLIC
```

### Atualizar .env

```bash
# Editar arquivo
nano .env

# Recarregar variáveis (restart containers)
docker-compose restart backend
docker-compose restart frontend
```

---

## 🐛 Troubleshooting

### Port já em uso

```bash
# Ver qual processo está usando a porta
lsof -i :3000    # Backend
lsof -i :3001    # Frontend
lsof -i :5432    # Database
lsof -i :80      # Nginx

# Matar processo
kill -9 <PID>

# Ou restart Docker
docker-compose restart
```

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs backend -f

# Ver detalhes do erro
docker-compose exec backend npm run build
```

### Database não responde

```bash
# Reiniciar postgres
docker-compose restart postgres

# Aguardar health check passar
# Ver logs
docker-compose logs postgres -f

# Reset volume (⚠️ PERDARÁ DADOS)
docker-compose down -v
docker-compose up -d postgres
```

### Frontend não conecta API

```bash
# Verificar NEXT_PUBLIC_API_URL
docker-compose exec frontend env | grep API_URL

# Testar conectividade interna
docker-compose exec frontend curl http://backend:3000/health

# Verificar proxy nginx
docker-compose logs nginx

# Testar direto no backend
curl http://localhost:3000/health
```

---

## 📱 Mobile Development

### Testar em local network

```bash
# Descobrir IP da máquina
hostname -I  # Linux
ipconfig     # Windows
ifconfig | grep inet  # Mac

# Acessar de outro device
# http://seu-ip:80
# http://seu-ip:3000
```

### Testar responsividade

```bash
# Firefox
# F12 → Responsive Design Mode (Ctrl+Shift+M)

# Chrome
# F12 → Toggle device toolbar (Ctrl+Shift+M)
```

---

## 📝 Logs & Monitoring

### Ver aplicação inteira

```bash
# Todos os logs
docker-compose logs -f

# Seguir logs de um serviço
docker-compose logs -f backend

# Modo colorido
docker-compose logs -f --timestamps
```

### Monitorar performance

```bash
# Ver uso de CPU/RAM dos containers
docker stats

# Ver detalhes de um container
docker inspect <container-name>
```

### Salvar logs

```bash
# Exportar logs para arquivo
docker-compose logs > logs-$(date +%Y%m%d-%H%M%S).txt

# Ver logs com limite de tempo
docker-compose logs --since 2024-01-01T00:00:00 > recent-logs.txt
```

---

## 🚀 CI/CD

### GitHub Actions (Local Testing)

```bash
# Instalar GitHub CLI
brew install gh  # Mac
choco install gh  # Windows via choco
sudo apt install gh  # Linux (Debian)

# Fazer login
gh auth login

# Disparar workflow manualmente
gh workflow run ci-cd.yml

# Ver status
gh run list

# Ver logs de um run
gh run view <run-id> --log
```

### Setup Secrets no GitHub

```bash
# Via GitHub CLI
gh secret set DOCKER_USERNAME -b "seu-username"
gh secret set DOCKER_PASSWORD -b "seu-password"
gh secret set STAGING_HOST -b "staging.seu-dominio.com"
gh secret set STAGING_USER -b "deploy-user"
gh secret set STAGING_SSH_KEY < ~/.ssh/deploy_key

# Listar secrets
gh secret list
```

---

## 📊 Useful One-Liners

```bash
# Reiniciar tudo
docker-compose restart

# Ver status bonito
docker-compose ps --no-trunc

# Logs com tail dinâmico
watch "docker-compose logs --tail 20 backend"

# Count linhas de código
find src -name "*.ts" | xargs wc -l

# Ver última tag
git describe --tags --abbrev=0

# Fazer tag
git tag v1.0.0
git push origin v1.0.0
```

---

## 🎯 Quick Start Templates

### Iniciar desenvolvimento

```bash
git clone <repo>
cd botFinancaSheet
./deploy.sh dev
# Aguardar 30 segundos
open http://localhost
```

### Deploy staging

```bash
ssh user@staging
cd /opt/botfinanca-staging
git pull
./deploy.sh staging
# Verificar https://staging.seu-dominio.com
```

### Deploy produção

```bash
ssh user@prod
cd /opt/botfinanca-prod
git pull
./deploy.sh prod
# Verificar https://seu-dominio.com
```

---

## 🔗 Recursos Rápidos

- **Localhost**: http://localhost (frontend) | http://localhost:3000 (backend)
- **API Docs**: http://localhost:3000/docs
- **GitHub**: https://github.com/seu-username/botFinancaSheet
- **Documentação**: [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md)

---

**Dica**: Salve este arquivo como referência! 📌

```bash
# Ou visualizar depois
more COMMAND_REFERENCE.md
less COMMAND_REFERENCE.md
grep "seu-comando" COMMAND_REFERENCE.md
```
