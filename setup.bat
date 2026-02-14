@echo off
REM Script de setup inicial do projeto para Windows

echo 🚀 Iniciando setup do projeto...

REM Verifica se o Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não está instalado. Por favor, instale o Node.js 20 ou superior.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detectado

REM Verifica se o npm está instalado
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm não está instalado.
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% detectado

REM Instala as dependências
echo 📦 Instalando dependências...
call npm install

REM Verifica se o arquivo .env existe
if not exist .env (
    echo ⚠️  Arquivo .env não encontrado. Copiando .env.example...
    copy .env.example .env
    echo ✅ Arquivo .env criado. Por favor, configure suas credenciais.
    echo.
    echo 📝 Você precisa editar o arquivo .env e adicionar:
    echo    - TELEGRAM_BOT_TOKEN (obtenha com @BotFather)
    echo    - TELEGRAM_USER_ID (obtenha com @userinfobot)
    echo    - GOOGLE_SHEETS_SPREADSHEET_ID
    echo    - GOOGLE_SERVICE_ACCOUNT_EMAIL
    echo    - GOOGLE_PRIVATE_KEY
    echo.
    exit /b 0
)

echo ✅ Arquivo .env encontrado

REM Verifica se as variáveis essenciais estão configuradas
findstr /C:"your_bot_token_here" .env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Você ainda precisa configurar o TELEGRAM_BOT_TOKEN no arquivo .env
    exit /b 1
)

findstr /C:"your_telegram_user_id_here" .env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Você ainda precisa configurar o TELEGRAM_USER_ID no arquivo .env
    exit /b 1
)

findstr /C:"your_spreadsheet_id_here" .env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Você ainda precisa configurar o GOOGLE_SHEETS_SPREADSHEET_ID no arquivo .env
    exit /b 1
)

echo ✅ Variáveis de ambiente configuradas

REM Build do projeto
echo 🔨 Compilando o projeto...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Setup concluído com sucesso!
    echo.
    echo Para iniciar a aplicação:
    echo   - Desenvolvimento: npm run start:dev
    echo   - Produção: npm run start:prod
    echo   - Docker: docker-compose up -d
    echo.
) else (
    echo ❌ Erro ao compilar o projeto
    exit /b 1
)
