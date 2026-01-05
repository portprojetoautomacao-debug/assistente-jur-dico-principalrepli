#!/bin/bash

# Script para remover imports duplicados

echo "Removendo imports duplicados..."

# Lista de arquivos com duplicatas (do grep error TS2300)
FILES=(
  "src/components/AIAgents.tsx"
  "src/components/AIContractAnalyzer.tsx"
  "src/components/AIDocumentSummarizer.tsx"
  "src/components/AILegalResearch.tsx"
  "src/components/AgentMetrics.tsx"
  "src/components/AgentOrchestrationPanel.tsx"
  "src/components/AgentStatusFloater.tsx"
  "src/components/AgentThinkingPanel.tsx"
  "src/components/Calendar.tsx"
  "src/components/DJENPublicationsWidget.tsx"
  "src/components/Dashboard.tsx"
  "src/components/DashboardAdvbox.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processando $file..."
    
    # Remover primeira linha se for import duplicado
    head -1 "$file" | grep -q "^import.*from.*phosphor-icons" && sed -i '1d' "$file"
    head -1 "$file" | grep -q "^import.*from.*lucide-react" && sed -i '1d' "$file"
  fi
done

echo "Imports duplicados removidos!"
