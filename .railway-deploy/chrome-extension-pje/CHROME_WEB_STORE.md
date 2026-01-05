# Chrome Web Store - PJe Sync

## 📝 Informações para Publicação

### Detalhes do Produto

**Título do Pacote:**
```
PJe Sync - Assistente Jurídico
```

**Resumo do Pacote (132 caracteres):**
```
Sincroniza processos do PJe com Assistente Jurídico em tempo real. Monitora intimações, movimentações e expedientes automaticamente.
```

**Descrição Completa:**
```
🎯 PJe Sync - Assistente Jurídico

Extensão oficial do Assistente Jurídico para sincronização automática e em tempo real de processos do PJe (Processo Judicial Eletrônico).

⚡ FUNCIONALIDADES PRINCIPAIS

✅ Sincronização Automática
• Monitora seu Painel do Advogado no PJe 24/7
• Detecta novos processos distribuídos instantaneamente
• Identifica movimentações processuais em tempo real
• Captura intimações, citações e expedientes automaticamente

✅ Integração Inteligente
• Conecta-se ao Assistente Jurídico (dashboard web)
• Sincroniza dados de processos, partes e movimentações
• Atualiza automaticamente a cada 5 minutos
• Funciona offline com retry automático

✅ Notificações Instantâneas
• Receba alertas no Chrome para intimações urgentes
• Notificações de novos processos distribuídos
• Avisos de prazos críticos
• Badge visual mostrando status de sincronização

✅ Extração Inteligente de Dados
• Número do processo (CNJ)
• Partes (autor, réu, terceiros)
• Classe processual e assunto
• Vara, comarca e órgão julgador
• Último movimento e data/hora
• Expedientes completos (intimações, citações, despachos)

✅ Segurança e Privacidade
• Dados criptografados em trânsito (HTTPS)
• API Key individual por usuário
• Conformidade com LGPD
• Sem acesso a senhas do PJe
• Código auditável e transparente

📊 COMO FUNCIONA

1. Instale a extensão
2. Obtenha sua API Key no Assistente Jurídico
3. Configure a extensão (clique no ícone)
4. Acesse o PJe normalmente
5. Tudo sincroniza automaticamente! ✨

🎓 IDEAL PARA

• Advogados que usam o PJe diariamente
• Escritórios de advocacia
• Departamentos jurídicos
• Assessores jurídicos
• Estudantes de direito

🔧 REQUISITOS

• Conta no Assistente Jurídico (gratuito)
• Acesso ao PJe (qualquer tribunal)
• Chrome, Edge ou Brave (navegadores Chromium)

🌐 TRIBUNAIS COMPATÍVEIS

• TJ-MG, TJ-SP, TJ-RJ, TJ-BA, TJ-PR
• TRT (todas as regiões)
• TRF (todos os tribunais)
• TST, STJ, STF
• E qualquer tribunal que use PJe

📖 SUPORTE

• Dashboard: https://assistente-juridico-github.vercel.app
• Email: suporte@assistentejuridico.com.br
• Documentação: github.com/thiagobodevanadv-alt/assistente-juridico-p

🔒 PRIVACIDADE

Esta extensão NÃO:
❌ Acessa suas senhas do PJe
❌ Compartilha dados com terceiros
❌ Vende informações
❌ Rastreia seu comportamento

Esta extensão SIM:
✅ Respeita a LGPD
✅ Criptografa todos os dados
✅ Permite exportar/deletar seus dados
✅ Mantém transparência total

⭐ AVALIAÇÕES

Ajude-nos a melhorar! Deixe sua avaliação e sugestões.

📱 NOVIDADES EM BREVE

• Suporte para múltiplas contas PJe
• Sincronização de documentos anexos
• Análise de jurisprudência integrada
• Assistente IA para análise processual
• Relatórios automáticos
• Integração com Google Calendar

🚀 Desenvolvido com ❤️ para advogados brasileiros
```

**Categoria:**
```
Ferramentas
```

**Idioma:**
```
português (Brasil)
```

---

## 🎨 Recursos Gráficos Necessários

### 1. Ícone da Store (128x128)
✅ Já existe: `chrome-extension-pje/src/assets/icon-128.png`

### 2. Capturas de Tela (1280x800)

**Screenshot 1: Popup da Extensão**
- Mostrar popup com API Key configurada
- Status "Conectado" (verde)
- Botão "Sincronizar Agora"
- Estatísticas de processos

**Screenshot 2: Badge no PJe**
- Painel do Advogado do PJe
- Badge verde no canto superior direito
- Lista de processos visível

**Screenshot 3: Dashboard Integrado**
- Dashboard do Assistente Jurídico
- Processos sincronizados aparecendo
- Highlight na lista de processos

**Screenshot 4: Notificação Chrome**
- Notificação do Chrome
- Texto: "Nova Intimação - Processo 123..."
- Ícone da extensão

