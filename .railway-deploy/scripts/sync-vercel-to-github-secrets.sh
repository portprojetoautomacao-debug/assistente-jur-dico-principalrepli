#!/bin/bash
# Script para adicionar variáveis do Vercel aos GitHub Secrets
# Data: 10/12/2024
# Requer: GitHub CLI (gh) instalado e autenticado

set -e

echo "🔐 Adicionando variáveis do Vercel aos GitHub Secrets..."
echo ""

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não encontrado."
    echo "   Instale com: https://cli.github.com/"
    exit 1
fi

# Verificar autenticação
if ! gh auth status &> /dev/null; then
    echo "❌ Não autenticado no GitHub."
    echo "   Execute: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI autenticado"
echo ""

# Repositório
REPO="thiagobodevanadv-alt/assistente-jur-dico-principal"

echo "📦 Adicionando secrets ao repositório: $REPO"
echo ""

# Função para adicionar secret
add_secret() {
    local name=$1
    local value=$2

    echo "  Adicionando: $name"
    echo "$value" | gh secret set "$name" --repo "$REPO" 2>&1 || echo "    ⚠️  Falha ao adicionar $name"
}

# ============================================
# AUTENTICAÇÃO E SEGURANÇA
# ============================================
echo "🔐 1/10 - Autenticação e Segurança..."
add_secret "JWT_SECRET" "9b6f3dbda3cd4f2fb6a9a0e5a8f3c6df4a2e7b1c0d9f8e7c6b5a4d3c2b1a0f9e"
add_secret "CRON_SECRET" "meu-secret-super-seguro-123"
add_secret "WEBHOOK_SECRET" "A1a1g6k7@"
add_secret "VERCEL_WEBHOOK_SECRET" "AlZNraosDBgOecVi1eyxcTCN"
add_secret "VERCEL_AUTOMATION_BYPASS_SECRET" "qajocbzc7FeZcqllHRkERDIRhAYaQD08"
add_secret "VERCEL_TOKEN" "xO6xkg0R5QJLEMlLooaYGVPV"
echo ""

# ============================================
# GOOGLE OAUTH & AI
# ============================================
echo "🔐 2/10 - Google OAuth & AI..."
add_secret "VITE_GOOGLE_CLIENT_ID" "572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com"
add_secret "VITE_GOOGLE_API_KEY" "AIzaSyB0dbI9WQqYmGuVLn4nYrOtuMKGLuydBZ0"
add_secret "VITE_GEMINI_API_KEY" "AIzaSyB0dbI9WQqYmGuVLn4nYrOtuMKGLuydBZ0"
echo ""

# ============================================
# GITHUB OAUTH
# ============================================
echo "🔐 3/10 - GitHub OAuth..."
add_secret "VITE_GITHUB_OAUTH_CLIENT_ID" "Ov23liuyNAHxSOoQODSl"
add_secret "GITHUB_OAUTH_CLIENT_SECRET" "af37d42cbab4fd1ee3c0657c8001dcc821a8f109"
add_secret "GITHUB_PAT" "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"
add_secret "GITHUB_RUNTIME_PERMANENT_NAME" "97a1cb1e48835e0ecf1e"
echo ""

