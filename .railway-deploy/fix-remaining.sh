#!/bin/bash

# Lista de arquivos com duplicatas (baseado no último grep)
FILES=(
  "src/components/DashboardCharts.tsx"
  "src/components/DatajudChecklist.tsx"
  "src/components/DocumentCheckAgent.tsx"
  "src/components/DocumentUploader.tsx"
  "src/components/FailedTasksAnalysis.tsx"
  "src/components/FinancialManagement.tsx"
  "src/components/HumanAgentCollaboration.tsx"
  "src/components/KnowledgeBase.tsx"
  "src/components/LLMObservabilityDashboard.tsx"
  "src/components/MinutasManager.tsx"
  "src/components/NotificationCenter.tsx"
  "src/components/OfficeManagement.tsx"
  "src/components/PremonicaoModal.tsx"
  "src/components/ProcessDetailsDialog.tsx"
  "src/components/ProcessVelocityCharts.tsx"
  "src/components/SmartTaskSuggestions.tsx"
  "src/components/TaskAutomation.tsx"
  "src/components/TaskChainAnalysis.tsx"
  "src/components/TaskPrioritization.tsx"
  "src/components/TimelineEnhanced.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processando $file..."
    # Remover primeira linha se for import duplicado
    head -1 "$file" | grep -q "^import.*from.*phosphor-icons" && sed -i '1d' "$file"
    head -1 "$file" | grep -q "^import.*from.*lucide-react" && sed -i '1d' "$file"
  fi
done

echo "Duplicados removidos!"
