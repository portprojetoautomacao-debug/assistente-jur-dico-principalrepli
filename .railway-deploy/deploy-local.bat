@echo off
REM ============================================
REM ASSISTENTE JURÍDICO PJe - DEPLOY LOCAL
REM ============================================

echo ?? ASSISTENTE JURÍDICO PJe - DEPLOY LOCAL
echo ============================================
echo.

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ? ERRO: Execute este script dentro da pasta do projeto
    echo ?? Arquivo package.json não encontrado
    pause
    exit /b 1
)

echo ? Diretório do projeto encontrado
echo.

REM ============================================
REM 1. VERIFICAR NODE.JS
REM ============================================

echo ?? VERIFICANDO NODE.JS...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ? Node.js não encontrado
    echo ?? Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ? Node.js: %NODE_VERSION%
echo.

REM ============================================
REM 2. VERIFICAR .ENV
REM ============================================

if not exist ".env" (
    echo ??  Arquivo .env não encontrado
    echo ?? Criando template...

    echo # === CONFIGURAÇÕES OBRIGATÓRIAS === > .env
    echo VITE_GEMINI_API_KEY=sua_chave_gemini_aqui >> .env
    echo UPSTASH_REDIS_REST_URL=https://sua-instancia.upstash.io >> .env
    echo UPSTASH_REDIS_REST_TOKEN=seu_token_aqui >> .env
    echo. >> .env
    echo # === CONFIGURAÇÕES OPCIONAIS === >> .env
    echo VITE_GOOGLE_CLIENT_ID=seu_client_id_google >> .env
    echo VITE_GOOGLE_API_KEY=sua_api_key_google >> .env
    echo VITE_SENTRY_DSN=seu_dsn_sentry >> .env
    echo. >> .env
    echo # === AMBIENTE === >> .env
    echo VITE_APP_ENV=development >> .env

    echo ? Template .env criado
    echo ?? Configure suas credenciais no arquivo .env
    echo.
    echo Pressione qualquer tecla para continuar...
    pause >nul
)

REM ============================================
REM 3. INSTALAR DEPENDÊNCIAS
REM ============================================

echo ?? INSTALANDO DEPENDÊNCIAS...
echo Este processo pode levar alguns minutos...
echo.

call npm install

if %errorlevel% neq 0 (
    echo ? Falha ao instalar dependências
    pause
    exit /b 1
)

echo ? Dependências instaladas com sucesso
echo.

REM ============================================
REM 4. VERIFICAR BUILD
REM ============================================

echo ?? TESTANDO BUILD...
echo.

call npm run build

if %errorlevel% neq 0 (
    echo ? Falha no build
    echo Verifique os erros acima
    pause
    exit /b 1
)

echo ? Build realizado com sucesso
echo.

REM ============================================
REM 5. INICIAR SERVIDOR
REM ============================================

echo ?? INICIANDO SERVIDOR DE DESENVOLVIMENTO...
echo.
echo ?? URLs disponíveis:
echo    ?? App:     http://localhost:5173
echo    ?? API:     http://localhost:5173/api/health
echo    ?? Preview: http://localhost:4173 (npm run preview)
echo.
echo ?? Para parar: Ctrl+C
echo.
echo ============================================
echo ?? DEPLOY LOCAL CONCLUÍDO!
echo ============================================
echo.
echo ?? Dicas:
echo    • Configure o .env com suas chaves API
echo    • Use 'npm run dev' para desenvolvimento
echo    • Use 'npm run preview' para testar produção
echo.

pause
exit /b 0