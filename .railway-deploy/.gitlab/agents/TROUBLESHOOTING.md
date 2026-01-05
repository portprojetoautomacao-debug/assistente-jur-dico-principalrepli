# Troubleshooting - Agentes GitLab

## Problemas Comuns e Soluções

### 1. Erro: "GitLab CLI não encontrado"
**Sintomas:** Comando `glab` não é reconhecido
**Solução:**
```bash
# Instalar manualmente
curl -LO https://gitlab.com/cli/cli/-/releases/latest/downloads/glab_1.45.0_Linux_x86_64.tar.gz
tar -xzf glab_1.45.0_Linux_x86_64.tar.gz
sudo mv glab /usr/local/bin/
glab --version
```

### 2. Erro: "Não autenticado no GitLab"
**Sintomas:** `glab auth status` falha
**Solução:**
```bash
# Login interativo
glab auth login

# Ou com token
glab auth login --token YOUR_GITLAB_TOKEN
```

### 3. Erro: "Token inválido"
**Sintomas:** Registro do agente falha com erro de autenticação
**Solução:**
1. Verifique se o token foi copiado corretamente
2. Confirme que o token não expirou
3. Certifique-se de que o token tem permissões adequadas
4. Recrie o token se necessário

### 4. Erro: "Runner já existe"
**Sintomas:** Agente já foi registrado anteriormente
**Solução:**
```bash
# Listar runners existentes
glab ci runners list

# Remover runner antigo se necessário
glab ci runners delete RUNNER_ID

# Ou usar um nome diferente para o novo runner
```

### 5. Pipelines não executam nos agentes
**Sintomas:** Jobs ficam pendentes ou não são capturados pelos agentes
**Solução:**
1. Verifique se os agentes estão online: `glab ci runners status`
2. Confirme que as tags dos jobs correspondem às tags dos agentes
3. Verifique se os agentes não estão pausados
4. Confirme que os tokens estão configurados corretamente

## Comandos Úteis para Debug

```bash
# Verificar status de todos os runners
glab ci runners list

# Verificar status detalhado de um runner específico
glab ci runners status RUNNER_ID

# Ver logs de um runner
glab ci runners logs RUNNER_ID

# Listar jobs recentes
glab ci jobs list --per-page 10

# Ver detalhes de um job específico
glab ci jobs view JOB_ID
```

## Monitoramento Contínuo

### Health Checks
- Verifique regularmente se os agentes estão online
- Monitore o uso de recursos dos servidores dos agentes
- Configure alertas para quando agentes ficarem offline

### Logs e Auditoria
- Mantenha logs dos agentes para troubleshooting
- Audite mudanças nos tokens e configurações
- Monitore performance dos pipelines

## Suporte Adicional

Se os problemas persistirem:
1. Consulte a documentação oficial do GitLab: https://docs.gitlab.com/runner/
2. Verifique os logs detalhados dos agentes
3. Entre em contato com o suporte do GitLab se necessário