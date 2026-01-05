# GitLab Feature Flags - Controle de Features

## 🎛️ O que são Feature Flags?

Feature Flags permitem ativar/desativar funcionalidades sem fazer deploy de código, proporcionando:

- **Deploy Seguro**: Teste features em produção sem impactar todos os usuários
- **Rollout Gradual**: Libere features para porcentagens específicas de usuários
- **Rollback Imediato**: Desative features problemáticas instantaneamente
- **Teste A/B**: Compare diferentes versões de features

## 🏗️ Implementação Técnica

### 1. **SDK do GitLab Feature Flags**
```javascript
import { FeatureFlags } from '@gitlab/feature-flags';

// Verificar se feature está ativa
const isNewDashboardEnabled = await FeatureFlags.isEnabled('new_dashboard_ui');

// Usar feature condicionalmente
if (isNewDashboardEnabled) {
  renderNewDashboard();
} else {
  renderOldDashboard();
}
```

### 2. **Configuração no .gitlab-ci.yml**
```yaml
feature_flag:
  stage: deploy
  script:
    - echo "Feature flag configured"
  environment:
    name: production
    deployment_tier: production
  feature_flag:
    name: new_dashboard_ui
    version: 1.0.0
    spec:
      version: 1.0.0
      rules:
        - name: gradual_rollout
          conditions:
            - property: percentage
              operator: less_than
              value: 50
```

## 🔧 Implementação Técnica Avançada

### **1. Client SDK Completo**
```typescript
// lib/feature-flags/client.ts
import { FeatureFlagClient } from '@gitlab/feature-flags';

export class LegalFeatureFlags {
  private client: FeatureFlagClient;

  constructor() {
    this.client = new FeatureFlagClient({
      url: process.env.GITLAB_URL!,
      token: process.env.GITLAB_API_TOKEN!,
      projectId: process.env.GITLAB_PROJECT_ID!,
    });
  }

  async isEnabled(flagName: string, userId?: string, attributes?: any): Promise<boolean> {
    try {
      return await this.client.isEnabled(flagName, {
        userId,
        environment: process.env.NODE_ENV || 'production',
        ...attributes,
      });
    } catch (error) {
      console.error(`Feature flag check failed for ${flagName}:`, error);
      return false; // Fallback seguro
    }
  }

  async getVariant(flagName: string, userId?: string): Promise<string> {
    try {
      return await this.client.getVariant(flagName, {
        userId,
        environment: process.env.NODE_ENV || 'production',
      });
    } catch (error) {
      return 'A'; // Variant padrão
    }
  }
}

// Singleton
export const featureFlags = new LegalFeatureFlags();
```

### **2. React Hook Personalizado**
```tsx
// hooks/useFeatureFlag.ts
import { useState, useEffect } from 'react';
import { featureFlags } from '../lib/feature-flags/client';

export const useFeatureFlag = (flagName: string, userId?: string) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlag = async () => {
      try {
        const result = await featureFlags.isEnabled(flagName, userId);
        setEnabled(result);
      } catch (error) {
        console.error(`Failed to check feature flag ${flagName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    checkFlag();
  }, [flagName, userId]);

  return { enabled, loading };
};

