import os
import requests
import pandas as pd
import json
import matplotlib.pyplot as plt
from dotenv import load_dotenv
import google.generativeai as genai
from qdrant_client import QdrantClient
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuração Visual
plt.style.use('ggplot')
pd.set_option('display.max_columns', None)

# Carregar variáveis de ambiente
env_path = os.path.join(os.path.dirname(os.getcwd()), '.env.local')
if not os.path.exists(env_path):
    env_path = os.path.join(os.getcwd(), '..', '.env.local')

if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(os.getcwd()), '.env')
    if not os.path.exists(env_path):
        env_path = os.path.join(os.getcwd(), '..', '.env')

load_dotenv(env_path)

# Configurações
API_URL = "http://localhost:3001/api"
DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_KEY = os.getenv("QDRANT_API_KEY")
REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL")
REDIS_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

print("✅ Ambiente configurado.")
print(f"📍 API URL: {API_URL}")
print(f"🗄️  PostgreSQL: {'Configurado' if DATABASE_URL else 'Não configurado'}")
print(f"🔑 Gemini Key: {'Set' if GEMINI_KEY else 'Not Set'}")
print(f"📊 Qdrant URL: {QDRANT_URL or 'Não configurado'}")
print(f"⚡ Redis URL: {'Configurado' if REDIS_URL else 'Não configurado'}")

print("\n--- 1. Healthcheck da API Local ---")
try:
    # O endpoint /health fica na raiz do backend, não em /api/health
    health_url = API_URL.replace("/api", "/health")
    response = requests.get(health_url, timeout=5)
    if response.status_code == 200:
        data = response.json()
        print("✅ API Online!")
        print(json.dumps(data, indent=2))
    else:
        print(f"❌ Erro na API: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("❌ Não foi possível conectar. Verifique se o backend está rodando na porta 3001.")
except Exception as e:
    print(f"❌ Erro: {e}")

print("\n--- 2. Análise de Agentes ---")
try:
    response = requests.get(f"{API_URL}/agents/list", timeout=5)

    if response.status_code == 200:
        data = response.json()
        agents = data.get('agents', [])
        if agents:
            df_agents = pd.DataFrame(agents)
            # Selecionar colunas relevantes se existirem
            cols = [c for c in ['agentId', 'type', 'status'] if c in df_agents.columns]
            print(df_agents[cols])

            if 'status' in df_agents.columns:
                status_counts = df_agents['status'].value_counts()
                # status_counts.plot(kind='bar', color='teal', title='Status dos Agentes')
                # plt.show()
                print("\nStatus Counts:")
                print(status_counts)
        else:
            print("⚠️ Nenhum agente retornado pela API.")
    else:
        print(f"⚠️ Endpoint /agents/list retornou: {response.status_code}")
except Exception as e:
    print(f"Erro ao consultar agentes: {e}")

print("\n--- 3. Teste do Google Gemini ---")
if GEMINI_KEY:
    try:
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel('gemini-pro') # Ou use o modelo definido no .env

        prompt = "Explique brevemente o conceito de 'Habeas Corpus' para um leigo."
        print(f"🤖 Enviando prompt: '{prompt}'...")

        response = model.generate_content(prompt)
        print("\n📝 Resposta do Gemini:")
        print(response.text)
    except Exception as e:
        print(f"❌ Erro ao conectar com Gemini: {e}")
else:
    print("⚠️ VITE_GEMINI_API_KEY não encontrada no .env.local")

print("\n--- 4. Inspeção do Qdrant (Vector DB) ---")
if QDRANT_URL and QDRANT_KEY:
    try:
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_KEY)
        collections = client.get_collections()

        print(f"📚 Coleções encontradas: {len(collections.collections)}")
        for col in collections.collections:
            print(f" - {col.name}")

            # Tenta pegar info da coleção
            try:
                info = client.get_collection(col.name)
                print(f"   Items: {info.points_count}, Vetores: {info.config.params.vectors}")
            except:
                pass
    except Exception as e:
        print(f"❌ Erro ao conectar com Qdrant: {e}")
else:
    print("⚠️ QDRANT_URL ou QDRANT_API_KEY não configurados.")

print("\n--- 6. Inspeção do PostgreSQL (Neon) ---")
if DATABASE_URL:
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Listar tabelas
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = [row['table_name'] for row in cursor.fetchall()]

        print(f"📊 Tabelas encontradas: {len(tables)}")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            count = cursor.fetchone()['count']
            print(f"  - {table}: {count} registros")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Erro ao conectar com PostgreSQL: {e}")
else:
    print("⚠️ DATABASE_URL não configurada no .env.local")

print("\n--- Inspecionar tabela de minutas ---")
if DATABASE_URL:
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT id, titulo, tipo, status, autor,
                   criado_em, atualizado_em
            FROM minutas
            ORDER BY atualizado_em DESC
            LIMIT 10
        """)

        minutas = cursor.fetchall()
        if minutas:
            df_minutas = pd.DataFrame(minutas)
            print("📄 Últimas minutas criadas:")
            print(df_minutas)
        else:
            print("ℹ️ Nenhuma minuta encontrada no banco.")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Erro: {e}")

print("\n--- Inspecionar tabelas DJEN ---")
if DATABASE_URL:
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Advogados monitorados
        cursor.execute("SELECT * FROM djen_lawyers")
        lawyers = cursor.fetchall()
        if lawyers:
            print("👨‍⚖️ Advogados monitorados no DJEN:")
            df_lawyers = pd.DataFrame(lawyers)
            print(df_lawyers)
        else:
            print("ℹ️ Nenhum advogado cadastrado.")

        # Publicações
        cursor.execute("""
            SELECT id, processo_numero, data_publicacao, tipo_publicacao,
                   created_at
            FROM djen_publications
            ORDER BY data_publicacao DESC
            LIMIT 10
        """)
        pubs = cursor.fetchall()
        if pubs:
            print("\n📰 Últimas publicações capturadas:")
            df_pubs = pd.DataFrame(pubs)
            print(df_pubs)
        else:
            print("\nℹ️ Nenhuma publicação capturada ainda.")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Erro: {e}")

print("\n--- 5. Inspeção do Redis (Upstash) ---")
if REDIS_URL and REDIS_TOKEN:
    try:
        # Usando REST API do Upstash
        headers = {"Authorization": f"Bearer {REDIS_TOKEN}"}
        # Comando DBSIZE
        resp = requests.post(f"{REDIS_URL}/dbsize", headers=headers)

        if resp.status_code == 200:
            result = resp.json()
            print(f"📦 Total de chaves no Redis: {result.get('result')}")

            # Listar algumas chaves (SCAN)
            resp_scan = requests.post(f"{REDIS_URL}/scan", headers=headers, json=["0"])
            if resp_scan.status_code == 200:
                keys = resp_scan.json().get('result', [])[1]
                print(f"🔑 Algumas chaves: {keys}")
        else:
            print(f"❌ Erro Redis: {resp.status_code} - {resp.text}")

    except Exception as e:
        print(f"❌ Erro ao conectar com Redis: {e}")
else:
    print("⚠️ UPSTASH_REDIS_REST_URL ou TOKEN não configurados.")
