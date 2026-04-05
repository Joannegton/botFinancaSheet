# 🚀 Finanças Bot - Guia de Orientação

Bem-vindo! Este documento te guia para começar a usar o Finanças Bot. Escolha sua jornada abaixo:

---

## 🎯 Você quer...

### ⚡ Começar AGORA (5 minutos)

Suba tudo localmente com um comando:

```bash
cd botFinancaSheet
./deploy.sh dev
# ou: docker-compose up -d

# Abrir: http://localhost
```

👉 **Guia completo**: [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md)

---

### 📚 Entender a Arquitetura

Saiba como o projeto está organizado:

- **Estrutura**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Backend DDD**: [src/domain](src/domain), [src/application](src/application), [src/infrastructure](src/infrastructure)
- **Frontend React**: [apps/web/src](apps/web/src)
- **Infraestrutura**: [docker-compose.yml](docker-compose.yml), [nginx/nginx.conf](nginx/nginx.conf)

---

### 🌐 Deploy em Produção

Instruções passo a passo:

1. **Development**: [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md)
2. **Staging**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md#deploy-em-staging)
3. **Produção**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md#deploy-em-produção)
4. **CI/CD Automática**: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)

👉 **Checklist completo**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

### 🔍 Verificar o que foi feito

Resumo executivo de toda implementação:

👉 [IMPLEMENTATION_SUMMARY_DEPLOYMENT.md](IMPLEMENTATION_SUMMARY_DEPLOYMENT.md)

Highlights:

- ✅ 11 arquivos novos criados
- ✅ 2 arquivos principais atualizados
- ✅ ~1600 linhas de código novo
- ✅ 5 documentos completos
- ✅ Pipeline CI/CD pronta

---

### 🐛 Resolver Problemas

Coisa não está funcionando?

