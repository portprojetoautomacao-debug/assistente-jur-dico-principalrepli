# 🎭 Guia de Modos do Playwright

## ✅ Configuração Completa

O ambiente está configurado para rodar testes Playwright em **ambos os modos**:
- **Headless** (sem interface gráfica) ✅
- **Headed** (com interface gráfica virtual via xvfb) ✅

---

## 🚀 Comandos Disponíveis

### Modo Headless (Padrão - Mais Rápido)

```bash
# Via npm
npm run test:e2e

# Via Playwright CLI
npx playwright test

# Arquivo específico
npx playwright test tests/e2e/basic.spec.ts
```

**Quando usar:** CI/CD, testes automatizados, execução rápida

---

### Modo Headed (Visual - Debug)

```bash
# Via npm
npm run test:e2e:headed

# Via xvfb-run direto
xvfb-run npx playwright test --headed

# Arquivo específico
xvfb-run npx playwright test tests/e2e/basic.spec.ts --headed
```

**Quando usar:** Debug visual, entender comportamento do teste

---

### Modo Debug (Headed + Inspector)

```bash
# Via npm
npm run test:e2e:debug

# Via xvfb-run direto
xvfb-run npx playwright test --headed --debug
```

**Quando usar:** Depuração detalhada, step-by-step

---

## 🎯 Tasks do VS Code

Você também pode executar via **Command Palette** (`Ctrl+Shift+P` → "Run Task"):

| Task                     | Descrição                         |
|--------------------------|-----------------------------------|
| `test:e2e:headless`      | Testes E2E em modo headless       |
| `test:e2e:headed`        | Testes E2E em modo headed (xvfb)  |
| `test:e2e:debug`         | Testes E2E em modo debug          |

---

## 📊 Comparação de Resultados

Ambos os modos produzem **resultados idênticos**:

```
4 failed
1 skipped
36 passed (1.4m)
```

---

## 🔧 Dependências Instaladas

- ✅ **xvfb** - Virtual framebuffer X server
- ✅ **xauth** - X authentication utility
- ✅ **Playwright** - Browser automation
- ✅ **Chromium/Firefox** - Navegadores Playwright

---

## 📝 Notas Técnicas

### Por que usar xvfb?

Em ambientes Linux **sem display gráfico** (como dev containers, CI/CD), o xvfb cria um **servidor X virtual** permitindo que navegadores rodeem em modo headed.

### Diferenças entre Headless e Headed

| Aspecto       | Headless                     | Headed (xvfb)               |
|---------------|------------------------------|------------------------------|
| Performance   | ⚡ Mais rápido               | 🐢 Um pouco mais lento       |
| Recursos      | 💾 Menos memória             | 💾 Mais memória              |
| Debug         | ❌ Difícil visualizar        | ✅ Melhor para debug         |
| CI/CD         | ✅ Ideal                     | ⚠️ Funcional mas mais lento  |
| Screenshots   | ✅ Funciona                  | ✅ Funciona melhor           |
| Vídeos        | ✅ Funciona                  | ✅ Funciona melhor           |

---

## 🆘 Troubleshooting

### Erro: "xauth command not found"

```bash
sudo apt-get install -y xauth
```

### Erro: "Target page, context or browser has been closed"

- **Solução 1:** Use modo headless (padrão)
- **Solução 2:** Use `xvfb-run` antes do comando

### Reinstalar navegadores Playwright

```bash
npx playwright install --with-deps chromium firefox
```

---

## 📖 Recursos Adicionais

- [Playwright Docs](https://playwright.dev/)
- [xvfb Man Page](https://www.x.org/archive/X11R7.6/doc/man/man1/Xvfb.1.xhtml)
- [Troubleshooting Playwright](https://playwright.dev/docs/ci#docker)

---

**Última atualização:** 5 de dezembro de 2025
