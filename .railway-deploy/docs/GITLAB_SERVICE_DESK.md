# GitLab Service Desk Configuration

## 📧 Configuração de Email para Suporte

### 1. **Habilitar Service Desk**
1. Vá para: **Settings > General > Service Desk**
2. Ative: "Activate Service Desk"
3. Configure o domínio de email

### 2. **Template de Email Padrão**
Quando usuários enviarem emails para:
```
suporte@assistente-juridico-p.gitlab.com
```

Será automaticamente criado um issue com:
- **Título**: Assunto do email
- **Descrição**: Corpo do email
- **Labels**: `Service Desk`
- **Assignee**: Time de suporte

### 3. **Respostas Automáticas**
Configure templates de resposta para:
- Confirmação de recebimento
- Status de andamento
- Resolução do problema

### 4. **Integração com Sistema Jurídico**
- Issues criados via email podem ser vinculados a processos
- Rastreamento de SLA para questões jurídicas
- Notificações automáticas para advogados responsáveis

### 5. **Benefícios para Escritório Jurídico**
- ✅ **Centralização**: Todos os contatos em um lugar
- ✅ **Rastreabilidade**: Histórico completo de comunicações
- ✅ **Automação**: Respostas padrão e roteamento inteligente
- ✅ **Conformidade**: Registro de todas as interações
- ✅ **Integração**: Vinculação com casos e processos

## 🔧 Como Configurar

1. **Acesse Service Desk Settings**
2. **Configure Incoming Email**
3. **Defina Templates de Resposta**
4. **Configure Regras de Roteamento**

## 📊 Métricas Disponíveis

- Tempo médio de resposta
- Taxa de resolução no primeiro contato
- Volume de tickets por categoria
- Satisfação do usuário</content>
<parameter name="filePath">/workspaces/assistente-juridico-p/docs/GITLAB_SERVICE_DESK.md