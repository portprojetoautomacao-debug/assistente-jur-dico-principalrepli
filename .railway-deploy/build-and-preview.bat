@echo off
REM Build e Deploy Local - Assistente Jurídico v1.4.0
REM Execute este arquivo no diretório do projeto

echo ========================================
echo  BUILD E DEPLOY LOCAL - v1.4.0
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale Node.js 22.x de:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Exibir versão do Node
echo [INFO] Versao do Node.js:
node --version
echo.

REM Verificar se npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] npm nao encontrado!
    echo.
    echo Reinstale Node.js de:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Exibir versão do npm
echo [INFO] Versao do npm:
npm --version
echo.

echo ========================================
echo  PASSO 1: INSTALAR DEPENDENCIAS
echo ========================================
echo.

npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [OK] Dependencias instaladas com sucesso!
echo.

echo ========================================
echo  PASSO 2: BUILD DE PRODUCAO
echo ========================================
echo.

npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha no build!
    echo.
    echo Verifique os erros acima e corrija antes de continuar.
    pause
    exit /b 1
)

echo.
echo [OK] Build concluido com sucesso!
echo.

echo ========================================
echo  PASSO 3: EXECUTAR TESTES
echo ========================================
echo.

npm run test:run
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] Alguns testes falharam!
    echo.
    echo Deseja continuar mesmo assim? (S/N)
    set /p continuar=
    if /i not "%continuar%"=="S" (
        echo.
        echo Build interrompido pelo usuario.
        pause
        exit /b 1
    )
)

echo.
echo [OK] Testes executados!
echo.

echo ========================================
echo  PASSO 4: PREVIEW LOCAL
echo ========================================
echo.

echo [INFO] Iniciando servidor de preview local...
echo [INFO] O servidor sera aberto em http://localhost:4173
echo [INFO] Pressione Ctrl+C para parar o servidor
echo.

npm run preview

REM Se chegou aqui, o preview foi parado
echo.
echo ========================================
echo  BUILD E DEPLOY LOCAL - CONCLUIDO
echo ========================================
echo.
echo Estatisticas do build:
echo - Arquivos compilados: dist/
echo - Bundle principal: dist/assets/index-[hash].js
echo - Tamanho total: (veja acima)
echo.
echo Proximos passos:
echo 1. Se os testes passaram, voce pode fazer deploy para Vercel
echo 2. Configure VITE_ENABLE_PII_FILTERING=true no Vercel
echo 3. Execute: vercel --prod
echo.
pause
