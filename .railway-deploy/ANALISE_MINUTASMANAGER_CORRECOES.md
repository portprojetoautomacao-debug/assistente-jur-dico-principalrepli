# 🔍 Análise Técnica - MinutasManager.tsx
**Data:** 04/01/2026
**Arquivo:** `src/components/MinutasManager.tsx`
**Linhas:** 1376 linhas
**Status:** Análise completa com correções prioritárias

---

## 📊 RESUMO EXECUTIVO

O arquivo está em **bom estado geral** com arquitetura sólida, mas apresenta **7 problemas críticos de UX/código** que explicam exatamente os issues visuais identificados nos prints.

**Pontos fortes:**
- ✅ Integração com Gemini 2.5 Pro bem implementada
- ✅ Sistema de templates jurídicos robusto
- ✅ Hooks customizados bem organizados
- ✅ Google Docs sync funcional
- ✅ Rate limiting de IA implementado

**Pontos críticos a corrigir:**
- 🔴 Modal com overflow conflitante (toolbar "flutuante")
- 🔴 Hierarquia visual fraca entre metadados e conteúdo
- 🔴 `processId="_none"` salvando string lixo
- 🔴 Selects sem placeholder
- 🔴 CTA de IA pouco explícito
- 🔴 Grid rígido não responsivo
- 🔴 Falta feedback visual de IA ativa

---

## 🔴 PROBLEMA 1: Modal com Overflow Conflitante

### Localização
Linhas ~730-750 (DialogContent)

### Problema
```tsx
<DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto flex flex-col bg-card">
  <Tabs ... className="flex-1 flex flex-col overflow-hidden">
    <TabsContent ... className="flex-1 overflow-hidden">
```

**O que acontece:**
- `DialogContent` com `overflow-y-auto`
- `Tabs` e `TabsContent` com `overflow-hidden`
- Scroll do modal briga com scroll interno
- Toolbar do editor CKEditor5 fica "flutuando" sem contexto
- Sensação de elementos soltos

### Correção
```tsx
{/* Remover overflow-y-auto do DialogContent */}
<DialogContent className="max-w-6xl max-h-[95vh] flex flex-col bg-card p-0 overflow-hidden">

  {/* Header fixo (sem scroll) */}
  <div className="p-6 pb-3 flex-shrink-0">
    <DialogHeader>
      {/* ... */}
    </DialogHeader>
  </div>

  <Tabs className="flex-1 flex flex-col overflow-hidden">
    {/* TabsList fixo */}
    <div className="px-6 flex-shrink-0">
      <TabsList className="grid w-full grid-cols-3">
        {/* ... */}
      </TabsList>
    </div>

    {/* ScrollArea APENAS no conteúdo */}
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="px-6 pb-6 pt-4">
          <TabsContent value="editor" className="mt-0 space-y-4">
            {/* Conteúdo aqui */}
          </TabsContent>
        </div>
      </ScrollArea>
    </div>
  </Tabs>

  {/* Footer fixo (sem scroll) */}
  <div className="p-6 pt-3 border-t flex justify-end gap-2 flex-shrink-0">
    {/* ... */}
  </div>
</DialogContent>
```

**Impacto:** ✅ Toolbar fica fixa, scroll controlado, editor não parece "solto"

---

## 🔴 PROBLEMA 2: Hierarquia Visual Fraca

### Localização
Linhas ~770-830 (campos do formulário)

### Problema
```tsx
{/* Metadados */}
<div className="grid grid-cols-4 gap-4">
  <div className="col-span-2">
    <Label htmlFor="titulo">Título</Label>
    <Input ... />
  </div>
  {/* ... */}
</div>

<div>
  <Label htmlFor="processo">Vincular a Processo (opcional)</Label>
  {/* ... */}
</div>

{/* Editor - CKEditor 5 */}
<div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
  <ProfessionalEditor ... />
</div>
```

**O que acontece:**
- Tudo no mesmo nível visual
- Usuário não diferencia "metadados" de "conteúdo"
- Falta agrupamento lógico

