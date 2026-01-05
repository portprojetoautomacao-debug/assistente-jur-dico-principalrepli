# 🎓 GUIA PARA LEIGOS: GitHub Packages

## O que você acabou de ganhar?

Criamos um **pacote npm privado** chamado `@thiagobodevan-a11y/legal-utils` com funções jurídicas reutilizáveis!

---

## 🤔 Mas afinal, o que é isso?

### Analogia da Caixa de Ferramentas

Imagine que você é um marceneiro:

**ANTES (sem pacotes):**
- Você tem um martelo na sua casa
- Outro martelo no galpão
- Outro martelo no carro
- Se quiser um martelo melhor, tem que trocar 3 martelos! 😓

**DEPOIS (com pacotes):**
- Você tem UMA caixa de ferramentas profissional
- Leva a caixa para qualquer lugar
- Precisa de um martelo? Pega da caixa!
- Quer atualizar? Troca só na caixa! 🎯

---

## 📦 O que tem no seu pacote?

Arquivo: `packages/legal-utils/index.ts`

### 1. `calcularPrazo(dataInicial, diasUteis)`
**O que faz:** Calcula prazo processual em dias úteis

**Exemplo:**
```typescript
import { calcularPrazo } from '@thiagobodevan-a11y/legal-utils';

// Cliente foi intimado hoje, tem 15 dias para contestar
const prazo = calcularPrazo(new Date(), 15);
console.log(prazo); // Data 15 dias úteis no futuro
```

### 2. `formatarNumeroProcesso(numero)`
**O que faz:** Formata número de processo no padrão CNJ

**Exemplo:**
```typescript
import { formatarNumeroProcesso } from '@thiagobodevan-a11y/legal-utils';

const numero = formatarNumeroProcesso('00001234520238170001');
console.log(numero); // 0000123-45.2023.8.17.0001
```

### 3. `calcularHonorarios(valorCausa)`
**O que faz:** Calcula honorários advocatícios (10% a 20%)

**Exemplo:**
```typescript
import { calcularHonorarios } from '@thiagobodevan-a11y/legal-utils';

const honorarios = calcularHonorarios(50000);
console.log(honorarios); // { minimo: 5000, maximo: 10000 }
```

### 4. `estaDentroDoPrazo(dataLimite)`
**O que faz:** Verifica se ainda está no prazo

**Exemplo:**
```typescript
import { estaDentroDoPrazo } from '@thiagobodevan-a11y/legal-utils';

const noPrazo = estaDentroDoPrazo(new Date('2024-12-31'));
console.log(noPrazo); // true ou false
```

### 5. `calcularPrazoComFeriados(data, dias, feriados)`
**O que faz:** Calcula prazo excluindo feriados

**Exemplo:**
```typescript
import { calcularPrazoComFeriados, feriadosNacionais2024 } from '@thiagobodevan-a11y/legal-utils';

const prazo = calcularPrazoComFeriados(new Date(), 15, feriadosNacionais2024);
console.log(prazo); // Data 15 dias úteis (sem contar feriados)
```

---

## 🚀 Como usar (Passo a Passo)

### OPÇÃO A: Publicar no GitHub (Recomendado)

#### Passo 1: Criar Token de Acesso
1. Vá em: https://github.com/settings/tokens/new
2. Nome do token: `npm-packages`
3. **IMPORTANTE:** Marque a permissão `write:packages`
4. Clique em "Generate token"
5. **COPIE O TOKEN** (você só verá uma vez!)

#### Passo 2: Configurar Autenticação
```bash
# Substitua SEU_TOKEN_AQUI pelo token que você copiou
echo "//npm.pkg.github.com/:_authToken=SEU_TOKEN_AQUI" >> ~/.npmrc
```

#### Passo 3: Publicar o Pacote
```bash
# Usar o script automatizado (FÁCIL!)
./publish-legal-utils.sh

# OU manualmente:
cd packages/legal-utils
npm publish
```

