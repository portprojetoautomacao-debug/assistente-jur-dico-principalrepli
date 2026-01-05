# Configuração do Upstash Redis

O Vercel KV foi descontinuado, mas este projeto já está configurado para usar o **Upstash Redis** diretamente, que é a tecnologia subjacente que o Vercel KV utilizava.

## Passo a Passo para Configuração

### 1. Criar um Banco de Dados no Upstash

1. Acesse [console.upstash.com](https://console.upstash.com/).
2. Faça login com sua conta GitHub ou e-mail.
3. Clique em **"Create Database"**.
4. Dê um nome para o banco (ex: `assistente-juridico-db`).
5. Selecione a região mais próxima de seus usuários (ex: `us-east-1` ou `sa-east-1` se disponível).
6. Clique em **"Create"**.

### 2. Obter as Credenciais

1. No painel do seu novo banco de dados, role até a seção **"REST API"**.
2. Você verá dois botões: `.env` e um botão de cópia.
3. Copie as seguintes variáveis:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configurar no Vercel

1. Vá para o painel do seu projeto na [Vercel](https://vercel.com).
2. Navegue até **Settings** > **Environment Variables**.
3. Adicione as duas variáveis que você copiou:
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** (Cole a URL do Upstash)
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** (Cole o Token do Upstash)
4. Salve as alterações.
5. **Importante:** Você precisará fazer um "Redeploy" da sua aplicação para que as novas variáveis entrem em vigor. Vá em **Deployments**, clique nos três pontos do último deploy e selecione **"Redeploy"**.

### 4. Configuração Local (Opcional)

Se você quiser testar a conexão com o banco de dados localmente:

1. Crie ou edite o arquivo `.env` na raiz do projeto.
2. Adicione as mesmas variáveis:

```env
UPSTASH_REDIS_REST_URL=sua_url_aqui
UPSTASH_REDIS_REST_TOKEN=seu_token_aqui
```

## Verificação

O sistema detectará automaticamente a presença dessas variáveis e usará o cliente `@upstash/redis` para todas as operações de banco de dados, ignorando a configuração antiga do Vercel KV.

### Arquivos Relacionados

- `api/kv.ts`: Lógica de conexão que prioriza o Upstash.
- `src/hooks/use-kv.ts`: Hook do frontend que se comunica com a API.