// Hook para A/B testing
export const useABTest = (experimentName: string, userId?: string) => {
  const [variant, setVariant] = useState<string>('A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getVariant = async () => {
      try {
        const result = await featureFlags.getVariant(experimentName, userId);
        setVariant(result);
      } catch (error) {
        console.error(`Failed to get variant for ${experimentName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    getVariant();
  }, [experimentName, userId]);

  return { variant, loading };
};
```

### **3. Componente Condicional**
```tsx
// components/FeatureFlag.tsx
interface FeatureFlagProps {
  flag: string;
  userId?: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  flag,
  userId,
  fallback = null,
  loadingComponent = <div>Loading...</div>,
  children,
}) => {
  const { enabled, loading } = useFeatureFlag(flag, userId);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  return enabled ? <>{children}</> : <>{fallback}</>;
};

// Componente para A/B testing
interface ABTestProps {
  experiment: string;
  userId?: string;
  variantA: React.ReactNode;
  variantB: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export const ABTest: React.FC<ABTestProps> = ({
  experiment,
  userId,
  variantA,
  variantB,
  loadingComponent = <div>Loading...</div>,
}) => {
  const { variant, loading } = useABTest(experiment, userId);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  return variant === 'A' ? <>{variantA}</> : <>{variantB}</>;
};
```

### **4. Estratégias Avançadas de Rollout**

#### **Rollout por Tipo de Usuário**
```yaml
# Para sistema jurídico
rules:
  - name: user_segmentation
    conditions:
      - property: user_type
        operator: in
        value: ['advogado', 'estagiario']  # Só advogados e estagiários
      - property: office_size
        operator: greater_than
        value: 10  # Escritórios com > 10 pessoas
```

#### **Rollout Geográfico**
```yaml
rules:
  - name: geographic_rollout
    conditions:
      - property: region
        operator: in
        value: ['SP', 'RJ', 'MG']  # Só Sudeste primeiro
```

#### **Rollout por Funcionalidade Crítica**
```yaml
rules:
  - name: critical_feature_rollout
    conditions:
      - property: has_backup
        operator: equal
        value: true  # Só usuários com backup ativo
      - property: data_size
        operator: less_than
        value: 1000000  # Menos de 1GB de dados
```

### **5. Monitoramento e Analytics**
```typescript
// lib/feature-flags/analytics.ts
export const trackFeatureUsage = async (
  flagName: string,
  userId: string,
  action: string,
  metadata?: any
) => {
  try {
    await fetch('/api/analytics/feature-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flag_name: flagName,
        user_id: userId,
        action,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to track feature usage:', error);
  }
};

// Hook para rastreamento automático
export const useFeatureTracking = (flagName: string, userId?: string) => {
  const { enabled } = useFeatureFlag(flagName, userId);

  useEffect(() => {
    if (enabled) {
      trackFeatureUsage(flagName, userId || 'anonymous', 'viewed');
    }
  }, [enabled, flagName, userId]);

  return enabled;
};
```

### **6. Rollback de Emergência**
```typescript
// lib/feature-flags/emergency.ts
export const emergencyRollback = async (flagName: string, reason: string) => {
  try {
    // Desabilitar flag
    await fetch(`/api/feature-flags/${flagName}/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason,
        emergency: true,
        timestamp: new Date().toISOString(),
      }),
    });

    // Notificar equipe
    await fetch('/api/notifications/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `🚨 EMERGENCY: Feature ${flagName} rolled back`,
        reason,
        severity: 'critical',
      }),
    });

    // Log de auditoria
    console.error(`EMERGENCY ROLLBACK: ${flagName} - ${reason}`);

  } catch (error) {
    console.error('Emergency rollback failed:', error);
    throw error;
  }
};
```

## 🎯 Estratégias Específicas para Sistema Jurídico

### **1. Compliance e Segurança**
```yaml
# Feature flags para compliance
compliance_flags:
  - name: lgpd_strict_mode
    description: Modo LGPD rigoroso com auditoria completa
    rules:
      - name: office_size_filter
        conditions:
          - property: office_size
            operator: greater_than
            value: 50  # Só para grandes escritórios

  - name: advanced_encryption
    description: Criptografia avançada para dados sensíveis
    rules:
      - name: premium_users_only
        conditions:
          - property: plan
            operator: equal
            value: premium
```

### **2. Integração PJe**
```yaml
# Controle de integração por tribunal
pje_integration_flags:
  - name: pje_v2_api
    description: Nova API do PJe v2.0
    rules:
      - name: tribunal_filter
        conditions:
          - property: tribunal
            operator: in
            value: ['TJSP', 'TJMG']  # Só tribunais específicos primeiro

  - name: automatic_updates
    description: Atualização automática de processos
    rules:
      - name: user_consent_required
        conditions:
          - property: consent_given
            operator: equal
            value: true
```

### **3. IA e Automação**
```yaml
# Features de IA com controle granular
ai_features:
  - name: advanced_ai_analysis
    description: Análise avançada com IA
    rules:
      - name: gradual_ai_rollout
        conditions:
          - property: percentage
            operator: less_than
            value: 10  # Só 10% dos usuários inicialmente

  - name: predictive_analytics
    description: Analytics preditivo para casos
    rules:
      - name: beta_users_only
        conditions:
          - property: beta_participant
            operator: equal
            value: true
