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
