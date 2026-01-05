# ☕ Configuração Java para SonarQube - Completa

## ✅ Status Atual do Java

O Java **está corretamente instalado e configurado** via SDKMAN!

### 📊 Informações do Java Instalado

| Item | Valor |
|------|-------|
| **Versão** | OpenJDK 11.0.29 LTS |
| **Distribuição** | Microsoft Build (MS) |
| **Localização** | `/usr/local/sdkman/candidates/java/current` |
| **Real Path** | `/usr/local/sdkman/candidates/java/11.0.29-ms` |
| **JAVA_HOME** | `/usr/local/sdkman/candidates/java/current` |
| **Compatibilidade SonarLint** | ✅ Sim (requer Java 11+) |

### ✅ Configurações Atualizadas

#### 1. VS Code Settings (`.vscode/settings.json`)

```json
{
  "sonarlint.ls.javaHome": "/usr/local/sdkman/candidates/java/current",
  "sonarlint.pathToNodeExecutable": "/usr/local/share/nvm/versions/node/v22.21.1/bin/node"
}
```

#### 2. Script de Verificação (`verificar-sonarqube.sh`)

```bash
# Auto-detecta JAVA_HOME se não estiver definido
if [ -d "/usr/local/sdkman/candidates/java/current" ]; then
    export JAVA_HOME="/usr/local/sdkman/candidates/java/current"
fi
```

---

## 🔧 Gerenciamento de Versões Java com SDKMAN

### Comandos Úteis

```bash
# Ver versão atual do Java
java -version
sdk current java

# Listar todas as versões Java disponíveis para instalação
sdk list java

# Listar versões Java instaladas localmente
sdk list java | grep installed

# Instalar uma nova versão (exemplo: Java 17)
sdk install java 17.0.17-ms

# Instalar Java 21 LTS (mais recente LTS antes do Java 25)
sdk install java 21.0.1-ms

# Instalar Java 25 (latest - requer download manual)
# Baixe de: https://download.oracle.com/java/25/latest/jdk-25_linux-x64_bin.tar.gz
# Depois instale via SDKMAN local

# Trocar versão do Java temporariamente (sessão atual)
sdk use java 17.0.17-ms

# Definir versão padrão do Java permanentemente
sdk default java 17.0.17-ms

# Ver qual versão está ativa
sdk current java
```

### Versões Recomendadas para SonarQube

| Versão Java | Status | Recomendação |
|-------------|--------|--------------|
| **Java 11** | ✅ Atual | Suficiente para SonarLint |
| **Java 17** | ✅ LTS | Recomendado para produção |
| **Java 21** | ✅ LTS | Mais recente LTS estável |
| **Java 25** | 🆕 Latest LTS | Última versão (setembro 2027) |

### Como Instalar Java 17 ou 21

```bash
# Instalar Java 17 LTS
sdk install java 17.0.17-ms
sdk default java 17.0.17-ms

# OU instalar Java 21 LTS
sdk install java 21.0.1-ms
sdk default java 21.0.1-ms

# Verificar
java -version
```

---

## 🎯 Requisitos do SonarLint

### Versões Java Suportadas

- **Mínimo**: Java 11
- **Recomendado**: Java 17 ou 21 (LTS)
- **Atual no projeto**: Java 11.0.29 ✅

### Por que Java 11 é Suficiente?

O **SonarLint** (extensão VS Code) requer apenas:
- ✅ Java 11 ou superior
- ✅ Node.js 18+ (temos 22.21.1)

**Java 21** seria necessário apenas se estivéssemos rodando o **SonarQube Server** localmente, o que **não é o caso** - usamos o **SonarCloud** (cloud).

---

## 🔍 Verificação e Troubleshooting

### Verificar Configuração Completa

```bash
./verificar-sonarqube.sh
```

**Saída esperada:**
```
✅ java encontrado: /usr/local/sdkman/candidates/java/current/bin/java
   Versão: openjdk version "11.0.29" 2025-10-21 LTS
✅ JAVA_HOME definido: /usr/local/sdkman/candidates/java/current
```

### Problemas Comuns

#### JAVA_HOME não definido

```bash
# Adicione ao ~/.bashrc ou ~/.zshrc
export JAVA_HOME="/usr/local/sdkman/candidates/java/current"
export PATH="$JAVA_HOME/bin:$PATH"

# Recarregue
source ~/.bashrc
```

#### VS Code não reconhece o Java

1. Feche completamente o VS Code
2. Verifique JAVA_HOME no terminal:
   ```bash
   echo $JAVA_HOME
   ```
3. Reinicie VS Code
4. Execute: `Ctrl+Shift+P` → `Developer: Reload Window`

#### SonarLint não inicia

```bash
# Ver logs do SonarLint
Ctrl+Shift+P → "SonarLint: Show SonarLint Output"

# Verificar se Java está acessível
which java
java -version
```

---

## 📥 Download Manual do Java (Opcional)

Se precisar instalar manualmente uma versão específica:

### Java 17 LTS (Oracle)

```bash
# Download
wget https://download.oracle.com/java/17/latest/jdk-17_linux-x64_bin.tar.gz

# Extrair
tar -xzf jdk-17_linux-x64_bin.tar.gz

# Instalar via SDKMAN local
sdk install java 17-oracle ~/jdk-17.0.17

# Usar
sdk use java 17-oracle
```

### Java 21 LTS (Oracle)

```bash
# Download
wget https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.tar.gz

# Extrair
tar -xzf jdk-21_linux-x64_bin.tar.gz

# Instalar via SDKMAN local
sdk install java 21-oracle ~/jdk-21

# Usar
sdk use java 21-oracle
```

### Java 25 Latest (Oracle)

```bash
# Download
wget https://download.oracle.com/java/25/latest/jdk-25_linux-x64_bin.tar.gz

# Extrair
tar -xzf jdk-25_linux-x64_bin.tar.gz

# Instalar via SDKMAN local
sdk install java 25-oracle ~/jdk-25

# Usar
sdk use java 25-oracle
```

---

## 🚀 Próximos Passos

### ✅ Java está configurado - O que falta?

1. **Configurar token do SonarCloud** (único passo pendente):
   - Acesse: https://sonarcloud.io/account/security
   - Gere um **User Token**
   - Adicione ao `.env`: `SONARQUBE_TOKEN=seu_token`

2. **Reiniciar VS Code**:
   ```
   Ctrl+Shift+P → "Developer: Reload Window"
   ```

3. **Testar análise**:
   - Abra qualquer arquivo `.ts` ou `.tsx`
   - Salve (Ctrl+S)
   - Veja issues no painel "Problems"

---

## 📚 Referências

- **SDKMAN**: https://sdkman.io/
- **Java Downloads Oracle**: https://www.oracle.com/java/technologies/downloads/
- **Java 17 Archive**: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
- **Java 21 LTS**: https://www.oracle.com/java/technologies/javase/jdk21-archive-downloads.html
- **Java 25 (Latest)**: https://www.oracle.com/java/technologies/downloads/#java25
- **SonarLint Requirements**: https://www.sonarsource.com/products/sonarlint/

---

**Atualizado em**: 06/12/2024  
**Java Atual**: OpenJDK 11.0.29 LTS (Microsoft Build)  
**Status**: ✅ Configurado e funcionando
