# 🚀 Agentes GitLab - Guia de Configuração

## ⚠️ IMPORTANTE: Pré-requisitos para Configuração

### 1. Instalar GitLab CLI (glab)

**Opção 1 - Download direto:**
```bash
# Baixar a versão mais recente
curl -LO https://gitlab.com/cli/cli/-/releases/latest/downloads/glab_1.45.0_Linux_x86_64.tar.gz
tar -xzf glab_1.45.0_Linux_x86_64.tar.gz
sudo mv glab /usr/local/bin/
```

**Opção 2 - Via Go (se Go estiver instalado):**
```bash
go install gitlab.com/gitlab-org/cli/cmd/glab@latest
```

**Opção 3 - Via Snap:**
```bash
sudo snap install glab --edge
```

### 2. Autenticar no GitLab

```bash
# Login interativo
glab auth login

# Ou usando token
glab auth login --token YOUR_GITLAB_TOKEN
```

### 3. Verificar instalação
```bash
glab --version
glab auth status
```

## Visão Geral

Este projeto utiliza **GitLab Agents** para executar pipelines de CI/CD em diferentes ambientes. Os agentes estão organizados por ambiente de deployment:

- **Desenvolvimento**: Para desenvolvimento e testes iniciais
- **QA**: Para testes abrangentes e validação de qualidade
- **Produção**: Para deployments em produção com alta confiabilidade

## Estrutura dos Agentes

```
.gitlab/agents/
├── agente-desenvolvimento/
│   └── config.toml          # Configuração do agente de dev
├── agente-qa/
│   └── config.toml          # Configuração do agente de QA
├── agente-producao/
│   └── config.toml          # Configuração do agente de produção
└── register-agents.sh       # Script de registro automatizado
```

## Configuração dos Tokens

### 1. Criar Tokens de Agente no GitLab

Para cada ambiente, você precisa criar um token específico no GitLab:

1. Vá para seu projeto no GitLab
2. **Settings > CI/CD > Runners**
3. Clique em **"New project runner"**
4. Configure cada runner com:
   - **Platform**: Linux
   - **Architecture**: amd64
   - **Tags**: `docker,linux`
   - **Run untagged jobs**: Não
   - **Lock to current projects**: Sim

### 2. Configurar Variáveis de Ambiente

Após criar os runners, copie os tokens de autenticação e configure como variáveis no GitLab:

**Settings > CI/CD > Variables**

Adicione as seguintes variáveis (marcadas como protegidas e mascaradas):

- `AGENTE_DESENVOLVIMENTO_TOKEN` = Token do runner de desenvolvimento
- `AGENTE_QA_TOKEN` = Token do runner de QA
- `AGENTE_PRODUCAO_TOKEN` = Token do runner de produção

### 3. Configurar Variáveis Locais (para desenvolvimento)

Para desenvolvimento local, crie um arquivo `.env.local`:

```bash
# Tokens dos agentes GitLab
AGENTE_DESENVOLVIMENTO_TOKEN=your_dev_token_here
AGENTE_QA_TOKEN=your_qa_token_here
AGENTE_PRODUCAO_TOKEN=your_prod_token_here
```

## Registro dos Agentes

### ⚠️ IMPORTANTE: Ordem de Execução

Os agentes devem ser registrados nesta ordem:
1. **Desenvolvimento** (mais permissivo)
2. **QA** (intermediário)
3. **Produção** (mais restritivo)

### Método Automático (Recomendado)

Após instalar o GitLab CLI e configurar os tokens:

```bash
# Tornar o script executável
chmod +x .gitlab/register-agents.sh

# Executar o registro automático
./.gitlab/register-agents.sh
```

### Método Manual (Passo a Passo)

Se preferir registrar manualmente:

#### 1. Agente de Desenvolvimento
```bash
glab ci runners register \
  --name "assistente-juridico-dev" \
  --url "https://gitlab.com/" \
  --token "$AGENTE_DESENVOLVIMENTO_TOKEN" \
  --executor "docker" \
  --tag-list "docker,linux,dev" \
  --run-untagged=false \
  --locked=true
```

#### 2. Agente de QA
```bash
glab ci runners register \
  --name "assistente-juridico-qa" \
  --url "https://gitlab.com/" \
  --token "$AGENTE_QA_TOKEN" \
  --executor "docker" \
  --tag-list "docker,linux,qa" \
  --run-untagged=false \
  --locked=true
```

#### 3. Agente de Produção
```bash
glab ci runners register \
  --name "assistente-juridico-prod" \
  --url "https://gitlab.com/" \
  --token "$AGENTE_PRODUCAO_TOKEN" \
  --executor "docker" \
  --tag-list "docker,linux,prod" \
  --run-untagged=false \
  --locked=true
```

### Verificar Registro

Após o registro, verifique se os agentes estão ativos:

```bash
# Listar todos os runners do projeto
glab ci runners list

# Verificar status dos runners
glab ci runners status
```

## Funcionalidades por Ambiente

### 🏗️ Desenvolvimento
- **Build**: Compilação rápida para desenvolvimento
- **Test**: Testes unitários básicos
- **Deploy**: Deploy automático para ambiente dev

### 🧪 QA (Quality Assurance)
- **Build**: Build otimizado com análise de bundle
- **Test**: Testes unitários, integração e E2E
- **Security**: Análise de vulnerabilidades
- **Performance**: Testes de performance e Lighthouse
- **Deploy**: Deploy para ambiente de QA

### 🚀 Produção
- **Build**: Build de produção otimizado
- **Test**: Testes de smoke e caminhos críticos
- **Security**: Verificação de segurança final
- **Deploy**: Deploy manual para produção
- **Cleanup**: Limpeza pós-deploy

## Monitoramento

### Verificar Status dos Agentes

```bash
# Listar todos os runners
glab ci runners list

# Verificar status específico
glab ci runners status <runner-id>
```

### Logs de Pipeline

```bash
# Ver logs do último pipeline
glab ci pipeline logs

# Ver status dos jobs
glab ci pipeline status
```

## Troubleshooting

### Agente Não Conecta

1. Verificar se o token está correto
2. Verificar conectividade de rede
3. Verificar logs do GitLab Runner

### Pipeline Falha

1. Verificar logs detalhados: `glab ci pipeline logs --detailed`
2. Verificar variáveis de ambiente
3. Verificar permissões do agente

### Performance

- Monitore o uso de recursos dos agentes
- Ajuste concurrency nos arquivos de configuração
- Considere escalar horizontalmente se necessário

## Segurança

- ✅ Tokens são armazenados como variáveis protegidas
- ✅ Agentes têm acesso limitado por ambiente
- ✅ Deployments de produção são manuais
- ✅ Logs são rotacionados automaticamente

## Próximos Passos

1. **Configurar infraestrutura** para cada ambiente
2. **Implementar monitoring** avançado
3. **Configurar backups** automáticos
4. **Implementar rollback** automático
5. **Configurar alertas** para falhas

---

📚 **Documentação Relacionada:**
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [GitLab Runner Documentation](https://docs.gitlab.com/runner/)
- [GitLab Agents](https://docs.gitlab.com/ee/user/clusters/agent/)