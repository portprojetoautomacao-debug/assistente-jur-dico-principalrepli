# 🚀 Guia Rápido - GitPod Ona Cloud

## ✅ Status da Configuração

**Ambiente**: GitPod Ona Cloud (EU01)
**Status**: ✅ Configurado e validado
**Última validação**: 04 de Janeiro de 2026

---

## 📋 O Que Foi Configurado

### 1. ✅ Arquivo de Automações
```
📁 .ona/automations.yaml
```
Configurações de pré-build, tarefas automáticas e monitoramento.

### 2. ✅ Container de Desenvolvimento
```
📁 .devcontainer/devcontainer.json
```
Ambiente Node.js 22 + Java 21 com todas as extensões necessárias.

### 3. ✅ Script de Validação
```bash
.ona/validate-config.sh
```
Verifica se tudo está funcionando corretamente.

---

## 🎯 Como Usar

### No Portal GitPod Ona

1. **Acesse**: https://app.gitpod.io/projects/[seu-projeto]/settings

2. **Configure os caminhos**:
   - **Container**: `.devcontainer/devcontainer.json`
   - **Automações**: `.ona/automations.yaml`

3. **Ative pré-builds**:
   - ✅ Ambientes pré-configurados: **ON**
   - ⏰ Horário: **14:00 UTC** (diário)
   - 🖥️ Classe: **Regular (Ona Cloud EU01)**

4. **Clique em**: "Salvar alterações"

---

## 🚀 Primeira Execução

Após criar um novo workspace:

```bash
# O ambiente já estará configurado automaticamente!
# Servidores já estarão rodando:

✅ Frontend: http://localhost:5173
✅ Backend:  http://localhost:3001
```

### Validar Configuração

```bash
# Execute o validador
./.ona/validate-config.sh
```

Você deve ver:
```
🎉 Configuração perfeita! Tudo pronto para usar.
✅ Verificações passadas: 32
```

---

## 📦 Tarefas Automáticas Configuradas

### 🔄 No Startup (Automático)
- ✅ Frontend (Vite) - Porta 5173
- ✅ Backend (Express) - Porta 3001
- ✅ TypeScript Watch
- ✅ Instalação de dependências

### ⏰ Agendadas
- **A cada 5 min**: Auto lint fix
- **A cada 15 min**: Health check dos agentes
- **A cada 30 min**: Análise SonarQube
- **Diariamente 04:00 UTC**: Pré-build completo

---

## 🛠️ Comandos Disponíveis

### Desenvolvimento
```bash
npm run dev                    # Frontend (Vite)
cd backend && npm run dev      # Backend (Express)
```

### Testes
```bash
npm test                       # Testes unitários (watch)
npm run test:run              # Executar todos os testes
npm run test:e2e              # Testes E2E (Playwright)
npm run test:coverage         # Relatório de cobertura
```

### Build
```bash
npm run build                 # Build apenas frontend
npm run build:deploy          # Build completo (front + back)
npm run preview               # Preview do build
```

### Validação
```bash
npm run type-check            # Verificar tipos TypeScript
npm run lint                  # Verificar código (ESLint)
npm run lint:fix              # Corrigir problemas automaticamente
```

---

## 📊 Portas Expostas

| Porta | Serviço | URL |
|-------|---------|-----|
| 5173 | Frontend (Vite) | `http://localhost:5173` |
| 3001 | Backend (Express) | `http://localhost:3001` |
| 4173 | Preview | `http://localhost:4173` |
| 51204 | Vitest UI | `http://localhost:51204` |

---

## 🔍 Monitoramento

### Ver Status dos Servidores
```bash
# Ver processos Node.js rodando
ps aux | grep node

# Ver logs do backend
tail -f backend/logs/*.log

# Verificar portas abertas
netstat -tulpn | grep LISTEN
```

### Health Check Manual
```bash
# Verificar agentes
./health-check-agents.sh

# Análise SonarQube
./scripts/sonar-auto-analyze.sh --fix
```

---

## 🐛 Troubleshooting

### Problema: Servidores não iniciam

**Solução**:
```bash
# Matar processos antigos
npm run kill

# Limpar cache
rm -rf node_modules/.vite .eslintcache

# Reinstalar
npm install

# Iniciar novamente
npm run dev
```

### Problema: Porta já em uso

**Solução**:
```bash
# Encontrar processo na porta 5173
lsof -ti:5173

# Matar processo
kill -9 $(lsof -ti:5173)

# Ou usar o comando kill do projeto
npm run kill
```

### Problema: Tipos TypeScript com erro

**Solução**:
```bash
# Verificar erros
npm run type-check

# Se persistir, limpar cache
rm -rf node_modules/.vite tsconfig.tsbuildinfo
npm install
```

### Problema: Testes falhando

**Solução**:
```bash
# Limpar cache de testes
npm run test:clear-cache

# Atualizar snapshots
npm run test:update-snapshots

# Executar novamente
npm run test:run
```

---

## 📚 Arquivos Importantes

```
.ona/
├── automations.yaml          # Configurações de automação
├── README.md                 # Documentação completa
├── validate-config.sh        # Script de validação
└── QUICK_START.md           # Este arquivo

.devcontainer/
└── devcontainer.json        # Configuração do container

package.json                 # Scripts e dependências
backend/package.json         # Backend: scripts e deps
```

---

## 🎯 Próximos Passos

1. ✅ Configuração concluída
2. ✅ Ambiente validado
3. 🔄 **Agora**: Configure no portal GitPod
4. 🚀 **Depois**: Crie um workspace e teste
5. 📊 **Por fim**: Monitore os pré-builds

---

## 🆘 Suporte

### Validar Configuração
```bash
./.ona/validate-config.sh
```

### Logs de Debug
```bash
# Backend
tail -f backend/logs/*.log

# SonarQube
cat .sonar-results/auto-analyze.log

# Sistema
journalctl -f
```

### Documentação Completa
- [.ona/README.md](./.ona/README.md)
- [COMECE_AQUI.md](../COMECE_AQUI.md)
- [BUILD_GUIDE.md](../BUILD_GUIDE.md)

---

## 🎉 Tudo Pronto!

Sua configuração está completa e validada. O ambiente GitPod Ona Cloud está pronto para uso com:

- ✅ Pré-builds configurados
- ✅ Automações ativas
- ✅ Monitoramento contínuo
- ✅ Todas as ferramentas instaladas

**Aproveite o desenvolvimento!** 🚀

---

_Última atualização: 04/01/2026 14:04 UTC_