#### Passo 4: Ver Seu Pacote Publicado
👉 https://github.com/thiagobodevan-a11y?tab=packages

#### Passo 5: Usar em Qualquer Projeto
```bash
# Instalar
npm install @thiagobodevan-a11y/legal-utils

# Usar no código
import { calcularPrazo } from '@thiagobodevan-a11y/legal-utils';
const prazo = calcularPrazo(new Date(), 15);
```

---

### OPÇÃO B: Usar Localmente (Para Testar)

Se você só quer testar sem publicar:

```bash
# Na pasta do pacote
cd packages/legal-utils
npm link

# Na pasta do projeto principal
cd ../..
npm link @thiagobodevan-a11y/legal-utils

# Agora pode usar normalmente
import { calcularPrazo } from '@thiagobodevan-a11y/legal-utils';
```

---

## 💡 Por que isso é útil?

### Cenário Real

Você tem 3 componentes que precisam calcular prazos:
- `Dashboard.tsx`
- `ProcessCRM.tsx`
- `DeadlineCalculator.tsx`

#### ❌ SEM PACOTE (Ruim):
```typescript
// Dashboard.tsx
function calcularPrazo(data: Date, dias: number) {
  // 50 linhas de código
}

// ProcessCRM.tsx
function calcularPrazo(data: Date, dias: number) {
  // MESMAS 50 linhas COPIADAS
}

// DeadlineCalculator.tsx
function calcularPrazo(data: Date, dias: number) {
  // MESMAS 50 linhas COPIADAS DE NOVO
}
```

**Problemas:**
- 150 linhas duplicadas
- Se encontrar bug, tem que corrigir em 3 lugares
- Se melhorar a função, tem que atualizar em 3 lugares
- Risco de esquecer de atualizar algum lugar

#### ✅ COM PACOTE (Bom):
```typescript
// Dashboard.tsx
import { calcularPrazo } from '@thiagobodevan-a11y/legal-utils';

// ProcessCRM.tsx
import { calcularPrazo } from '@thiagobodevan-a11y/legal-utils';

// DeadlineCalculator.tsx
import { calcularPrazo } from '@thiagobodevan-a11y/legal-utils';
```

**Vantagens:**
- 50 linhas em 1 lugar + 3 imports simples
- Bug? Corrige em 1 lugar, funciona em todos
- Melhoria? Atualiza em 1 lugar, funciona em todos
- Pode usar em outros projetos!

---

## 📊 Comparação Visual

```
┌───────────────────────┬──────────────┬─────────────────┐
│                       │ SEM PACOTE   │ COM PACOTE      │
├───────────────────────┼──────────────┼─────────────────┤
│ Linhas de código      │ 150          │ 53              │
│ Locais de manutenção  │ 3            │ 1               │
│ Risco de bugs         │ Alto (3x)    │ Baixo (1x)      │
│ Reuso em outros proj. │ ❌ Não       │ ✅ Sim          │
│ Testes isolados       │ ❌ Difícil   │ ✅ Fácil        │
│ Profissionalismo      │ ⭐⭐         │ ⭐⭐⭐⭐⭐      │
└───────────────────────┴──────────────┴─────────────────┘
```

---

## 🎯 Exemplo Completo no React

