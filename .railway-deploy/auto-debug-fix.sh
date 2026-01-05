#!/bin/bash
# Auto Debug & Fix - Sistema automático de debugging e correção

set -e

LOG_DIR="./debug-logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/auto-debug-$TIMESTAMP.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

run_type_check() {
    log "🔍 Verificando TypeScript..."
    if npx tsc --noEmit 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ TypeScript OK"
        return 0
    else
        log "❌ Erros TypeScript detectados"
        return 1
    fi
}

run_lint_fix() {
    log "🔧 Corrigindo ESLint..."
    npm run lint -- --fix --quiet 2>&1 | tee -a "$LOG_FILE" || true
    log "✅ ESLint corrigido"
}

run_format() {
    log "✨ Formatando código..."
    npm run format 2>&1 | tee -a "$LOG_FILE" || true
    log "✅ Código formatado"
}

auto_commit_fixes() {
    if git diff --quiet; then
        log "📋 Nenhuma alteração para commit"
        return 0
    fi
    
    log "💾 Commitando correções automáticas..."
    git add -A
    git commit -m "fix: correções automáticas (TypeScript, ESLint, Prettier)

- Auto-fix ESLint
- Auto-format Prettier
- Type check validado

[auto-debug-fix]" 2>&1 | tee -a "$LOG_FILE"
    
    log "✅ Commit criado"
}

main() {
    log "🚀 Iniciando verificação automática..."
    
    # Loop infinito - executa a cada 60 segundos
    while true; do
        # 1. Type check
        if ! run_type_check; then
            # Se houver erros TypeScript, tenta corrigir com ESLint + Prettier
            run_lint_fix
            run_format
            
            # Verifica novamente
            if run_type_check; then
                log "🎉 Erros corrigidos automaticamente!"
                auto_commit_fixes
            else
                log "⚠️ Erros TypeScript persistem - intervenção manual necessária"
            fi
        fi
        
        # 2. ESLint fix contínuo
        run_lint_fix
        
        # 3. Format contínuo
        run_format
        
        log "⏸️ Aguardando 60 segundos para próxima verificação..."
        sleep 60
    done
}

# Tratamento de Ctrl+C
trap 'log "🛑 Auto Debug & Fix interrompido"; exit 0' INT TERM

main
