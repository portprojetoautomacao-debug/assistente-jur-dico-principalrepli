# Configuração do GitHub Copilot Coding Agent

Este documento descreve a configuração do ambiente de desenvolvimento para o GitHub Copilot coding agent no projeto Assistente Jurídico PJe.

## 📋 Visão Geral

O GitHub Copilot coding agent é um assistente de IA que pode trabalhar em tarefas de codificação de forma autônoma. Para funcionar eficientemente, ele precisa de um ambiente de desenvolvimento configurado com todas as ferramentas e dependências do projeto.

Este repositório está configurado com um workflow especial (`.github/workflows/copilot-setup-steps.yml`) que prepara automaticamente o ambiente do Copilot antes que ele comece a trabalhar.

## 🚀 Como Funciona

### 1. Quando o Copilot Inicia uma Tarefa

Quando você atribui uma tarefa ao GitHub Copilot:

1. O GitHub Actions executa o workflow `copilot-setup-steps.yml`
2. O ambiente é preparado com:
   - ✅ Código do repositório clonado
   - ✅ Node.js 20 instalado
   - ✅ Todas as dependências npm instaladas
   - ✅ Cache de dependências configurado
3. Somente depois, o Copilot começa a trabalhar na tarefa

### 2. Benefícios da Configuração

- **⚡ Mais rápido**: Dependências pré-instaladas, sem tentativa e erro
- **🔒 Mais confiável**: Instalação determinística com `npm ci`
- **🎯 Mais eficiente**: Copilot pode imediatamente:
  - Executar `npm run build`
  - Rodar `npm run lint`
  - Executar testes
  - Fazer qualquer operação que precise das dependências

## 🛠️ Configuração Atual

### Arquivo: `.github/workflows/copilot-setup-steps.yml`

```yaml
name: "Copilot Setup Steps"

on:
  workflow_dispatch:      # Permite execução manual
  push:                   # Executa em push ao arquivo
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:           # Executa em PR ao arquivo
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  copilot-setup-steps:    # Nome obrigatório!
    runs-on: ubuntu-latest  # Requisito: Linux x64 Ubuntu
    
    permissions:
      contents: read      # Permissões mínimas
    
    steps:
      - uses: actions/checkout@v5
      
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      
      - run: npm ci
```

### Detalhes Técnicos

| Configuração | Valor | Motivo |
|--------------|-------|--------|
| **Sistema Operacional** | `ubuntu-latest` | Único SO suportado pelo Copilot agent (Linux x64) |
| **Node.js** | `20` | Versão especificada no `.nvmrc` do projeto |
| **Instalação** | `npm ci` | Instalação limpa e determinística |
| **Cache** | Habilitado | Melhora performance nas próximas execuções |
| **Permissões** | `contents: read` | Mínimas necessárias para clonar e instalar |

## 📝 Personalizações Possíveis

### Opções que Você Pode Configurar

De acordo com a documentação oficial, você pode personalizar:

1. **`steps`** - Adicionar ou modificar etapas
2. **`permissions`** - Ajustar permissões necessárias
3. **`runs-on`** - Usar runners maiores (se necessário)
4. **`services`** - Adicionar serviços (ex: banco de dados)
5. **`timeout-minutes`** - Máximo 59 minutos
6. **`snapshot`** - Configurações de snapshot

### Exemplo: Adicionar Build ao Setup

Se você quiser que o build seja pré-executado:

```yaml
steps:
  - uses: actions/checkout@v5
  
  - uses: actions/setup-node@v4
    with:
      node-version: "20"
      cache: "npm"
  
  - name: Install dependencies
    run: npm ci
  
  - name: Pre-build application
    run: npm run build
    env:
      VITE_GOOGLE_CLIENT_ID: 'dummy-for-ci'
      VITE_GOOGLE_API_KEY: 'dummy-for-ci'
      VITE_REDIRECT_URI: 'http://localhost:5173'
      VITE_APP_ENV: 'ci'
```

### Exemplo: Usar Runner Maior

Se o projeto for muito grande e precisar de mais recursos:

```yaml
jobs:
  copilot-setup-steps:
    runs-on: ubuntu-4-core  # Runner com 4 cores
    # ... resto da configuração
```

