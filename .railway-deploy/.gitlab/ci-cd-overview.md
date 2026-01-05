# Catálogo CI/CD - Assistente Jurídico PJe
# Visão geral de todas as opções de CI/CD disponíveis

## 📋 Estratégias Disponíveis

### 1. 🔧 Componentes Customizados (Recomendado para Jurídico)
**Arquivo**: `.gitlab-ci.yml` (ativo)
**Status**: ✅ Configurado e funcional
**Versão**: 1.1.0
**Componentes**: 8 especializados

#### Funcionalidades
- ✅ Auditoria de segurança avançada com compliance LGPD
- ✅ Testes completos (unitários, E2E, acessibilidade)
- ✅ Deploy multi-plataforma (Vercel, Netlify, Docker)
- ✅ Monitoramento com Core Web Vitals
- ✅ Notificações inteligentes (Slack/Teams/Email)
- ✅ Backup automático de dados jurídicos
- ✅ Testes de API (smoke, carga, segurança)
- ✅ Deploy em container (Blue-green, Canary)

#### Vantagens
- Controle total sobre o pipeline
- Funcionalidades específicas para jurídico
- Alta customização e flexibilidade
- Compliance LGPD integrado

#### Como usar
```bash
# Pipeline já ativo, apenas faça commits
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

---

### 2. ⚡ Auto DevOps (Simples e Automático)
**Arquivo**: `.gitlab/auto-devops-config.yml`
**Status**: ✅ Preparado para ativação
**Configuração**: Toggle no GitLab

#### Funcionalidades
- ✅ Detecção automática de React/TypeScript
- ✅ Build, test e deploy automático
- ✅ Security scanning integrado (SAST/DAST)
- ✅ Performance testing básico
- ✅ Deploy para Kubernetes
- ✅ Rollback automático
- ⚠️ Funcionalidades jurídicas limitadas (extensível)

#### Vantagens
- Configuração mínima (toggle no GitLab)
- Pronto para usar em minutos
- Atualizado automaticamente pelo GitLab
- Ideal para começar rapidamente

#### Como ativar
```bash
# Execute o script de configuração
./setup-auto-devops.sh

# OU manualmente no GitLab:
# Settings > CI/CD > Auto DevOps
# ✓ "Default to Auto DevOps pipeline"
```

---

### 3. 🔄 Estratégia Híbrida (Melhor dos Dois Mundos)
**Arquivo**: `.gitlab/auto-devops-config.yml` + componentes
**Status**: ✅ Configuração preparada

#### Funcionalidades
- ✅ Auto DevOps como base sólida
- ✅ Componentes customizados adicionais
- ✅ Funcionalidades jurídicas específicas
- ✅ Manutenção simplificada

#### Como implementar
```yaml
# .gitlab-ci.yml híbrido
include:
  - template: Auto-DevOps.gitlab-ci.yml
  - component: $CI_SERVER_FQDN/$CI_PROJECT_PATH/templates/security/security-component@1.1.0
  - component: $CI_SERVER_FQDN/$CI_PROJECT_PATH/templates/backup/backup-component@1.1.0
```

## 🎯 Qual Estratégia Escolher?

### Para Aplicações Jurídicas Críticas
👉 **Componentes Customizados**
- Requisitos específicos de compliance
- Controle total necessário
- Time com expertise DevOps

### Para Desenvolvimento Rápido
👉 **Auto DevOps**
- Prototipagem ou MVP
- Time iniciante em DevOps
- Foco no código, não infraestrutura

### Para Equilíbrio Perfeito
👉 **Híbrida**
- Auto DevOps como base
- Componentes para funcionalidades críticas
- Melhor performance e controle

## 📊 Comparação Rápida

| Recurso | Componentes | Auto DevOps | Híbrida |
|---------|-------------|-------------|---------|
| **Setup** | 🔧 Complexo | ⚡ Simples | 🔧 Médio |
| **Controle** | ✅ Total | ⚠️ Limitado | ✅ Alto |
| **Jurídico** | ✅ Especializado | ⚠️ Básico | ✅ Avançado |
| **Manutenção** | 🔧 Manual | ✅ Automática | 🔧 Híbrida |
| **Velocidade** | 🐌 Lento | ⚡ Rápido | ⚡ Médio |

## 🚀 Próximos Passos

### Se escolher Componentes Customizados (Atual)
```bash
# Já está ativo! Apenas desenvolva
git add .
git commit -m "feat: sua funcionalidade"
git push origin main
```

### Se escolher Auto DevOps
```bash
# Execute configuração
./setup-auto-devops.sh

# Ative no GitLab Settings > CI/CD > Auto DevOps
```

### Se escolher Híbrida
```bash
# Use o arquivo .gitlab/auto-devops-config.yml como base
# Adicione includes dos componentes necessários
```

## 📚 Documentação

- **Componentes Customizados**: `.gitlab/templates/README.md`
- **Auto DevOps**: `docs/CI-CD_STRATEGIES.md`
- **Guia de Migração**: `docs/CI-CD_STRATEGIES.md`
- **Setup Scripts**: `setup-catalog.sh`, `setup-auto-devops.sh`

## 💡 Recomendação

Para o **Assistente Jurídico PJe**, recomendamos manter os **Componentes Customizados** pois:
- Aplicação crítica com requisitos de compliance
- Funcionalidades específicas para jurídico necessárias
- Controle total sobre segurança e backup de dados
- Time preparado para manutenção dos componentes

O **Auto DevOps** pode ser usado como alternativa rápida para desenvolvimento ou como base para projetos futuros menos críticos.