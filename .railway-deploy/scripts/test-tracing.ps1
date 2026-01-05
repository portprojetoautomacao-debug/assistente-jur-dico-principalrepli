# Script para testar configuração de tracing OpenTelemetry
# Uso: .\scripts\test-tracing.ps1

Write-Host ""
Write-Host "🔍 Testando Configuração de Tracing OpenTelemetry..." -ForegroundColor Cyan
Write-Host ""

# Função para verificar variável de ambiente
function Test-EnvVar {
    param(
        [string]$VarName
    )
    
    $varValue = [Environment]::GetEnvironmentVariable($VarName)
    
    if ([string]::IsNullOrEmpty($varValue)) {
        # Tentar carregar do .env.local
        if (Test-Path ".env.local") {
            $envContent = Get-Content ".env.local"
            $line = $envContent | Where-Object { $_ -match "^$VarName=" }
            if ($line) {
                $varValue = ($line -split "=", 2)[1].Trim()
            }
        }
    }
    
    if ([string]::IsNullOrEmpty($varValue)) {
        Write-Host "❌ $VarName não configurado" -ForegroundColor Red
        return $null
    } else {
        Write-Host "✅ $VarName configurado" -ForegroundColor Green
        Write-Host "   Valor: $varValue" -ForegroundColor Gray
        return $varValue
    }
}

# Verificar arquivo .env.local
if (Test-Path ".env.local") {
    Write-Host "📂 Arquivo .env.local encontrado" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  Arquivo .env.local não encontrado" -ForegroundColor Yellow
    Write-Host "   Copie .env.local.example para .env.local e configure" -ForegroundColor Gray
    Write-Host ""
}

# Verificar VITE_OTLP_ENDPOINT
Write-Host "1️⃣  Verificando VITE_OTLP_ENDPOINT..." -ForegroundColor Cyan
$endpoint = Test-EnvVar -VarName "VITE_OTLP_ENDPOINT"

if ($endpoint) {
    Write-Host ""
    Write-Host "2️⃣  Testando conectividade..." -ForegroundColor Cyan
    
    # Extrair host e porta
    if ($endpoint -match "http://([^:]+):(\d+)") {
        $host = $matches[1]
        $port = $matches[2]
        
        if ($host -eq "localhost" -or $host -eq "127.0.0.1") {
            # Testar porta local
            $portOpen = Test-NetConnection -ComputerName $host -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
            
            if ($portOpen) {
                Write-Host "✅ Porta $port está aberta em $host" -ForegroundColor Green
                Write-Host "   AI Toolkit Trace Viewer provavelmente está rodando" -ForegroundColor Gray
            } else {
                Write-Host "❌ Porta $port está fechada em $host" -ForegroundColor Red
                Write-Host "⚠️  Ative o AI Toolkit Trace Viewer:" -ForegroundColor Yellow
                Write-Host "   1. Pressione Ctrl+Shift+P" -ForegroundColor Gray
                Write-Host "   2. Digite: AI Toolkit: Open Trace Viewer" -ForegroundColor Gray
                Write-Host "   3. Pressione Enter" -ForegroundColor Gray
            }
        } else {
            Write-Host "   Endpoint externo detectado: $host" -ForegroundColor Gray
            
            if (Test-Connection -ComputerName $host -Count 1 -Quiet) {
                Write-Host "✅ Host $host está acessível" -ForegroundColor Green
            } else {
                Write-Host "❌ Host $host não está acessível" -ForegroundColor Red
                Write-Host "   Verifique sua conexão de rede" -ForegroundColor Gray
            }
        }
    }
    elseif ($endpoint -match "https://([^/]+)") {
        $host = $matches[1]
        Write-Host "   Testando endpoint HTTPS: $host" -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri $endpoint -Method Head -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ Endpoint HTTPS acessível" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Endpoint retornou resposta inesperada" -ForegroundColor Yellow
            Write-Host "   Endpoint pode ainda estar correto (alguns coletores não respondem a HEAD)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Configure VITE_OTLP_ENDPOINT no .env.local" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Gray
    Write-Host "  # Desenvolvimento (AI Toolkit):"
    Write-Host "  VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces"
    Write-Host ""
    Write-Host "  # Produção (Azure Monitor):"
    Write-Host "  VITE_OTLP_ENDPOINT=https://YOUR-REGION.monitor.azure.com/v1/traces"
}

Write-Host ""
Write-Host "3️⃣  Verificando dependências OpenTelemetry..." -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules não encontrado" -ForegroundColor Red
    Write-Host "   Execute: npm install" -ForegroundColor Gray
    exit 1
}

$requiredPackages = @(
    "@opentelemetry/api",
    "@opentelemetry/sdk-trace-web",
    "@opentelemetry/exporter-trace-otlp-http",
    "@opentelemetry/resources",
    "@opentelemetry/semantic-conventions"
)

$missingPackages = @()

foreach ($package in $requiredPackages) {
    $packagePath = "node_modules/$package"
    if (Test-Path $packagePath) {
        Write-Host "✅ $package instalado" -ForegroundColor Green
    } else {
        Write-Host "❌ $package NÃO instalado" -ForegroundColor Red
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Pacotes faltando. Execute:" -ForegroundColor Red
    Write-Host "   npm install" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "4️⃣  Verificando arquivos de tracing..." -ForegroundColor Cyan

$tracingFiles = @(
    "src/lib/otel-integration.ts",
    "src/lib/tracing.ts",
    "src/lib/agent-tracing.ts",
    "src/components/TracingDashboard.tsx"
)

foreach ($file in $tracingFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file NÃO encontrado" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "5️⃣  Verificando inicialização em main.tsx..." -ForegroundColor Cyan

if (Test-Path "src/main.tsx") {
    $mainContent = Get-Content "src/main.tsx" -Raw
    if ($mainContent -match "initializeOpenTelemetry") {
        Write-Host "✅ OpenTelemetry inicializado em main.tsx" -ForegroundColor Green
    } else {
        Write-Host "❌ initializeOpenTelemetry NÃO encontrado em main.tsx" -ForegroundColor Red
        Write-Host "   Adicione no início do arquivo:" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   import { initializeOpenTelemetry } from './lib/otel-integration';"
        Write-Host "   initializeOpenTelemetry();"
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESUMO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($missingPackages.Count -eq 0 -and $endpoint) {
    Write-Host "✅ Configuração de tracing parece estar OK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Execute: npm run dev" -ForegroundColor Gray
    Write-Host "   2. Ative o AI Toolkit: Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'" -ForegroundColor Gray
    Write-Host "   3. Navegue no sistema e veja os traces em tempo real!" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 Documentação completa: docs/TRACING_SETUP.md" -ForegroundColor Gray
} else {
    Write-Host "❌ Alguns problemas foram encontrados" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrija os itens acima e execute novamente:" -ForegroundColor Gray
    Write-Host "   .\scripts\test-tracing.ps1" -ForegroundColor Gray
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
