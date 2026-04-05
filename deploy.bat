@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM Deploy Script - Finanças Bot Backend + Frontend (Windows)
REM 
REM Uso:
REM   deploy.bat dev      # Deploy em desenvolvimento
REM   deploy.bat prod     # Deploy em produção
REM ─────────────────────────────────────────────────────────────────────────────

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "!ENVIRONMENT!"=="" set ENVIRONMENT=dev

set SCRIPT_DIR=%~dp0

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo 🚀 Iniciando Deploy - Ambiente: !ENVIRONMENT!
echo ═══════════════════════════════════════════════════════════════════════════
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM 1. Validar ambiente
REM ─────────────────────────────────────────────────────────────────────────────

echo 📋 Validando ambiente...

where docker >nul 2>nul
if !errorlevel! neq 0 (
  echo ❌ Docker não encontrado. Por favor, instale Docker.
  exit /b 1
)

where docker-compose >nul 2>nul
if !errorlevel! neq 0 (
  echo ❌ Docker Compose não encontrado. Por favor, instale Docker Compose.
  exit /b 1
)

echo ✅ Docker e Docker Compose encontrados
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM 2. Validar arquivo .env
REM ─────────────────────────────────────────────────────────────────────────────

echo ⚙️  Validando arquivo de configuração...

if "!ENVIRONMENT!"=="prod" (
  set ENV_FILE=.env.prod
) else (
  set ENV_FILE=.env
)

if not exist "!SCRIPT_DIR!!ENV_FILE!" (
  echo ❌ Arquivo !ENV_FILE! não encontrado
  exit /b 1
)

echo ✅ Arquivo !ENV_FILE! encontrado
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM 3. Parar containers antigos
REM ─────────────────────────────────────────────────────────────────────────────

echo 🛑 Parando containers antigos (se houver)...

docker-compose -f "!SCRIPT_DIR!docker-compose.yml" down
echo ✅ Containers antigos parados
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM 4. Build containers
REM ─────────────────────────────────────────────────────────────────────────────

echo 🔨 Construindo containers...

docker-compose -f "!SCRIPT_DIR!docker-compose.yml" build --no-cache
if !errorlevel! neq 0 (
  echo ❌ Erro ao construir containers
  exit /b 1
)

echo ✅ Containers construídos
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM 5. Iniciar stack
REM ─────────────────────────────────────────────────────────────────────────────

echo ▶️  Iniciando stack Docker Compose...

docker-compose -f "!SCRIPT_DIR!docker-compose.yml" up -d
if !errorlevel! neq 0 (
  echo ❌ Erro ao iniciar stack
  exit /b 1
)

echo ✅ Stack iniciada
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM 6. Aguardar health checks
REM ─────────────────────────────────────────────────────────────────────────────

echo ⏳ Aguardando serviços ficarem saudáveis...
echo ⏳ Aguardando 10 segundos para os serviços iniciarem...

timeout /t 10 /nobreak

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM 7. Verificar status
REM ─────────────────────────────────────────────────────────────────────────────

echo 📊 Status dos containers:
docker-compose -f "!SCRIPT_DIR!docker-compose.yml" ps

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM 8. Exibir informações de acesso
REM ─────────────────────────────────────────────────────────────────────────────

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo ✅ Deploy concluído com sucesso!
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo 📍 Acessar aplicação:
echo    🌐 Frontend:  http://localhost:80
echo    📡 Backend:   http://localhost:3000
echo    📚 API Docs:  http://localhost:3000/docs
echo.
echo 🐳 Comandos úteis:
echo    docker-compose logs -f backend     # Ver logs do backend
echo    docker-compose logs -f frontend    # Ver logs do frontend
echo    docker-compose logs -f postgres    # Ver logs do banco
echo    docker-compose down                 # Parar stack
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.

endlocal
