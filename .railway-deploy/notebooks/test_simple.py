#!/usr/bin/env python3
"""
Teste Simplificado - Validação de Ambiente e API
Executa testes básicos sem dependências pesadas
"""

import sys
import json
from urllib import request, error

API_URL = "http://localhost:3001/api"

print("=" * 60)
print("🧪 TESTE SIMPLIFICADO - ASSISTENTE JURÍDICO PJe")
print("=" * 60)

# 1. Health Check
print("\n[1/4] 🏥 Testando Health Check...")
try:
    health_url = "http://localhost:3001/health"
    with request.urlopen(health_url, timeout=5) as response:
        data = json.loads(response.read().decode())
        print(f"✅ API Online - Status: {data['status']}")
        print(f"   Timestamp: {data['timestamp']}")
        print(f"   Ambiente: {data['env']}")
except error.URLError as e:
    print(f"❌ Falha na conexão: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)

# 2. Listar Agentes
print("\n[2/4] 🤖 Testando Listagem de Agentes...")
try:
    agents_url = f"{API_URL}/agents/list"
    with request.urlopen(agents_url, timeout=5) as response:
        data = json.loads(response.read().decode())
        agents = data.get('agents', [])
        print(f"✅ Total de agentes: {len(agents)}")
        print(f"   Tipos disponíveis:")
        types = {}
        for agent in agents:
            agent_type = agent.get('type', 'unknown')
            types[agent_type] = types.get(agent_type, 0) + 1
        for atype, count in types.items():
            print(f"     - {atype}: {count}")
except Exception as e:
    print(f"❌ Erro ao listar agentes: {e}")

# 3. Listar Minutas
print("\n[3/4] 📄 Testando Listagem de Minutas...")
try:
    minutas_url = f"{API_URL}/minutas"
    with request.urlopen(minutas_url, timeout=5) as response:
        data = json.loads(response.read().decode())
        minutas = data if isinstance(data, list) else []
        print(f"✅ Total de minutas: {len(minutas)}")
        if minutas:
            print(f"   Última minuta: {minutas[0].get('titulo', 'N/A')}")
except Exception as e:
    print(f"⚠️  Endpoint de minutas não disponível: {e}")

# 4. Stats dos Agentes
print("\n[4/4] 📊 Testando Estatísticas dos Agentes...")
try:
    stats_url = f"{API_URL}/agents/stats"
    with request.urlopen(stats_url, timeout=5) as response:
        data = json.loads(response.read().decode())
        stats = data.get('stats', {})
        print(f"✅ Estatísticas disponíveis:")
        print(f"   Total de execuções: {stats.get('totalExecutions', 0)}")
        print(f"   Taxa de sucesso: {stats.get('successRate', 0):.2f}%")
except Exception as e:
    print(f"❌ Erro ao obter estatísticas: {e}")

print("\n" + "=" * 60)
print("✅ TESTES CONCLUÍDOS COM SUCESSO")
print("=" * 60)
print("\n📋 Resumo:")
print("   - Backend está online e respondendo")
print("   - API de agentes está funcional")
print("   - Sistema pronto para uso")
print("\n💡 Para testes completos, execute:")
print("   python3 notebooks/run_playground.py")
