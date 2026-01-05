# Relatório de Auditoria de Acessibilidade
Data: Mon Nov 24 13:44:00 UTC 2025

## Problemas Encontrados: 18

### 1. Botões sem aria-label
src/components/DocumentUploader.tsx:201:                          size="icon"
src/components/DocumentUploader.tsx:211:                        size="icon"
src/components/DocumentUploader.tsx:220:                        size="icon"
src/components/FinancialManagementAdvbox.tsx:285:                          size="icon"
src/components/ui/button.test.tsx:53:    rerender(<Button size="icon">Icon</Button>)
src/components/PremonicaoModal.tsx:106:      size="icon"
src/components/PremonicaoModal.tsx:231:                                  size="icon"
src/components/Donna.tsx:618:              size="icon"
src/components/PDFUploader.tsx:618:                        size="icon"

### 2. Imagens sem alt
src/components/GoogleAuth.tsx:174:            <img

### 3. Divs/Spans com onClick
Nenhum problema encontrado
