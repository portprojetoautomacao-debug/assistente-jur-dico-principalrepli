#!/usr/bin/env python3
"""
Download Qwen2.5-7B-Instruct model from Hugging Face
"""

from huggingface_hub import snapshot_download
import os

# Configurações
MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
CACHE_DIR = os.path.expanduser("~/.cache/huggingface/hub")
LOCAL_DIR = "./models/qwen2.5-7b-instruct"

print(f"📥 Baixando modelo: {MODEL_ID}")
print(f"📁 Destino: {LOCAL_DIR}")
print(f"💾 Cache: {CACHE_DIR}")
print()

try:
    # Baixar o modelo completo
    print("⏳ Iniciando download... (isso pode demorar - modelo tem ~15GB)")
    
    snapshot_download(
        repo_id=MODEL_ID,
        local_dir=LOCAL_DIR,
        cache_dir=CACHE_DIR,
        resume_download=True,  # Permite retomar download interrompido
        local_dir_use_symlinks=False,  # Copia arquivos em vez de symlinks
    )
    
    print()
    print("✅ Download concluído com sucesso!")
    print(f"📍 Modelo salvo em: {os.path.abspath(LOCAL_DIR)}")
    
except KeyboardInterrupt:
    print("\n⚠️  Download interrompido pelo usuário")
    print("💡 Você pode executar novamente para retomar de onde parou")
    
except Exception as e:
    print(f"\n❌ Erro ao baixar modelo: {e}")
    print("\n💡 Dicas:")
    print("   - Verifique sua conexão com a internet")
    print("   - Certifique-se de ter espaço em disco suficiente (~15GB)")
    print("   - Tente executar novamente (o download será retomado)")
