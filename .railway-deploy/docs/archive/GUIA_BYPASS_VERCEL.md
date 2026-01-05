# Configuração de Bypass de Proteção Vercel

Você gerou o segredo de bypass, mas **apenas gerar não é suficiente**. Você precisa configurar quem vai acessar o site para usar esse segredo.

## 1. O que aconteceu ao gerar o segredo?
A Vercel criou automaticamente uma variável de ambiente chamada `VERCEL_AUTOMATION_BYPASS_SECRET` no seu projeto.

## 2. O que você precisa fazer agora?

### Passo 1: Re-implantar (Obrigatório)
Como a documentação diz: *"Você precisará reimplantar seu aplicativo se atualizar o segredo"*.
Isso é necessário para que a nova variável de ambiente entre em vigor.

### Passo 2: Configurar quem acessa (Obrigatório)
O "cadeado" foi trocado, agora você precisa dar a "chave" para quem vai entrar.

#### A. Se você usa GitHub Actions para testes E2E
Se você tem workflows no GitHub que rodam testes contra a URL de preview/produção, você precisa:
1. Ir no seu repositório GitHub -> Settings -> Secrets and variables -> Actions.
2. Criar um novo Repository Secret chamado `VERCEL_AUTOMATION_BYPASS_SECRET`.
3. Colocar o valor do segredo que você gerou na Vercel.

#### B. Se você usa Playwright (Testes Automatizados)
Se você for configurar o Playwright (que está nas suas dependências), crie ou edite o arquivo `playwright.config.ts` na raiz do projeto:

```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
      extraHTTPHeaders: {
            // Usa o segredo se ele estiver definido nas variáveis de ambiente
                  'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '',
                      }
                        }
                        };

                        export default config;
                        ```

                        #### C. Se você quer acessar manualmente ou via Script
                        Se você estiver tentando acessar uma URL protegida via navegador ou script simples, adicione o header ou query param:

                        **Via URL (Navegador):**
                        `https://seu-projeto.vercel.app/?x-vercel-protection-bypass=SEU_SEGREDO_AQUI`

                        **Via Curl/Script:**
                        ```bash
                        curl -H "x-vercel-protection-bypass: SEU_SEGREDO_AQUI" https://seu-projeto.vercel.app
                        ```

                        ## Resumo
                        1. **Redeploy** na Vercel.
                        2. **Configure** o cliente (GitHub Actions, Playwright, ou URL manual) para enviar o segredo.
                        