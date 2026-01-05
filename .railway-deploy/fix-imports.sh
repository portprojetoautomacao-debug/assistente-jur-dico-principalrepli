#!/bin/bash

# Script para corrigir imports faltantes

echo "Corrigindo imports..."

# MultiSourcePublications - remover duplicatas e adicionar Search como SearchLucide
sed -i '1d' src/components/MultiSourcePublications.tsx
sed -i '1i import { CheckCircle, Download, AlertCircle, RefreshCw, Calendar, FileText, ExternalLink, Filter, Search as SearchLucide } from "lucide-react";' src/components/MultiSourcePublications.tsx

# PDFUploader - remover duplicatas
sed -i 's/import { CheckCircle, Clock, FileText, Trash, Upload, User, XCircle } from "lucide-react";/import { CheckCircle, Upload, User, XCircle } from "lucide-react";/' src/components/PDFUploader.tsx

# ProcessCRM - corrigir Plus duplicado
sed -i 's/import { Bot, Plus, Search } from "lucide-react";/import { Bot, Search, Sparkles } from "lucide-react";/' src/components/ProcessCRM.tsx

# DocumentTemplates - remover Trash não usado
sed -i 's/import { Download, FileText, Trash2, Upload, Trash } from "lucide-react";/import { Download, FileText, Trash2, Upload } from "lucide-react";/' src/components/DocumentTemplates.tsx

# AudioTranscription - usar corretamente os ícones importados
# MicrophoneStage e WarningCircle estão importados mas não usados - vamos verificar depois

echo "Imports corrigidos!"