# GITHUB_PRIVATE_KEY (multiline)
echo "  Adicionando: GITHUB_PRIVATE_KEY (multiline)"
cat > /tmp/github_private_key.txt << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAu1LglEoqEaJ5bVJFNRzCUz+oVbkOvnv+e5ZXLiNbLPxo7YU9
hnbZqZhUktB/CWYZksczjM6byCo89tN+bJmyodjF58Dm/HKp6LQgTbTyqf/zXQ+Y
ZazWAPMqh6fsv2ZdTt9gIJlOCi10pNs5u2wFKgGVJNqsF1+WrH33qHxLG7S7ZUdC
kANZW0PCpPqQi/zitVRDFTsp//MffViOKaPqE/gqCqT/arN/2xZBideY4NdeATQW
kD3gYBa1lLJe5dwG6e20FKcQHE+chihdR+tnjXmCBlqpXPuYmDXWlooofVt+JLym
JDnMi3gH8otBV5iqp+kIupr9kVJabRPPpJos2QIDAQABAoIBABIrjtczfnMpdGfT
RB1Lxdm3Yge2pKR7eIraYWh7S3vInBD2DKq/Woul2AZJrRjnS3G+WtS8scWvuywi
BbBZFEe4tDGvt3gjUzHcTwnalHNC/YM4YQrzwepjq+tusXs7Xa+p4TQoSraYBCl9
jlMMvk99yc7CW1EFF6NxsJUqQUrViVbSu7QqKnRYOnf4sVBhGEErCTK2s8NKGwL+
2a8NWVfWH/22FPseByvEDGC9h1DvVI8+s8lDqxQV3RQyCus17Hms3V+ePKYTT6uF
5v7LVCFAWecPqJ8EMAudNZgDcb7TlYhPSAVdOeW+3BusROR07HdHtyYRVk0DGU02
a0AMa1ECgYEA9e7YQ5XatEBTu7OJHtpDpv0VZcnL1mPEt4wIJ7GjaUrnsZ+5+/Cd
J86wVh7q+MHuZZSwHZAkDVhITw4I1wmhCzQ6iq89KgvrpQaedxFvYe+9mYq0djX2
W80SrKEFfSOV5D1vfa9ajnDgSscG0P5Yvh8Y3Y6SLwPNbg56N3WuqxUCgYEAwv3c
TzNEhwr2hKjoy2oGhvmNf4O8tRr/o8fXR4EurXAgyXLZL6VMF/IsU6/KbvjUDNFh
+6jbRTUc6+ZXF52yUU0F4B/h0E4qyvczIrYhDcSJFJpaYhSqLuh7/g4fPMwL5i4l
E1Qpkk+O7PMflB60Jd8bDfwNdqDK8PKlVbfQG7UCgYBll/osyT3kkmJEuuDdJusl
k40AVIFpGiPMcwN3alGIEJJv9Py+j+JL7H05xmHoyywxOGAchkvuW1bbmX+bXXXy
i+vXGJcaxHve20IhC8nIWmIniH4OCzKvL6MUPxxmWon0FFD3SbYN+6EcIuW09i0w
tOXvuJK460g0u7RPLsUuFQKBgC33G+0Ln9bZrb0d+CqjZsCAqWtqyZxDrgmUvVnc
yP0XlpMGYM5LgAGRFAPyR50bSRlwblGdv3q0B4pQdS1a/kMODhmESn4JPyszVLmV
B3uwXcQekrnWNzvxj/EWsSRq0U9Eh3bj+xzDZmTS9xm6lyrqSf1k8mOJie18tZ7c
QtGVAoGBAK/+82q38N+FVQr3h6SkXe09DHHipHYE62G6R6mohSMt41zLa+tKk9Dd
QOIfa/hpfsjtkGJSK6obJ0u46jRpMV71m1kb3ew+eto52ExUzG4TvrL6fOixo0ZX
IYUuLmO1b90tzicaVB5prHuu8/0ZmopP3FfVHC8KKLFfU9Zsia/Z
-----END RSA PRIVATE KEY-----
EOF
gh secret set "GITHUB_PRIVATE_KEY" --repo "$REPO" < /tmp/github_private_key.txt 2>&1 || echo "    ⚠️  Falha ao adicionar GITHUB_PRIVATE_KEY"
rm /tmp/github_private_key.txt
echo ""

# ============================================
# GITLAB
# ============================================
echo "🔐 4/10 - GitLab..."
add_secret "GITLAB_TOKEN" "glpat-rcVb9FbslTUmz8jU_8yci286MQp1Oml4ZThxCw.01.121jjr6i1"
echo ""