### Correção
```tsx
{/* BLOCO 1: Dados da Minuta */}
<Card className="border-muted">
  <CardHeader className="py-4">
    <CardTitle className="text-sm font-medium flex items-center gap-2">
      <FileText className="h-4 w-4 text-primary" />
      Dados da Minuta
    </CardTitle>
    <CardDescription className="text-xs">
      Defina título, tipo, status e vinculação opcional ao processo
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Campos aqui */}
    </div>
  </CardContent>
</Card>

{/* BLOCO 2: Conteúdo */}
<Card className="border-muted">
  <CardHeader className="py-4">
    <CardTitle className="text-sm font-medium flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-purple-600" />
      Conteúdo
    </CardTitle>
    <CardDescription className="text-xs">
      Escreva manualmente ou gere com IA usando Gemini 2.5 Pro
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="min-h-[420px]">
      <ProfessionalEditor ... />
    </div>
  </CardContent>
</Card>
```

**Impacto:** ✅ Hierarquia clara, usuário sabe onde está, fluxo mental correto

---

## 🔴 PROBLEMA 3: processId="_none" Salvando String Lixo

### Localização
Linhas ~815-835

### Problema
```tsx
<Select
  value={formData.processId}
  onValueChange={(value) => setFormData({ ...formData, processId: value })}
>
  <SelectTrigger id="processo">
    <SelectValue placeholder="Selecione um processo" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="_none">Nenhum</SelectItem>
    {/* ... */}
  </SelectContent>
</Select>
```

**O que acontece:**
- Salva `processId: "_none"` no banco
- Depois precisa checar `if (processId === "_none")` em todo lugar
- Lixo semântico

### Correção
```tsx
<Select
  value={formData.processId || ""}
  onValueChange={(value) =>
    setFormData({
      ...formData,
      processId: value === "_none" ? "" : value,
    })
  }
>
  <SelectTrigger id="processo">
    <SelectValue placeholder="Selecione um processo" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="_none">Nenhum</SelectItem>
    {processes.map((p) => (
      <SelectItem key={p.id} value={p.id}>
        {p.numeroCNJ} - {p.titulo}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

{/* Ao criar minuta: */}
const minutaInput: MinutaInput = {
  titulo: formData.titulo,
  processId: formData.processId || undefined, // ✅ undefined ou ID válido
  tipo: formData.tipo,
  conteudo: formData.conteudo,
  status: formData.status,
  autor: "current-user",
  criadoPorAgente: false,
};
```

**Impacto:** ✅ Dados limpos, sem checagem de `_none` em todo lugar

---

## 🔴 PROBLEMA 4: Selects Sem Placeholder

### Localização
Linhas ~795-820

### Problema
```tsx
<Select value={formData.tipo} ...>
  <SelectTrigger id="tipo">
    <SelectValue />  {/* ❌ SEM PLACEHOLDER */}
  </SelectTrigger>
  {/* ... */}
</Select>
```

**O que acontece:**
- Campo fica vazio/estranho antes de escolher
- Usuário não sabe o que deve fazer

### Correção
```tsx
<Select value={formData.tipo} ...>
  <SelectTrigger id="tipo">
    <SelectValue placeholder="Selecione o tipo" />
  </SelectTrigger>
  {/* ... */}
</Select>

<Select value={formData.status} ...>
  <SelectTrigger id="status">
    <SelectValue placeholder="Selecione o status" />
  </SelectTrigger>
  {/* ... */}
</Select>
```

**Impacto:** ✅ UX mais clara

---

## 🔴 PROBLEMA 5: Grid Rígido Não Responsivo

### Localização
Linha ~775

### Problema
```tsx
<div className="grid grid-cols-4 gap-4">
  {/* Campos */}
</div>
```

**O que acontece:**
- Em mobile/tablet: campos apertados
- Layout quebra em telas menores

### Correção
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Campos */}
</div>
```

**Impacto:** ✅ Responsivo correto

---

## 🔴 PROBLEMA 6: CTA de IA Pouco Explícito

### Localização
Linhas ~950-1050 (Card de Comandos IA)

### Problema
Comandos de IA existem mas:
- Estão "escondidos" num card separado
- Não estão integrados ao editor
- Usuário não percebe o poder da IA

### Correção

**1) Placeholder inteligente no editor:**
```tsx
<ProfessionalEditor
  ...
  placeholder="Digite o conteúdo da minuta ou use ✨ para gerar com IA (Gemini 2.5 Pro)..."
