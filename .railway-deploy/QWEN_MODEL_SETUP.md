# Download do Modelo Qwen2.5-7B-Instruct

## ⚠️ Situação Atual

**Espaço disponível**: 5.7GB  
**Espaço necessário**: ~15GB  
**Status**: ❌ Espaço insuficiente

## 📋 Opções Disponíveis

### Opção 1: Download Lite (Recomendado para agora) ✅

Baixa apenas arquivos de configuração e tokenizador (~50MB):

```bash
python download-qwen-model-lite.py
```

**Vantagens**:
- Rápido (~1 minuto)
- Requer pouco espaço
- Permite testar configuração

**Desvantagens**:
- Não inclui os pesos do modelo
- Não pode executar inferência local

---

### Opção 2: Download Completo (Requer mais espaço) ⚠️

Baixa o modelo completo com todos os pesos:

```bash
python download-qwen-model.py
```

**Requisitos**:
- ~15GB de espaço livre
- Conexão estável (download pode levar horas)
- GPU recomendada para inferência

**Você precisaria liberar**: ~10GB de espaço adicional

---

### Opção 3: Usar API Remota (Recomendado) 🌟

Em vez de baixar o modelo, use APIs remotas:

#### A. Hugging Face Inference API

```python
from huggingface_hub import InferenceClient

client = InferenceClient(token="seu_token_aqui")

response = client.text_generation(
    "Qwen/Qwen2.5-7B-Instruct",
    prompt="Olá, como você pode me ajudar?"
)
```

**Vantagens**:
- Sem uso de espaço local
- Sem necessidade de GPU
- Sempre atualizado

**Custo**: Grátis para uso limitado

#### B. Integração com Spark LLM (Já configurado)

O projeto já usa Spark LLM (GPT-4) que é mais poderoso:

```typescript
import * as spark from '@github/spark/llm'

const response = await spark.llm("Sua pergunta aqui", "gpt-4o")
```

---

## 🚀 Recomendação

**Para desenvolvimento local**: Use a Opção 3B (Spark LLM já configurado)

**Para testes do Qwen**: Use a Opção 3A (API Hugging Face)

**Para uso offline**: Libere espaço e use a Opção 2

---

## 📊 Como Liberar Espaço

Se quiser baixar o modelo completo, libere espaço:

```bash
# Ver uso de espaço
du -h --max-depth=1 /workspaces | sort -hr | head -20

# Limpar caches comuns
rm -rf ~/.cache/pip
rm -rf node_modules/.cache
docker system prune -a  # Se tiver permissão

# Limpar builds antigos
rm -rf dist/
rm -rf build/
```

---

## 🔗 Links Úteis

- [Qwen2.5-7B-Instruct no HuggingFace](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct)
- [Documentação Qwen](https://qwen.readthedocs.io/)
- [Hugging Face Inference API](https://huggingface.co/inference-api)
- [Spark LLM Documentation](https://githubnext.com/projects/spark)

---

## ❓ Perguntas Frequentes

**Q: Posso usar o modelo sem baixar?**  
A: Sim! Use a Hugging Face Inference API ou continue com Spark LLM.

**Q: Quanto tempo demora o download completo?**  
A: Depende da conexão. Pode levar de 30 minutos a várias horas.

**Q: Preciso de GPU?**  
A: Para inferência local do modelo 7B, GPU é altamente recomendada.

**Q: Qual modelo é melhor?**  
A: Para produção, GPT-4 (via Spark) é mais confiável. Qwen é bom para testes e experimentação.
