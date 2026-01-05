# 🔒 Guia de Segurança - Todoist Integration

## ⚠️ Regras Críticas

### ❌ NUNCA Faça Isso

1. **Não compartilhe tokens em:**
   - Mensagens de chat (Slack, Discord, Copilot, etc.)
   - Capturas de tela
   - Commits Git
   - Documentação pública
   - Issues/PRs públicas
   - Arquivos não criptografados

2. **Não copie/cole da interface do Todoist diretamente para:**
   - Chats públicos
   - Notas compartilhadas
   - E-mails
   - Formulários web

3. **Não armazene tokens em:**
   - Arquivos `.env` commitados no Git
   - Comentários no código
   - Logs de aplicação
   - Histórico do terminal

### ✅ Sempre Faça Isso

1. **Armazenamento Seguro:**
   ```bash
   # Local (desenvolvimento)
   echo "VITE_TODOIST_API_KEY=seu_token_aqui" >> .env
   
   # Produção (Vercel)
   vercel env add VITE_TODOIST_API_KEY production
   
   # CI/CD (GitLab)
   # Settings > CI/CD > Variables > Add Variable
   ```

2. **Validação de .gitignore:**
   ```bash
   # Verificar se .env está ignorado
   git check-ignore .env
   
   # Deve retornar: .env
   ```

3. **Rotação Regular de Tokens:**
   - Revogue e gere novo token a cada 90 dias
   - Revogue imediatamente se houver suspeita de exposição
   - Use script seguro: `bash /tmp/update-todoist-tokens.sh`

4. **Monitoramento:**
   - Revise logs de acesso periodicamente
   - Ative notificações de atividades suspeitas
   - Use tokens separados para dev/staging/production

## 🔐 Como Obter Token de Forma Segura

### Passo 1: Acesse a página de integrações
```
https://todoist.com/app/settings/integrations
```

### Passo 2: Gere novo token
1. Role até "Token API"
2. Copie o token (Ctrl+C)
3. **NÃO cole** em lugar nenhum visível

### Passo 3: Configure localmente
```bash
# Use o script seguro (não exibe token na tela)
bash /tmp/update-todoist-tokens.sh

# OU manualmente (cuidado com histórico)
read -sp "Token: " TOKEN && echo "VITE_TODOIST_API_KEY=$TOKEN" >> .env && unset TOKEN
```

### Passo 4: Limpe histórico
```bash
# Bash
history -c && history -w

# Zsh
rm ~/.zsh_history && history -p
```

## 🚨 O Que Fazer se Token Foi Exposto

### Ação Imediata (primeiros 5 minutos)
1. **Revogar token** em: https://todoist.com/app/settings/integrations
2. **Gerar novo token** imediatamente
3. **Atualizar** em todos os ambientes (local, Vercel, GitLab)

### Investigação (primeiros 30 minutos)
1. Verificar logs de acesso do Todoist
2. Revisar tarefas/projetos para mudanças não autorizadas
3. Verificar se houve vazamento em outros lugares

### Mitigação (primeira hora)
1. Atualizar todos os tokens relacionados (se houver)
2. Revisar permissões de colaboradores
3. Documentar o incidente

### Prevenção (longo prazo)
1. Implementar secrets scanning (GitHub/GitLab)
2. Configurar pre-commit hooks
3. Treinar equipe sobre segurança de tokens

## 📋 Checklist de Segurança

- [ ] `.env` está no `.gitignore`
- [ ] Tokens diferentes para dev/staging/prod
- [ ] Secrets configurados no Vercel
- [ ] Secrets configurados no GitLab CI/CD
- [ ] Script de rotação de tokens criado
- [ ] Equipe treinada sobre não compartilhar tokens
- [ ] Monitoramento de acesso configurado
- [ ] Backup de configurações (sem tokens) mantido

## 🔗 Recursos Adicionais

- [Todoist API Documentation](https://developer.todoist.com/rest/v2/#authentication)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [GitLab CI/CD Variables](https://docs.gitlab.com/ee/ci/variables/)

---

**Última atualização**: 23/11/2025  
**Autor**: Sistema de Segurança