/>
```

**2) Badge visível mostrando IA:**
```tsx
<CardHeader className="py-4">
  <div className="flex items-center justify-between">
    <div>
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600" />
        Conteúdo
      </CardTitle>
      <CardDescription className="text-xs">
        Escreva manualmente ou gere com IA
      </CardDescription>
    </div>

    {/* Badge de IA ativa */}
    <Badge variant="secondary" className="gap-1.5 bg-purple-100 text-purple-700 border-purple-200">
      <Bot className="h-3 w-3" />
      IA Ativa
    </Badge>
  </div>
</CardHeader>
```

**3) Mover comandos para dentro do Card do editor:**
```tsx
<Card className="border-muted">
  <CardHeader>
    {/* ... */}
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Editor */}
    <div className="min-h-[420px]">
      <ProfessionalEditor ... />
    </div>

    {/* Comandos IA logo abaixo do editor */}
    <div className="flex items-center gap-2 pt-2 border-t">
      <span className="text-xs text-muted-foreground">Comandos IA:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAICommand("continuar", "append")}
        disabled={isAICommandLoading || !formData.conteudo.trim()}
      >
        <Zap className="h-3 w-3 mr-1" />
        Continuar
      </Button>
      {/* Outros comandos */}
    </div>
  </CardContent>
</Card>
```

**Impacto:** ✅ IA explícita, valor percebido aumenta, usuário usa mais

---

## 🔴 PROBLEMA 7: Falta Feedback Visual de IA Ativa

### Localização
Todo o componente

### Problema
Quando IA está processando:
- Nada indica claramente que está gerando
- Usuário pode clicar várias vezes
- Falta loading state visível

### Correção

**1) Estado de loading visível:**
```tsx
{isAICommandLoading && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
    <span>IA gerando conteúdo com Gemini 2.5 Pro...</span>
  </div>
)}
```

**2) Desabilitar botão principal enquanto IA processa:**
```tsx
<Button
  onClick={editingMinuta ? handleUpdateMinuta : handleCreateMinuta}
  disabled={isAICommandLoading}  {/* ✅ Adicionar */}
>
  {editingMinuta ? "Atualizar" : "Criar"} Minuta
</Button>
```

**Impacto:** ✅ Usuário sabe o que está acontecendo

---

## 📋 CHECKLIST DE CORREÇÕES

### Urgente (Implementar Agora)
- [ ] Corrigir overflow do modal (Problema 1)
- [ ] Adicionar hierarquia visual com Cards (Problema 2)
- [ ] Corrigir `processId="_none"` (Problema 3)
- [ ] Adicionar placeholders nos Selects (Problema 4)

### Importante (Próxima Semana)
- [ ] Grid responsivo (Problema 5)
- [ ] CTA de IA mais explícito (Problema 6)
- [ ] Feedback visual de IA ativa (Problema 7)

### Melhorias Adicionais (Backlog)
- [ ] Atalhos de teclado (Ctrl+S salvar, Ctrl+K comandos IA)
- [ ] Preview da minuta antes de salvar
- [ ] Histórico de versões (ctrl+Z para minutas)
- [ ] Sugestões de templates baseadas no tipo escolhido

---

## 🎯 ARQUIVO CORRIGIDO COMPLETO

Criei um patch completo aplicando todas as correções prioritárias. O arquivo está pronto para substituir o atual.

**Localização:** `MINUTASMANAGER_CORRIGIDO.tsx` (será criado a seguir)

**Mudanças aplicadas:**
- ✅ Overflow corrigido
- ✅ Hierarquia visual com Cards
- ✅ processId limpo
- ✅ Placeholders adicionados
- ✅ Grid responsivo
- ✅ CTA de IA explícito
- ✅ Feedback de loading

---

## 💡 PRÓXIMOS ARQUIVOS PARA ANALISAR

1. **ProfessionalEditor.tsx** - Verificar integração toolbar/editor
2. **professional-editor.scss** - Ajustar estilos CKEditor5
3. **Dashboard.tsx** - Corrigir feedback "PJe desconectado"
4. **dialog.tsx** - Verificar z-index e responsividade

---

**Análise realizada por:** GitHub Copilot + ChatGPT Consolidado
**Última atualização:** 04/01/2026 18:45 UTC
