#!/usr/bin/env python3
"""
Script para corrigir imports e referências de ícones
Migração Phosphor → Lucide de forma controlada
"""

import re
from pathlib import Path

# Mapeamento completo Phosphor → Lucide
ICON_MAP = {
    # Nomes diferentes
    "ChartBar": "BarChart3",
    "Lightning": "Zap",
    "MicrophoneStage": "Mic",
    "Stop": "StopCircle",
    "Sparkle": "Sparkles",
    "WarningCircle": "AlertCircle",
    "CalendarDots": "Calendar",
    "TrendUp": "TrendingUp",
    "TrendDown": "TrendingDown",
    "DotsThree": "MoreVertical",
    "Funnel": "Filter",
    "House": "Home",
    "PencilLine": "PenLine",
    "CurrencyCircleDollar": "DollarSign",
    "SignOut": "LogOut",
    "ArrowClockwise": "RefreshCw",
    "CircleNotch": "Loader2",
    "Keyboard": "Command",
    "Lightbulb": "Lightbulb",
    "InfoIcon": "Info",
    "SearchLucide": "Search",
    "InboxIcon": "Inbox",
    "SearchIcon": "Search",
    "ArrowRight": "ArrowRight",
    # Nomes iguais (sem mapeamento)
    "File": "FileText",  # Evitar conflito com interface File do browser
    "Trash": "Trash2",
}

def fix_file(filepath, needed_icons):
    """Corrige um arquivo adicionando imports Lucide e substituindo referências"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ Arquivo não encontrado: {filepath}")
        return False
    
    content = path.read_text()
    original = content
    
    # 1. Remover import Phosphor se existir
    content = re.sub(r'^import\s*\{[^}]+\}\s*from\s*"@phosphor-icons/react";\n', '', content, flags=re.MULTILINE)
    
    # 2. Adicionar ícones ao import Lucide se já existir, ou criar novo
    lucide_import_match = re.search(r'import\s*\{([^}]+)\}\s*from\s*"lucide-react";', content)
    
    if lucide_import_match:
        # Já tem import Lucide, adicionar os novos
        existing_icons = [i.strip() for i in lucide_import_match.group(1).split(',')]
        all_icons = sorted(set(existing_icons + needed_icons))
        new_import = f'import {{ {", ".join(all_icons)} }} from "lucide-react";'
        content = content.replace(lucide_import_match.group(0), new_import)
    else:
        # Criar novo import Lucide após outros imports
        import_section_end = 0
        for match in re.finditer(r'^import\s+.*?;$', content, flags=re.MULTILINE):
            import_section_end = match.end()
        
        if import_section_end > 0:
            new_import = f'\nimport {{ {", ".join(sorted(needed_icons))} }} from "lucide-react";'
            content = content[:import_section_end] + new_import + content[import_section_end:]
    
    # 3. Substituir referências de ícones no JSX
    for old_name, new_name in ICON_MAP.items():
        # Substituir em tags JSX
        content = re.sub(rf'<{old_name}\s', f'<{new_name} ', content)
        content = re.sub(rf'{old_name}Icon', new_name, content)  # InfoIcon → Info
    
    if content != original:
        path.write_text(content)
        print(f"✅ {filepath}")
        return True
    else:
        print(f"⏭️  {filepath} (sem mudanças)")
        return False

# Arquivos e ícones necessários (baseado no log do Vercel)
files_to_fix = {
    "src/components/AdvancedNLPDashboard.tsx": ["BarChart3", "Brain", "CheckCircle", "Copy", "Download", "FileText", "Search", "Tag", "Zap"],
    "src/components/AudioTranscription.tsx": ["AlertCircle", "Mic", "Sparkles", "StopCircle", "Upload"],
    "src/components/BatchAnalysis.tsx": ["CheckCircle", "Download", "FileText", "Loader2", "Sparkles", "Upload", "XCircle"],
    "src/components/CadastrarCliente.tsx": ["UserPlus"],
    "src/components/DeadlineCalculator.tsx": ["AlertCircle", "Calendar", "Calculator", "Sparkles"],
    "src/components/DocumentTemplates.tsx": ["Download", "FileText", "Trash2", "Upload"],
    "src/components/FinancialManagementAdvbox.tsx": ["FileText", "Paperclip", "Plus", "TrendingDown", "TrendingUp", "X"],
    "src/components/GlobalSearch.tsx": ["ArrowDown", "ArrowUp", "ChevronRight", "Command", "FileText", "Folder", "Inbox", "Search", "User", "X"],
    "src/components/KeyboardShortcutsDialog.tsx": ["Command"],
    "src/components/LegalMemoryViewer.tsx": ["Brain", "Clock", "FileText", "Gavel", "Lightbulb"],
    "src/components/MrsJustinEModal.tsx": ["Brain", "Sparkles"],
    "src/components/MultiSourcePublications.tsx": ["Search"],
    "src/components/PDFUploader.tsx": ["Loader2"],
    "src/components/ProcessCRM.tsx": ["Bot", "Plus", "Search", "Sparkles"],
    "src/components/ProcessCRMAdvbox.tsx": ["Calendar", "DollarSign", "FileText", "Filter", "MoreVertical", "Search", "TrendingUp"],
    "src/components/Sidebar.tsx": ["BookOpen", "Bot", "Briefcase", "Calendar", "Calculator", "Database", "DollarSign", "FileText", "Home", "Inbox", "LogOut", "Mic", "Newspaper", "PenLine"],
    "src/components/TracingDashboard.tsx": ["ArrowRight", "LineChart", "RefreshCw", "Trash2", "Zap"],
    "src/components/ui/accordion.tsx": ["ChevronDown"],
    "src/components/ui/checkbox.tsx": ["Check"],
    "src/components/ui/dialog.tsx": ["X"],
    "src/components/ui/info-tooltip.tsx": ["Info"],
    "src/components/ui/sheet.tsx": ["X"],
}

if __name__ == "__main__":
    print("🔧 Iniciando correção de ícones...")
    print(f"📁 {len(files_to_fix)} arquivos para processar\n")
    
    fixed_count = 0
    for filepath, icons in files_to_fix.items():
        if fix_file(filepath, icons):
            fixed_count += 1
    
    print(f"\n✨ Concluído! {fixed_count} arquivos modificados")
