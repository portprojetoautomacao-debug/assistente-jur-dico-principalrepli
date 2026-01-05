# Script para configurar variáveis no Railway
# Execute este script APÓS fazer login e linkar o projeto

# Verificar se está logado e linkado
railway status || (echo '❌ Não está logado ou projeto não linkado. Execute: railway login && railway link -p 65944b39-fdb1-491c-9395-d684e3e05204' && exit 1)

# Configurar variáveis de produção (adaptadas do .env.local)
railway variables set VITE_GEMINI_API_KEY="AIzaSyDEqIR7SSC1LLXyl1yyoKFKHK7XOp51QuY"
railway variables set GEMINI_API_KEY="AIzaSyDEqIR7SSC1LLXyl1yyoKFKHK7XOp51QuY"
railway variables set VITE_GOOGLE_API_KEY="AIzaSyDEqIR7SSC1LLXyl1yyoKFKHK7XOp51QuY"
railway variables set GOOGLE_API_KEY="AIzaSyDEqIR7SSC1LLXyl1yyoKFKHK7XOp51QuY"
railway variables set VITE_GOOGLE_CLIENT_ID="572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com"
railway variables set GOOGLE_CLIENT_ID="572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com"
railway variables set GOOGLE_CLIENT_SECRET="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"
railway variables set VITE_QDRANT_URL="https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333"
railway variables set VITE_QDRANT_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.TOW2yGElQ1N1ORGmwLG53retaSDXEJi9j3LvPy6RqJ0"
railway variables set DATABASE_URL="postgresql://neondb_owner:npg_6qYj5hXWJzLB@ep-lively-firefly-a85y0w0i-pooler.eastus2.azure.neon.tech/neondb?sslmode=require"
railway variables set SESSION_SECRET="NSw63gARXw0QAJYoVt+5km003eI+IVxRiriUnxaxEU9OiR4aT/+Ud1HgVOEvl0jaOVZ1V0iUOy6sBoZMcI6jgw=="
railway variables set DJEN_SCHEDULER_ENABLED="true"

# Variáveis específicas para produção
railway variables set NODE_ENV="production"
railway variables set VITE_APP_ENV="production"
railway variables set VITE_AUTH_MODE="simple"
railway variables set VITE_ENABLE_PII_FILTERING="true"
railway variables set PORT="3001"

echo "✅ Todas as variáveis configuradas no Railway!"
echo "🚀 Agora você pode fazer deploy: railway deploy"
