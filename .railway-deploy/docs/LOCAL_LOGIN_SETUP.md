# Configuração de Login Google em Localhost

Para que o login com Google funcione em seu ambiente local (`http://localhost:5173`), você precisa autorizar esta origem no Google Cloud Console.

## Passo a Passo

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Selecione o projeto do **Assistente Jurídico**.
3. No menu lateral, vá em **APIs e Serviços** > **Credenciais**.
4. Clique no nome do seu **ID do cliente OAuth 2.0** (Web client).
5. Em **Origens JavaScript autorizadas**, clique em "Adicionar URI" e insira:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
6. Em **URIs de redirecionamento autorizados**, adicione:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
7. Clique em **Salvar**.

> **Nota:** Pode levar alguns minutos (ou até horas) para que as alterações no Google Cloud Console tenham efeito.

## Testando

Após salvar, recarregue sua aplicação local. O botão de login do Google deve aparecer e funcionar corretamente.
Se você ver um erro `origin_mismatch`, verifique se a URL no navegador corresponde exatamente à que você cadastrou (http vs https, porta, etc).