- **Docker/Setup Issues**: [QUICK_START_DOCKER.md → Troubleshooting](QUICK_START_DOCKER.md#-troubleshooting)
- **Deployment Issues**: [DEPLOYMENT_GUIDE.md → Troubleshooting](DEPLOYMENT_GUIDE.md#troubleshooting)
- **Architecture Questions**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

### 🔐 Configurar Segurança

Se você precisa implementar autenticação, SSL, backups:

1. **SSL/TLS**: [DEPLOYMENT_GUIDE.md → Configurar SSL](DEPLOYMENT_GUIDE.md#4-configurar-ssl-lets-encrypt)
2. **Segurança**: [DEPLOYMENT_GUIDE.md → Conformidade & Segurança](DEPLOYMENT_GUIDE.md#conformidade--segurança)
3. **Backups**: [DEPLOYMENT_GUIDE.md → Backup de Banco](DEPLOYMENT_GUIDE.md#6-backup-de-banco-de-dados)

---

### 💼 Para Desenvolvedores

Contribuindo ao projeto?

**Setup desenvolvimento**:

```bash
# Backend
npm install
npm run start:dev  # Hot reload

# Frontend
cd apps/web
npm install
npm run dev  # Hot reload
```

**Stack**:

- Backend: NestJS + TypeScript + PostgreSQL
- Frontend: Next.js + React + Tailwind CSS
- State: Zustand + TanStack Query
- Auth: JWT + OTP Twilio
- Infra: Docker + Nginx

**Padrões**:

- DDD architecture (Domain → Application → Infrastructure)
- REST API com JWT
- Mobile-first responsive design
- Error handling global

---

### 📖 Leitura Recomendada (em ordem)

1. **5 min**: [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md) - Como rodar
2. **10 min**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - O que foi feito
3. **20 min**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Como fazer deploy
4. **15 min**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Como funciona
5. **Optional**: [README.md](README.md) - Overview detalhado

---

## 🗂️ Estrutura de Arquivos

```
botFinancaSheet/
├── 📄 QUICK_START_DOCKER.md         ← Comece aqui!
├── 📄 DEPLOYMENT_GUIDE.md           ← Deploy passo a passo
├── 📄 DEPLOYMENT_CHECKLIST.md       ← Validação final
├── 📄 IMPLEMENTATION_SUMMARY_DEPLOYMENT.md  ← Resumo do que foi feito
├── 📄 deploy.sh / deploy.bat        ← Scripts de deployment
│
├── 🐳 docker-compose.yml            ← Orquestração Docker
├── 🐳 Dockerfile                    ← Backend image
├── 🐳 apps/web/Dockerfile           ← Frontend image
├── 🔧 nginx/nginx.conf              ← Reverse proxy config
│
├── .env.example                     ← Template variáveis
├── .env.prod                        ← Template produção
├── .github/workflows/ci-cd.yml      ← CI/CD automática
│
├── src/                             ← Backend NestJS
│   ├── domain/                      ← DDD business logic
│   ├── application/                 ← Use cases, DTOs
│   └── infrastructure/              ← Controllers, repos
│
├── apps/web/                        ← Frontend Next.js
│   ├── src/app/                     ← Páginas
│   ├── src/components/              ← Componentes
│   └── src/lib/                     ← Hooks, utils, store
│
└── docs/
    └── ARCHITECTURE.md              ← Detalhes técnicos
```

---

## 🚀 Próximos Passos

### Hoje (< 1 hora)

- [ ] Execute `./deploy.sh dev`
- [ ] Teste em http://localhost
- [ ] Leia [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md)

### Esta Semana (< 4 horas)

- [ ] Configure Twilio para OTP real
- [ ] Deploy em staging
- [ ] Configure SSL com Let's Encrypt
- [ ] Teste fluxo completo

### Próximas Semanas

- [ ] Deploy em produção
- [ ] Configure CI/CD com GitHub
- [ ] Setup monitoramento (Sentry, Datadog)
- [ ] Backups automáticos

---

## 📞 Referência Rápida

### Comandos Docker

```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Limpar tudo
docker-compose down -v
```

### Acessar Aplicação

```
Frontend:    http://localhost         (ou http://localhost:80)
Backend:     http://localhost:3000
API Docs:    http://localhost:3000/api/docs
Database:    localhost:5432
```

### Deploy

```bash
# Dev
./deploy.sh dev

# Staging
./deploy.sh staging

# Produção
./deploy.sh prod

# Windows
deploy.bat dev
```

---

## ❓ FAQ

**P: Posso testar sem Twilio?**  
R: Sim! Os endpoints funcionam sem Twilio em dev. Em produção, configure as credenciais em `.env.prod`.

**P: Como fazer backup do banco?**  
R: Ver [DEPLOYMENT_GUIDE.md → Backup de Banco](DEPLOYMENT_GUIDE.md#6-backup-de-banco-de-dados)

**P: Como configurar SSL?**  
R: Ver [DEPLOYMENT_GUIDE.md → Configurar SSL](DEPLOYMENT_GUIDE.md#4-configurar-ssl-lets-encrypt)

**P: Como escalar para produção?**  
R: Ver [DEPLOYMENT_GUIDE.md → Deploy em Produção](DEPLOYMENT_GUIDE.md#deploy-em-produção)

**P: Como contribuir ao projeto?**  
R: Faça fork, crie branch, implemente, teste, e abra PR. Ver padrões em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 📊 Checklist Rápido

Antes de usar em produção:

- [ ] Local setup funciona (`./deploy.sh dev`)
- [ ] Staging deploy funciona
- [ ] SSL/TLS configurado
- [ ] Twilio credentials válidas
- [ ] Database backup automático configurado
- [ ] Monitoração e alertas ativa
- [ ] CI/CD pipeline testada
- [ ] Security checklist completo

---

## 🎉 Vamos Começar!

```bash
cd botFinancaSheet
./deploy.sh dev
open http://localhost
```

Qualquer dúvida? Veja a documentação relevante acima ou abra uma issue! 🚀

---

**Versão**: 1.0.0  
**Status**: ✅ Production Ready  
**Última atualização**: $(date +%Y-%m-%d)
