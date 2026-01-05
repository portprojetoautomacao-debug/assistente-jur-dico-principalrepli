#!/usr/bin/env python3
"""
Download Qwen2.5-7B-Instruct model (versão otimizada para espaço limitado)
"""

from huggingface_hub import hf_hub_download
import os

# Configurações
MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
LOCAL_DIR = "./models/qwen2.5-7b-instruct"

# Arquivos essenciais do modelo
ESSENTIAL_FILES = [
    "config.json",
    "generation_config.json",
    "tokenizer_config.json",
    "tokenizer.json",
    "merges.txt",
    "vocab.json",
    "model.safetensors.index.json",  # Índice dos pesos
]

print(f"📥 Baixando arquivos essenciais do modelo: {MODEL_ID}")
print(f"📁 Destino: {LOCAL_DIR}")
print(f"💡 Apenas arquivos de configuração (sem pesos completos)")
print()

os.makedirs(LOCAL_DIR, exist_ok=True)

downloaded = []
failed = []

for filename in ESSENTIAL_FILES:
    try:
        print(f"⏳ Baixando: {filename}...")
        
        filepath = hf_hub_download(
            repo_id=MODEL_ID,
            filename=filename,
            local_dir=LOCAL_DIR,
            local_dir_use_symlinks=False
        )
        
        downloaded.append(filename)
        print(f"✅ {filename}")
        
    except Exception as e:
        failed.append((filename, str(e)))
        print(f"⚠️  {filename} - {e}")

print()
print(f"✅ Download concluído!")
print(f"   Arquivos baixados: {len(downloaded)}/{len(ESSENTIAL_FILES)}")
print(f"📍 Localização: {os.path.abspath(LOCAL_DIR)}")

if failed:
    print(f"\n⚠️  Arquivos que falharam: {len(failed)}")
    for fname, error in failed:
        print(f"   - {fname}")

print()
print("💡 Observação:")
print("   Este download inclui apenas configurações e tokenizador.")
print("   Para usar o modelo completo, você precisará:")
print("   1. ~15GB de espaço em disco")
print("   2. Executar: python download-qwen-model-full.py")
print()
print("   Alternativamente, use uma API remota:")
print("   - Hugging Face Inference API")
print("   - OpenAI API")
print("   - Anthropic API (Claude)")