# ============================================
# DATAJUD (CNJ)
# ============================================
echo "🔐 5/10 - DataJud API (CNJ)..."
add_secret "VITE_DATAJUD_API_KEY" "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="
add_secret "DATAJUD_API_KEY" "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="
add_secret "DATAJUD_BASE_URL" "https://api-publica.datajud.cnj.jus.br"
echo ""

# ============================================
# TODOIST
# ============================================
echo "🔐 6/10 - Todoist..."
add_secret "VITE_TODOIST_API_KEY" "86eec3209f0e728100e425f12b7f034cd7ce025a"
add_secret "TODOIST_WEBHOOK_SECRET" "741c5498a70b8acca4716bbc4eec5ffa14a1af6dbbf03ef747554c9fdd46acec"
echo ""

# ============================================
# AUTONOMA
# ============================================
echo "🔐 7/10 - Autonoma..."
add_secret "AUTONOMA_CLIENT_ID" "cmiamh5jk004w0v01vi69elai"
add_secret "AUTONOMA_SECRET_ID" "9f1b0b3b845ead0a2b0003caef85e887a169485b8a38d177584634348cd1a2a8d821522b1dec0d675350779ba1ebcd68"
add_secret "KERNEL_API_KEY" "sk_f83f3e64-4cff-4495-b294-b6003e9c9568.XHwEUHy/tUOZbiqYpueOeP6/rkoiQ7ruEVPyTrgtCe0"
echo ""

# ============================================
# PJE
# ============================================
echo "🔐 8/10 - PJe Credentials..."
add_secret "PJE_LOGIN_URL" "https://pje.tjmg.jus.br/pje/login.seam"
add_secret "PJE_LOGIN_USER" "10922866678"
add_secret "PJE_LOGIN_PASS" "184184ab"
echo ""

# ============================================
# VAPID
# ============================================
echo "🔐 9/10 - Push Notifications (VAPID)..."
add_secret "VAPID_PUBLIC_KEY" "BJtbPAN0xtXyOh2AGUVu60gA1A9qbRe1i8zI4WdNf41-lUQ9M0ymh2iQ-Losys3vZvDPkhzL6zlknPRUZEzWUzg"
add_secret "VAPID_PRIVATE_KEY" "AxoS61uUW2DXjYUl-X64iLTomlvNVRO-kKyqKYyjbXE"
echo ""

# ============================================
# AMBIENTE
# ============================================
echo "🔐 10/10 - Configurações de Ambiente..."
add_secret "PROJECT_ID" "prj_723BoFBVmmMeZaEieU1DIjzsuhDD"
echo ""

# ============================================
# RESUMO
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SECRETS ADICIONADOS AO GITHUB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Total de secrets configurados: ~35"
echo ""
echo "⚠️  SECRETS FALTANDO (VOCÊ PRECISA ADICIONAR):"
echo "   1. UPSTASH_REDIS_REST_URL (obter em: https://console.upstash.com/redis)"
echo "   2. UPSTASH_REDIS_REST_TOKEN (obter em: https://console.upstash.com/redis)"
echo "   3. VITE_GEMINI_API_KEY (obter GRÁTIS em: https://aistudio.google.com/app/apikey)"
echo "   4. GEMINI_API_KEY (obter GRÁTIS em: https://aistudio.google.com/app/apikey)"
echo ""
echo "🚀 SECRETS RAILWAY (ADICIONAR DEPOIS DO DEPLOY):"
echo "   1. DSPY_BRIDGE_URL (URL gerada pelo Railway)"
echo "   2. DSPY_API_TOKEN (token gerado no setup Railway)"
echo "   3. VITE_DSPY_URL (mesma URL do Railway)"
echo "   4. VITE_DSPY_API_TOKEN (mesmo token Railway)"
echo ""
echo "📖 Para adicionar secrets manualmente:"
echo "   gh secret set NOME_DO_SECRET --repo $REPO"
echo ""
echo "🔍 Para listar todos os secrets:"
echo "   gh secret list --repo $REPO"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
