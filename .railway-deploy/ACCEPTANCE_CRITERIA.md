# ✅ Critérios de Aceitação para Produção
## Assistente Jurídico PJe

---

## 🎯 Critérios Gerais

### 1. Funcionalidade
- [ ] **100%** das funcionalidades críticas operacionais
- [ ] **95%** das funcionalidades de alta prioridade operacionais
- [ ] **80%** das funcionalidades de média prioridade operacionais
- [ ] Sem bugs bloqueadores (severity: critical)
- [ ] Máximo 5 bugs de alta severidade conhecidos (com workaround)

### 2. Performance
- [ ] **First Contentful Paint (FCP)** < 1.5s
- [ ] **Largest Contentful Paint (LCP)** < 2.5s
- [ ] **Time to Interactive (TTI)** < 3.5s
- [ ] **Total Blocking Time (TBT)** < 300ms
- [ ] **Cumulative Layout Shift (CLS)** < 0.1
- [ ] Lighthouse Score **> 90** (Performance)
- [ ] Tempo de resposta de APIs **< 500ms** (p95)
- [ ] Queries de banco **< 100ms** (p95)

### 3. Segurança
- [ ] **Zero** vulnerabilidades críticas (`npm audit`)
- [ ] **Zero** vulnerabilidades altas não mitigadas
- [ ] HTTPS obrigatório em produção
- [ ] Headers de segurança configurados:
  - `Strict-Transport-Security`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Content-Security-Policy`
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo (100 req/min por IP)
- [ ] Secrets não expostos em código/logs
- [ ] Autenticação funcional e segura

### 4. Confiabilidade
- [ ] **Uptime** > 99.5% (medido em staging)
- [ ] **Taxa de erro** < 1%
- [ ] Retry automático em falhas transientes
- [ ] Circuit breaker ativo para serviços externos
- [ ] Graceful degradation quando serviços indisponíveis
- [ ] Logs estruturados e centralizados
- [ ] Monitoramento ativo (APM)
- [ ] Alertas configurados

### 5. Testes
- [ ] **Cobertura de código** > 70%
- [ ] **Testes unitários** > 80% de cobertura
- [ ] **Testes de integração** passando 100%
- [ ] **Testes E2E críticos** passando 100%
- [ ] **Testes de carga** validados (50 usuários simultâneos)
- [ ] **Smoke tests** automatizados
- [ ] **Regression tests** passando

### 6. Documentação
- [ ] README atualizado
- [ ] DEPLOY_CONFIG.md completo
- [ ] API documentation atualizada
- [ ] Runbook de operações criado
- [ ] Guia de troubleshooting disponível
- [ ] Plano de rollback documentado
- [ ] Changelog atualizado

---

## 🔴 Critérios Críticos (Bloqueadores)

### Autenticação
- [ ] Login funciona com credenciais válidas
- [ ] Login rejeita credenciais inválidas
- [ ] Sessão persiste após reload
- [ ] Logout limpa sessão corretamente
- [ ] Rotas protegidas não acessíveis sem autenticação
- [ ] Sem vazamento de tokens/credenciais

### Gestão de Processos
- [ ] CRUD completo funcional
- [ ] Validação de número CNJ funciona
- [ ] Busca retorna resultados corretos
- [ ] Paginação funciona com 1000+ processos
- [ ] Sem perda de dados ao salvar
- [ ] Performance aceitável (< 3s para listar)

### Sistema de Minutas
- [ ] Criar minuta manual funciona
- [ ] Editor TipTap carrega sem erros
- [ ] Auto-save funciona (30s)
- [ ] Formatação de texto preservada
- [ ] Exportação para PDF funciona
- [ ] Minuta vinculada a processo corretamente
- [ ] Sem perda de dados ao editar

### Cálculo de Prazos
- [ ] Cálculo de dias úteis correto
- [ ] Feriados considerados
- [ ] Recesso forense considerado
- [ ] Validação de datas inválidas funciona
- [ ] Anos bissextos tratados corretamente
- [ ] Diferentes tipos de processo suportados

### Agentes de IA
- [ ] Todos os 15 agentes inicializam
- [ ] Agentes respondem em < 30s
- [ ] Retry automático funciona
- [ ] Graceful degradation sem API Gemini
- [ ] Logs de execução estruturados
- [ ] Métricas de performance coletadas

---

## 🟡 Critérios de Alta Prioridade

### Busca Global
- [ ] Atalho "/" abre busca
- [ ] Busca em múltiplas entidades funciona
- [ ] Navegação por teclado funciona
- [ ] Debounce aplicado (150ms)
- [ ] Resultados relevantes (< 1s)
- [ ] Categorias filtram corretamente

### Notificações
- [ ] Notificações aparecem
- [ ] Badge de contador atualiza
- [ ] Marcar como lida funciona
- [ ] Marcar todas como lidas funciona
- [ ] Excluir notificação funciona
- [ ] Som reproduz (se habilitado)

### Upload de Documentos
- [ ] Upload de PDF funciona
- [ ] Validação de tipo funciona
- [ ] Validação de tamanho funciona
- [ ] Barra de progresso exibida
- [ ] Preview gerado
- [ ] OCR executa (Tesseract.js)

### Calendário
- [ ] Visualizações (mensal, semanal, diária) funcionam
- [ ] Adicionar evento funciona
- [ ] Editar evento funciona
- [ ] Excluir evento funciona
- [ ] Arrastar e soltar funciona
- [ ] Sincronização com Google Calendar (se habilitado)

### Gestão Financeira
- [ ] Adicionar receita funciona
- [ ] Adicionar despesa funciona
- [ ] Categorização funciona
- [ ] Filtros por período funcionam
- [ ] Gráficos carregam corretamente
- [ ] Exportação de relatórios funciona
- [ ] Cálculo de saldo correto

---

## 🟢 Critérios de Média Prioridade

### Responsividade
- [ ] Desktop (1920x1080) ✅
- [ ] Laptop (1366x768) ✅
- [ ] Tablet (768x1024) ⚠️
- [ ] Mobile (375x667) ⚠️

### Compatibilidade de Navegadores
- [ ] Chrome 90+ ✅
- [ ] Firefox 88+ ✅
- [ ] Safari 14+ ⚠️
- [ ] Edge 90+ ✅

### Acessibilidade
- [ ] Navegação por teclado funciona
- [ ] Screen readers suportados (básico)
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Textos alternativos em imagens
- [ ] Foco visível em elementos interativos

### Internacionalização
- [ ] Português (pt-BR) ✅
- [ ] Datas no formato brasileiro (DD/MM/YYYY)
- [ ] Moeda no formato brasileiro (R$)
- [ ] Fuso horário correto (America/Sao_Paulo)

---

## 📊 Métricas de Qualidade

### Cobertura de Testes
```
Unitários:     > 80%  ✅
Integração:    > 70%  ⚠️
E2E:           > 60%  ⚠️
Total:         > 70%  ✅
```

### Performance (Lighthouse)
```
Performance:   > 90   ✅
Accessibility: > 85   ⚠️
Best Practices:> 90   ✅
SEO:           > 80   ⚠️
```

### Confiabilidade (SLA)
```
Uptime:        > 99.5%
MTTR:          < 1h
MTBF:          > 720h (30 dias)
Error Rate:    < 1%
```

### Segurança
```
Vulnerabilities (Critical): 0
Vulnerabilities (High):     0
Vulnerabilities (Medium):   < 5
Security Headers:           100%
```

---

## 🚀 Critérios de Deploy

### Pré-Deploy
- [ ] Todos os testes passam
- [ ] Build de produção sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets configurados
- [ ] Database migrations testadas
- [ ] Backup de dados realizado
- [ ] Plano de rollback preparado
- [ ] Equipe de suporte notificada

### Durante Deploy
- [ ] Janela de manutenção comunicada
- [ ] Deploy em staging validado
- [ ] Smoke tests em staging passam
- [ ] Monitoramento ativo
- [ ] Logs sendo coletados
- [ ] Equipe de plantão disponível

### Pós-Deploy
- [ ] Smoke tests em produção passam
- [ ] Métricas dentro do esperado
- [ ] Sem erros críticos nos logs
- [ ] Uptime > 99.9% nas primeiras 24h
- [ ] Feedback de usuários coletado
- [ ] Documentação atualizada
- [ ] Changelog publicado

---

## 🔍 Checklist de Validação Final

### Funcionalidades Core (100% obrigatório)
- [ ] ✅ Autenticação
- [ ] ✅ Gestão de Processos
- [ ] ✅ Sistema de Minutas
- [ ] ✅ Cálculo de Prazos
- [ ] ✅ Agentes de IA

### Funcionalidades Secundárias (95% obrigatório)
- [ ] ✅ Busca Global
- [ ] ✅ Notificações
- [ ] ✅ Upload de Documentos
- [ ] ✅ Calendário
- [ ] ✅ Gestão Financeira

### Qualidade (Mínimos aceitáveis)
- [ ] ✅ Performance (Lighthouse > 90)
- [ ] ✅ Segurança (0 vulnerabilidades críticas)
- [ ] ✅ Confiabilidade (Uptime > 99.5%)
- [ ] ✅ Testes (Cobertura > 70%)

### Infraestrutura
- [ ] ✅ Monitoramento configurado
- [ ] ✅ Logs centralizados
- [ ] ✅ Alertas configurados
- [ ] ✅ Backup automático
- [ ] ✅ CDN configurado (se aplicável)
- [ ] ✅ SSL/TLS configurado

### Documentação
- [ ] ✅ README completo
- [ ] ✅ DEPLOY_CONFIG.md
- [ ] ✅ PRODUCTION_TEST_REPORT.md
- [ ] ✅ SPECIFIC_TEST_SCENARIOS.md
- [ ] ✅ ACCEPTANCE_CRITERIA.md (este arquivo)
- [ ] ✅ Runbook de operações
- [ ] ✅ Guia de troubleshooting

---

## ⚠️ Exceções e Workarounds Conhecidos

### Bug #1: Memory Leak em GlobalSearch
**Severidade:** Média  
**Impacto:** Performance degradada após uso prolongado  
**Workaround:** Recarregar página após 100+ buscas  
**Status:** Identificado, correção planejada para v1.1

### Bug #2: Safari - Editor TipTap
**Severidade:** Baixa  
**Impacto:** Alguns atalhos de teclado não funcionam  
**Workaround:** Usar menu de formatação  
**Status:** Limitação do navegador

### Bug #3: Mobile - Calendário
**Severidade:** Média  
**Impacto:** Arrastar e soltar não funciona em touch  
**Workaround:** Usar botões de edição  
**Status:** Correção planejada para v1.2

---

## 📈 Critérios de Sucesso Pós-Produção

### Primeiras 24 horas
- [ ] Uptime > 99.9%
- [ ] Tempo de resposta médio < 500ms
- [ ] Taxa de erro < 0.5%
- [ ] Sem bugs críticos reportados
- [ ] Feedback positivo de usuários > 80%

### Primeira semana
- [ ] Uptime > 99.5%
- [ ] Tempo de resposta médio < 600ms
- [ ] Taxa de erro < 1%
- [ ] Bugs críticos < 2
- [ ] Bugs altos < 5
- [ ] Adoção de usuários > 70%

### Primeiro mês
- [ ] Uptime > 99.5%
- [ ] Performance estável
- [ ] Bugs críticos resolvidos
- [ ] Roadmap de melhorias definido
- [ ] Feedback incorporado
- [ ] Documentação atualizada

---

## 🎯 Assinatura de Aprovação

### Aprovações Necessárias

**Desenvolvimento:**
- [ ] Todos os testes passam
- [ ] Código revisado
- [ ] Documentação completa

**QA:**
- [ ] Testes manuais executados
- [ ] Testes automatizados passam
- [ ] Bugs críticos resolvidos

**DevOps:**
- [ ] Infraestrutura preparada
- [ ] Monitoramento configurado
- [ ] Plano de rollback testado

**Product Owner:**
- [ ] Funcionalidades validadas
- [ ] Critérios de aceitação atendidos
- [ ] Aprovação final para deploy

---

**Data de Criação:** Janeiro 2026  
**Última Atualização:** Janeiro 2026  
**Próxima Revisão:** Antes do deploy em produção  
**Status:** ⚠️ Em preparação
