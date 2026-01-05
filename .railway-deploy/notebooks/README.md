# Notebooks de Desenvolvimento

Este diretório contém notebooks Jupyter para auxiliar no desenvolvimento, depuração e análise do Assistente Jurídico.

## `dev_playground.ipynb`

Este é o notebook principal para testes interativos. Ele permite:

1.  **Healthcheck da API**: Verificar se o backend está rodando.
2.  **Análise de Agentes**: Visualizar o status e atividade dos agentes de IA.
3.  **Teste de LLM (Gemini)**: Enviar prompts diretamente para o modelo Gemini configurado.
4.  **Inspeção de Banco de Dados**:
    - **Qdrant**: Listar coleções e verificar vetores.
    - **Redis (Upstash)**: Verificar chaves e tamanho do cache.

### Pré-requisitos

1.  Certifique-se de ter o arquivo `.env.local` na raiz do projeto com as chaves de API configuradas (`VITE_GEMINI_API_KEY`, `QDRANT_URL`, `UPSTASH_REDIS_REST_URL`, etc.).
2.  Execute a primeira célula do notebook para instalar as dependências Python necessárias (`requests`, `pandas`, `google-generativeai`, etc.).
3.  Para testar a API local, certifique-se de que o servidor de desenvolvimento esteja rodando (`npm run dev:with-api`).

### Como usar

Abra o arquivo `dev_playground.ipynb` no VS Code e execute as células sequencialmente.