```

## 📊 Dashboard Avançado

### **Métricas de Feature Flags**
- **Adoption Rate**: % de usuários usando a feature
- **Error Rate**: Taxa de erro por feature
- **Performance Impact**: Impacto na performance
- **Conversion Rate**: Taxa de conversão por variant (A/B)

### **Alertas Automáticos**
```yaml
# Alerta se feature causar muitos erros
feature_error_alert:
  condition: rate(feature_errors[5m]) > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Feature flag causing high error rate"
    description: "Feature {{ $labels.feature }} has error rate > 5%"

# Alerta se rollout muito lento
slow_rollout_alert:
  condition: feature_adoption_rate < 0.01
  for: 1h
  labels:
    severity: info
  annotations:
    summary: "Feature rollout progressing slowly"
    description: "Feature {{ $labels.feature }} adoption < 1% in last hour"
```

## 🔄 Ciclo de Vida das Features

### **1. Desenvolvimento**
- Criar flag com 0% rollout
- Desenvolver feature atrás da flag
- Testes com flag ON localmente

### **2. Teste**
- Ativar para equipe interna (100%)
- Testes de integração
- Validação de performance

### **3. Beta**
- Rollout para usuários beta (10-25%)
- Monitoramento de métricas
- Coleta de feedback

### **4. Produção**
- Rollout gradual (25% → 50% → 100%)
- Monitoramento contínuo
- Rollback preparado

### **5. Cleanup**
- Após estabilização, remover código condicional
- Deletar flag do GitLab
- Documentar lições aprendidas

## 🚀 Benefícios Avançados

- **Deploy Frequency**: Deploy diário com controle total
- **Risk Mitigation**: Rollback em segundos, não horas
- **Data-Driven**: Decisões baseadas em métricas reais
- **User Segmentation**: Features diferentes por tipo de usuário
- **Compliance**: Controle granular para requisitos legais</content>
<parameter name="oldString">### 3. **Estratégias de Rollout**

## 🎯 Casos de Uso para Sistema Jurídico

### 1. **Nova Interface de Processo**
- **Flag**: `new_process_interface`
- **Estratégia**: Rollout gradual para 20% dos advogados
- **Benefício**: Teste usabilidade sem impactar produtividade

### 2. **Integração com PJe**
- **Flag**: `pje_integration`
- **Estratégia**: Ativação por escritório
- **Benefício**: Controle de integração por cliente

### 3. **IA Avançada de Sugestões**
- **Flag**: `advanced_ai_suggestions`
- **Estratégia**: Usuários beta primeiro
- **Benefício**: Teste de qualidade das sugestões

### 4. **Relatórios Avançados**
- **Flag**: `advanced_reporting`
- **Estratégia**: Rollout gradual
- **Benefício**: Validação de dados e performance

## 📊 Dashboard de Feature Flags

Acesse: **Operate > Feature Flags**

### Métricas Disponíveis:
- **Status**: Ativo/Inativo
- **Rollout %**: Porcentagem de usuários
- **Usuários Alvo**: Número de usuários afetados
- **Última Modificação**: Quando foi alterado

## 🔧 Gerenciamento

### **Como Criar uma Feature Flag:**
1. Vá para **Operate > Feature Flags**
2. Clique em **New Feature Flag**
3. Configure nome, descrição e regras
4. Associe ao ambiente de produção

### **Como Modificar Rollout:**
1. Edite a feature flag
2. Ajuste as regras de porcentagem
3. Monitore impacto em tempo real

### **Como Remover Feature Flag:**
1. Desative gradualmente (0%)
2. Remova do código
3. Delete a flag do GitLab

## 🚨 Boas Práticas

### **Nomenclatura**
```javascript
// ✅ Bom
const FEATURE_NEW_DASHBOARD = 'new_dashboard_ui';

// ❌ Ruim
const flag1 = 'flag1';
```

### **Cleanup**
- Remova flags antigas (> 6 meses)
- Documente o propósito de cada flag
- Monitore performance impact

### **Testes**
- Teste com flag ON e OFF
- Valide em diferentes browsers
- Monitore erros e performance

## 📈 Benefícios para Escritório Jurídico

- **Redução de Riscos**: Teste features sem impactar produção
- **Agilidade**: Deploy frequente com controle total
- **Conformidade**: Rollback imediato se necessário
- **Experimentação**: Teste novas funcionalidades com usuários reais</content>
<parameter name="filePath">/workspaces/assistente-juridico-p/docs/GITLAB_FEATURE_FLAGS.md