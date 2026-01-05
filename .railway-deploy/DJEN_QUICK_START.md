# 📖 Instruções Rápidas - Scheduler DJEN

## 🚀 Ativar Agora (3 passos)

### 1. Editar `.env`
```bash
nano .env
```

Adicione:
```bash
DJEN_SCHEDULER_ENABLED=true
DJEN_OAB_NUMERO=184404
DJEN_OAB_UF=MG
DJEN_ADVOGADO_NOME="Thiago Bodevan Veiga"
```

### 2. Reiniciar Backend
```bash
cd backend
npm run dev
```

### 3. Verificar
Você verá:
```
✅ [DJEN Scheduler] Jobs configurados com sucesso
⏰ Próxima execução: 01:00 (America/Sao_Paulo)
```

---

## 🧪 Testar Agora (sem esperar 01h/09h)

```bash
curl -X POST http://localhost:3001/api/djen/trigger-manual
```

---

## 📊 Ver Status

```bash
curl http://localhost:3001/api/djen/status
```

---

## ⏰ Horários de Execução

- **01:00** (madrugada)
- **09:00** (manhã)

Fuso: Brasília (`America/Sao_Paulo`)

---

## 📂 Documentação Completa

- **Resumo:** [DJEN_SCHEDULER_RESUMO.md](./DJEN_SCHEDULER_RESUMO.md)
- **Detalhes:** [DJEN_SCHEDULER_COMPLETO.md](./DJEN_SCHEDULER_COMPLETO.md)

---

## ⚠️ Importante

✅ **SEM MOCKS** - Sistema usa dados 100% reais:
- API DJEN real
- PostgreSQL real
- IA Gemini real