**Screenshot 5: Configuração**
- Tela de configuração da API Key
- Tutorial visual de setup

---

## 🔗 URLs Necessários

**URL da Página Inicial:**
```
https://assistente-juridico-github.vercel.app
```

**URL do Suporte:**
```
https://assistente-juridico-github.vercel.app/suporte
```

**URL Oficial (Search Console):**
```
https://assistente-juridico-github.vercel.app
```

---

## 📋 Política de Privacidade

**URL da Política:**
```
https://assistente-juridico-github.vercel.app/privacy
```

**Permissões Necessárias:**

1. **activeTab** - Para detectar quando usuário está no PJe
2. **storage** - Para salvar API Key localmente
3. **notifications** - Para enviar alertas de intimações
4. **host: *://pje.*.jus.br/** - Para extrair dados do PJe
5. **host: https://assistente-juridico-github.vercel.app/** - Para sincronizar dados

**Justificativa de Permissões:**
```
• activeTab: Necessário para identificar quando usuário acessa PJe
• storage: Armazena API Key de forma segura no Chrome
• notifications: Envia alertas importantes sobre intimações
• pje.*.jus.br: Extrai informações de processos do painel PJe
• assistente-juridico-github.vercel.app: Sincroniza dados com dashboard
```

---

## 🧪 Instruções de Teste

**Para Revisores da Google:**

```
1. CONFIGURAÇÃO INICIAL

   a) Instale a extensão
   b) Clique no ícone da extensão na barra de ferramentas
   c) Use esta API Key de teste:
      sk_bc9751107e545a2d801e9fafd4ac43badfe95bd1e533c537a28d80828e7d0c66
   d) Clique em "Salvar"
   e) Verifique se status mudou para "Conectado" (verde)

2. TESTE NO PJE (SIMULADO)

   a) Acesse: https://assistente-juridico-github.vercel.app/demo-pje
   b) Página de demonstração simula interface do PJe
   c) Badge verde aparecerá no canto superior direito
   d) Clique no badge para ver status de sincronização

   Nota: Para testar em PJe real, é necessário:
   - Certificado digital e-CPF/e-CNPJ
   - Credenciais de advogado ativo na OAB
   - Acesso ao portal de algum tribunal

3. TESTE DE SINCRONIZAÇÃO

   a) No popup da extensão, clique "Sincronizar Agora"
   b) Aguarde mensagem de sucesso
   c) Verifique estatísticas atualizadas
   d) Acesse o dashboard: https://assistente-juridico-github.vercel.app
   e) Faça login com Google (conta de teste fornecida)
   f) Vá em "Processos" e veja dados sincronizados

4. TESTE DE NOTIFICAÇÕES

   a) Com extensão instalada, acesse a página demo
   b) Clique em "Simular Nova Intimação"
   c) Notificação do Chrome deve aparecer
   d) Conteúdo: "Nova Intimação - Processo 1234..."

5. CREDENCIAIS DE TESTE

   Dashboard de teste:
   - Email: teste@assistentejuridico.com.br
   - Senha: [será fornecida por email privado ao revisor]

   API Key de teste:
   - sk_bc9751107e545a2d801e9fafd4ac43badfe95bd1e533c537a28d80828e7d0c66

6. AMBIENTE DE DEMONSTRAÇÃO

   Fornecemos ambiente completo de demonstração que simula:
   - Painel do Advogado do PJe
   - Processos fictícios
   - Intimações de teste
   - Sincronização funcional

   Acesse: https://assistente-juridico-github.vercel.app/demo

7. CONTATO PARA DÚVIDAS

   Em caso de dúvidas durante a revisão:
   - Email: suporte@assistentejuridico.com.br
   - Resposta em até 24h (dias úteis)
```

---

## 📦 Checklist Pré-Publicação

- [ ] Build production da extensão (`npm run build`)
- [ ] Criar ZIP da pasta `dist/`
- [ ] Upload do ZIP na Chrome Web Store
- [ ] Preencher título e resumo
- [ ] Adicionar descrição completa
- [ ] Upload do ícone 128x128
- [ ] Upload de 5 screenshots (1280x800)
- [ ] Adicionar URL da página inicial
- [ ] Adicionar URL do suporte
- [ ] Criar página de privacidade
- [ ] Adicionar instruções de teste detalhadas
- [ ] Solicitar revisão
- [ ] Aguardar aprovação (5-7 dias úteis)

---

## 🎯 Próximos Passos

1. **Criar Screenshots** - Use ferramentas de captura de tela
2. **Criar Página de Privacidade** - Em `/privacy` do dashboard
3. **Criar Página de Suporte** - Em `/suporte` do dashboard
4. **Preparar Ambiente Demo** - Para revisores testarem
5. **Submeter para Revisão** - Na Chrome Web Store

---

**Última atualização:** 11/12/2024
**Versão:** 1.0.0
**Status:** Pronto para submissão