**Nota**: Runners maiores têm custo adicional. Veja [documentação oficial](https://docs.github.com/en/actions/using-github-hosted-runners/about-larger-runners).

## 🔐 Variáveis de Ambiente

### Configurando Variáveis para o Copilot

Se o Copilot precisar de variáveis de ambiente específicas:

1. Vá em **Settings** → **Environments** no GitHub
2. Crie ou selecione o ambiente `copilot`
3. Adicione variáveis ou secrets necessários

**Variáveis de ambiente** - Para valores não sensíveis:
- Nome: `VITE_APP_ENV`
- Valor: `copilot`

**Secrets** - Para valores sensíveis (API keys, tokens):
- Nome: `API_SECRET_KEY`
- Valor: `sua-chave-secreta`

O Copilot terá acesso automático a essas variáveis durante sua execução.

## ⚠️ Restrições Importantes

### O Que NÃO é Suportado

❌ **Windows ou macOS runners** - Somente Linux Ubuntu x64  
❌ **Self-hosted runners persistentes** - Não recomendado  
❌ **Timeout > 59 minutos** - Limite máximo

### O Que É Suportado

✅ **Self-hosted runners com ARC** (Actions Runner Controller)  
✅ **Runners maiores hospedados pelo GitHub**  
✅ **Git LFS** (Large File Storage)

## 🧪 Testando o Workflow

### Teste Manual

1. Vá na aba **Actions** do repositório
2. Selecione "Copilot Setup Steps"
3. Clique em "Run workflow"
4. Aguarde a execução completar

✅ **Sucesso** = Ambiente configurado corretamente!  
❌ **Falha** = Verifique os logs e corrija os problemas

### Teste Automático

O workflow é executado automaticamente quando você:
- Faz push de alterações ao arquivo `copilot-setup-steps.yml`
- Abre PR modificando o arquivo

Isso permite validar mudanças antes de mesclar.

## 📚 Recursos Adicionais

### Documentação Oficial

- [Personalizar ambiente do Copilot](https://docs.github.com/en/copilot/customizing-copilot/customizing-the-development-environment-for-github-copilot-coding-agent)
- [Sintaxe de workflows do GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Actions Runner Controller (ARC)](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller)

### Documentação do Projeto

- [README de Workflows](.github/workflows/README.md) - Visão geral de todos os workflows
- [SECURITY.md](SECURITY.md) - Políticas de segurança
- [README.md](README.md) - Documentação principal do projeto

## 🔄 Manutenção

### Quando Atualizar

Atualize o `copilot-setup-steps.yml` quando:

- ✏️ Adicionar novas dependências que o Copilot precisa
- ✏️ Mudar a versão do Node.js
- ✏️ Adicionar ferramentas de build adicionais
- ✏️ Precisar de mais recursos (runner maior)

### Como Atualizar

1. Edite `.github/workflows/copilot-setup-steps.yml`
2. Faça commit e push
3. O workflow será executado automaticamente para validar
4. Verifique se passou com sucesso
5. Mescle para a branch padrão

**⚠️ IMPORTANTE**: O workflow só funciona quando está na **branch padrão** (geralmente `main` ou `master`).

## 💡 Dicas

1. **Mantenha simples**: Instale apenas o necessário
2. **Use cache**: Já está configurado no setup do Node.js
3. **Teste localmente**: Certifique-se que `npm ci && npm run build` funciona
4. **Monitore tempo**: Se demorar muito, considere um runner maior
5. **Verifique logs**: Actions tab mostra detalhes de cada execução

## ❓ Solução de Problemas

### Problema: Workflow não executado pelo Copilot

**Solução**: Certifique-se que o arquivo está na branch padrão

```bash
git checkout main
git pull origin main
# Verifique se o arquivo existe
ls .github/workflows/copilot-setup-steps.yml
```

### Problema: Dependências falhando ao instalar

**Solução**: Verifique se `package-lock.json` está atualizado

```bash
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
```

### Problema: Timeout (> 59 minutos)

**Soluções**:
1. Use um runner maior com mais recursos
2. Otimize as etapas de instalação
3. Remova steps desnecessários

### Problema: Permissões insuficientes

**Solução**: Adicione permissões necessárias ao job

```yaml
permissions:
  contents: read        # Para checkout
  packages: read        # Para pacotes privados (se necessário)
```

## 📞 Suporte

Se você encontrar problemas:

1. Verifique os [logs do workflow](../../actions) no GitHub
2. Consulte a [documentação oficial](https://docs.github.com/en/copilot)
3. Abra uma issue no repositório

---

**Última atualização**: Novembro 2025  
**Versão do workflow**: 1.0.0  
**Compatibilidade**: GitHub Copilot coding agent
