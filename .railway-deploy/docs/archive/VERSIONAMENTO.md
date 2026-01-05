# Guia de Versionamento e Releases

## 📋 Visão Geral

Este documento explica como funciona o sistema de versionamento e releases do **Assistente Jurídico PJe**.

## 🏷️ Versionamento Semântico

Este projeto segue o [Versionamento Semântico 2.0.0](https://semver.org/lang/pt-BR/).

### Formato da Versão: `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Mudanças incompatíveis com versões anteriores
- **MINOR** (0.X.0): Novas funcionalidades mantendo compatibilidade
- **PATCH** (0.0.X): Correções de bugs mantendo compatibilidade

### Exemplos

- `1.0.0` → `2.0.0`: Breaking changes (ex: remover funcionalidade)
- `1.0.0` → `1.1.0`: Nova funcionalidade (ex: novo agente IA)
- `1.0.0` → `1.0.1`: Correção de bug (ex: fix de autenticação)

## 🚀 Processo de Release

### 1. Preparar a Release

```bash
# 1. Certifique-se de estar na branch main atualizada
git checkout main
git pull origin main

# 2. Atualize o CHANGELOG.md com as mudanças
# Adicione uma nova seção com a versão e data

# 3. Atualize a versão no package.json
npm version [major|minor|patch]
# Isso cria automaticamente um commit e uma tag

# Ou manualmente:
# Edite package.json: "version": "1.1.0"
# git add package.json CHANGELOG.md
# git commit -m "chore: release v1.1.0"
```

### 2. Criar a Tag de Release

```bash
# Se não usou npm version, crie a tag manualmente:
git tag -a v1.1.0 -m "Release v1.1.0"

# Push do commit e da tag
git push origin main
git push origin v1.1.0
```

### 3. Automação via GitHub Actions

Quando você faz push de uma tag que começa com `v`, o GitHub Actions automaticamente:

1. ✅ Executa build e testes
2. 📦 Cria um arquivo ZIP da aplicação
3. 📝 Gera notas de release do CHANGELOG.md
4. 🎉 Publica uma GitHub Release
5. 🚀 Aciona deploy automático para produção

### 4. Verificar o Deploy

1. Acesse a aba [Actions](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/actions)
2. Verifique o workflow **Release** (executado pela tag)
3. Verifique o workflow **Deploy** (acionado automaticamente)
4. Acesse a [página de Releases](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/releases)

## 📝 Formato do CHANGELOG

Ao adicionar uma nova versão no `CHANGELOG.md`, use este template:

```markdown
## [1.1.0] - 2025-11-19

### Added
- Nova funcionalidade de análise preditiva
- Integração com sistema XYZ

### Changed
- Melhorias na interface do dashboard
- Otimização de performance

### Fixed
- Corrigido bug no cálculo de prazos
- Resolvido problema de sincronização

### Security
- Atualização de dependências com vulnerabilidades

[1.1.0]: https://github.com/thiagobodevan-a11y/assistente-jurdico-p/compare/v1.0.0...v1.1.0
```

## 🔄 Workflow de Release Manual

Se preferir criar releases manualmente via interface do GitHub:

1. Vá para [Releases](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/releases)
2. Clique em **"Create a new release"**
3. Em **"Choose a tag"**, digite `v1.1.0` e clique em **"Create new tag"**
4. Preencha o título: `v1.1.0`
5. Copie as notas do CHANGELOG.md
6. Marque **"Set as the latest release"**
7. Clique em **"Publish release"**

O workflow será acionado automaticamente.

## 🏷️ Tipos de Releases

### Release Estável (Padrão)

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
```

### Pre-release (Beta/Alpha)

```bash
git tag -a v1.1.0-beta.1 -m "Beta release v1.1.0-beta.1"
```

O workflow detecta automaticamente e marca como pre-release se contiver:
- `alpha`
- `beta`
- `rc` (release candidate)

## 🔒 Versões Imutáveis

Uma vez criada uma tag de versão (ex: `v1.0.0`), ela é **imutável**:

- ✅ A tag não deve ser movida ou deletada
- ✅ O código daquela versão permanece congelado
- ✅ Correções devem ir em uma nova versão (ex: `v1.0.1`)

### Por que versões imutáveis são importantes?

1. **Rastreabilidade**: Sempre saberemos exatamente qual código está em produção
2. **Rollback confiável**: Podemos voltar para versões anteriores com segurança
3. **Auditoria**: Histórico completo de todas as mudanças
4. **Conformidade**: Atende requisitos de compliance e certificações

## 📦 Artefatos da Release

Cada release inclui:

- 📄 Notas de release (do CHANGELOG.md)
- 📦 Arquivo ZIP com o build (`assistente-juridico-pje-vX.X.X.zip`)
- 🔗 Link para o código fonte
- 🏷️ Tag Git imutável

## 🌍 Ambientes

### Production (Produção)
- **Trigger**: Push de tag `v*.*.*` ou deploy manual
- **URL**: https://assistente-juridico-pje.vercel.app
- **Branch**: `main`
- **Auto-deploy**: ✅ Sim (via GitHub Actions)

### Preview (Pré-visualização)
- **Trigger**: Pull Request
- **URL**: Gerada automaticamente pelo Vercel
- **Branch**: Qualquer branch com PR
- **Auto-deploy**: ✅ Sim

## 🚨 Hotfixes (Correções Urgentes)

Para correções urgentes em produção:

```bash
# 1. Crie uma branch de hotfix
git checkout -b hotfix/v1.0.1 v1.0.0

# 2. Faça as correções necessárias
# ... editar arquivos ...

# 3. Commit e tag
git add .
git commit -m "fix: corrige problema crítico X"
git tag -a v1.0.1 -m "Hotfix v1.0.1"

# 4. Push (isso aciona o deploy automático)
git push origin hotfix/v1.0.1
git push origin v1.0.1

# 5. Merge de volta para main
git checkout main
git merge hotfix/v1.0.1
git push origin main
```

## 📊 Checklist de Release

Antes de fazer uma release, verifique:

- [ ] Todos os testes passando
- [ ] Build sem erros
- [ ] CHANGELOG.md atualizado
- [ ] Versão no package.json atualizada
- [ ] Documentação atualizada (se necessário)
- [ ] Features testadas em preview
- [ ] Secrets do GitHub configurados
- [ ] Variáveis de ambiente do Vercel configuradas

## 🔑 Secrets Necessários

Certifique-se de que estes secrets estão configurados no GitHub:

### Para Deploy
- `VERCEL_TOKEN` - Token de autenticação do Vercel
- `VERCEL_ORG_ID` - ID da organização no Vercel
- `VERCEL_PROJECT_ID` - ID do projeto no Vercel

### Para a Aplicação
- `VITE_GOOGLE_CLIENT_ID` - Client ID do Google OAuth
- `VITE_GOOGLE_API_KEY` - API Key do Google
- `VITE_REDIRECT_URI` - URI de redirecionamento OAuth

## 📚 Recursos Adicionais

- [CHANGELOG.md](./CHANGELOG.md) - Histórico de versões
- [GITHUB_ACTIONS_DEPLOY_GUIDE.md](./GITHUB_ACTIONS_DEPLOY_GUIDE.md) - Guia de deploy
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Configuração Vercel
- [Semantic Versioning](https://semver.org/lang/pt-BR/)
- [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)

## ❓ Problemas Comuns

### Tag não aciona o workflow

**Problema**: Fiz push da tag mas o workflow não executou.

**Solução**: 
```bash
# Verifique se a tag está no formato correto (v*.*.*)
git tag -l

# Delete e recrie se necessário
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### Deploy falha por falta de secrets

**Problema**: Workflow falha com erro de secrets não configurados.

**Solução**: Configure os secrets em Settings → Secrets and variables → Actions

### Como reverter uma release?

**Solução**: 
```bash
# NÃO delete a tag! Crie uma nova versão
git checkout v1.0.0  # versão boa anterior
git checkout -b hotfix/v1.0.2
# ... faça ajustes se necessário ...
git tag -a v1.0.2 -m "Reverte mudanças da v1.0.1"
git push origin hotfix/v1.0.2
git push origin v1.0.2
```

## 🎯 Próximos Passos

Após configurar o versionamento:

1. ✅ Faça sua primeira release oficial (`v1.0.0`)
2. 📝 Mantenha o CHANGELOG.md sempre atualizado
3. 🔄 Use branches de feature para desenvolvimento
4. 🚀 Confie no processo automatizado
5. 📊 Monitore os deploys no Vercel e GitHub Actions

---

**Versão deste documento**: 1.0.0  
**Última atualização**: 2025-11-18