```typescript
// src/components/MeuComponente.tsx
import { useState, useEffect } from 'react';
import {
  calcularPrazo,
  formatarNumeroProcesso,
  calcularHonorarios,
  estaDentroDoPrazo
} from '@thiagobodevan-a11y/legal-utils';

export function ProcessoCard() {
  const [processo, setProcesso] = useState({
    numero: '00001234520238170001',
    dataIntimacao: new Date('2024-11-20'),
    valorCausa: 100000
  });

  // Calcular tudo automaticamente
  const prazoContestacao = calcularPrazo(processo.dataIntimacao, 15);
  const numeroFormatado = formatarNumeroProcesso(processo.numero);
  const honorarios = calcularHonorarios(processo.valorCausa);
  const noPrazo = estaDentroDoPrazo(prazoContestacao);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Processo {numeroFormatado}</h2>
      
      <div className="space-y-2">
        <p>
          <strong>Prazo para contestar:</strong>{' '}
          <span className={noPrazo ? 'text-green-600' : 'text-red-600'}>
            {prazoContestacao.toLocaleDateString('pt-BR')}
            {noPrazo ? ' ✅ No prazo' : ' ❌ Vencido'}
          </span>
        </p>
        
        <p>
          <strong>Honorários estimados:</strong>
        </p>
        <ul className="ml-4">
          <li>Mínimo (10%): R$ {honorarios.minimo.toLocaleString('pt-BR')}</li>
          <li>Máximo (20%): R$ {honorarios.maximo.toLocaleString('pt-BR')}</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## ❓ Dúvidas Comuns

### 1. "Preciso publicar para usar?"
**R:** Não necessariamente! Você pode usar `npm link` para testar localmente. Mas para usar em produção ou outros projetos, é melhor publicar.

### 2. "Outras pessoas podem ver meu pacote?"
**R:** **NÃO!** É um pacote **privado**. Só você (e quem você autorizar) pode ver e usar.

### 3. "Vou pagar por isso?"
**R:** **NÃO!** Você tem $10 de orçamento grátis para GitHub Packages. Você não vai usar nem 10% disso.

### 4. "Posso usar em outros projetos meus?"
**R:** **SIM!** Essa é a grande vantagem! Faça `npm install` em qualquer projeto e use.

### 5. "E se eu quiser atualizar a função?"
**R:** Simples:
1. Edita `packages/legal-utils/index.ts`
2. Aumenta a versão em `package.json` (ex: 1.0.0 → 1.0.1)
3. Publica de novo: `npm publish`
4. Atualiza nos projetos: `npm update @thiagobodevan-a11y/legal-utils`

### 6. "Posso adicionar mais funções?"
**R:** **SIM!** É só editar `packages/legal-utils/index.ts` e adicionar. Exemplos:
- Validação de CPF/CNPJ
- Cálculo de custas processuais
- Geração de petições automáticas
- Consulta de CEP
- Qualquer coisa reutilizável!

---

## 📁 Arquivos Criados

```
packages/legal-utils/
├── index.ts          # Código das funções (50+ linhas)
├── package.json      # Configuração do pacote
├── README.md         # Documentação completa
└── EXEMPLOS.tsx      # Exemplos de uso em React
```

---

## 🎓 Resumo em 3 Passos

1. **Criamos** um pacote com funções jurídicas úteis
2. **Publicamos** no GitHub Packages (seu "depósito privado")
3. **Usamos** em qualquer projeto com `npm install`

---

## 🚀 Próximos Passos

### Agora (Iniciante):
1. ✅ Leia este guia (você já está lendo!)
2. ✅ Veja os exemplos em `packages/legal-utils/EXEMPLOS.tsx`
3. ✅ Publique o pacote seguindo o "Passo a Passo" acima

### Depois (Intermediário):
1. Adicione mais funções úteis ao pacote
2. Use o pacote no seu projeto principal
3. Crie testes para as funções

### Futuro (Avançado):
1. Crie outros pacotes (ex: `@thiagobodevan-a11y/ui-components`)
2. Configure CI/CD para publicação automática
3. Compartilhe com outros desenvolvedores da equipe

---

## 📞 Precisa de Ajuda?

- **Documentação oficial:** https://docs.github.com/packages
- **Exemplos no projeto:** `packages/legal-utils/EXEMPLOS.tsx`
- **Script automatizado:** `./publish-legal-utils.sh`

---

**Criado por:** GitHub Copilot para @thiagobodevan-a11y  
**Projeto:** Assistente Jurídico PJe  
**Data:** 21/11/2025
