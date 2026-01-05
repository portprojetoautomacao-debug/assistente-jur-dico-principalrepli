#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Instalando OpenJDK (se necessário)..."

if command -v java >/dev/null 2>&1; then
  echo "✅ Java já instalado: $(java -version 2>&1 | head -n 1)"
  exit 0
fi

install_debian() {
  sudo apt-get update
  for pkg in openjdk-11-jdk openjdk-11-jre-headless openjdk-17-jdk openjdk-17-jre-headless openjdk-21-jdk openjdk-21-jre-headless default-jre default-jdk; do
    if sudo apt-get install -y $pkg; then
      echo "✅ Instalado: $pkg"
      return 0
    fi
  done
  return 1
}

install_redhat() {
  for pkg in java-11-openjdk-devel java-17-openjdk-devel java-21-openjdk-devel; do
    if sudo yum install -y $pkg; then
      echo "✅ Instalado: $pkg"
      return 0
    fi
  done
  return 1
}

if [ -f /etc/debian_version ]; then
  if ! install_debian; then
    echo "⚠️ Falha ao instalar OpenJDK via apt-get. Por favor instale manualmente." >&2
    exit 1
  fi
elif [ -f /etc/redhat-release ] || [ -f /etc/centos-release ]; then
  if ! install_redhat; then
    echo "⚠️ Falha ao instalar OpenJDK via yum. Por favor instale manualmente." >&2
    exit 1
  fi
else
  echo "⚠️ Sistema não reconhecido. Instale OpenJDK manualmente." >&2
  exit 1
fi

# Try to set JAVA_HOME by probing java path
if command -v java >/dev/null 2>&1; then
  JAVA_BIN=$(readlink -f $(which java) || true)
  if [ -n "$JAVA_BIN" ]; then
    JAVA_HOME_DIR=$(dirname $(dirname $JAVA_BIN))
    echo "export JAVA_HOME=$JAVA_HOME_DIR" >> ~/.bashrc
    echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc
    echo "✅ JAVA_HOME registrado em ~/.bashrc: $JAVA_HOME_DIR"
  fi
fi

echo "✅ Finalizado. Reinicie o terminal para ativar JAVA_HOME (ou rode: source ~/.bashrc)"
#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Instalando OpenJDK 11 (se necessário)..."

if command -v java >/dev/null 2>&1; then
  echo "✅ Java já instalado: $(java -version 2>&1 | head -n 1)"
  exit 0
fi

if [ -f /etc/debian_version ]; then
  sudo apt-get update
  # Try common Java package names for different Debian/Ubuntu versions
  if sudo apt-get install -y openjdk-11-jdk openjdk-11-jre-headless; then
    JAVA_HOME_CAND="/usr/lib/jvm/java-11-openjdk-amd64"
  elif sudo apt-get install -y openjdk-17-jre-headless openjdk-17-jdk; then
    JAVA_HOME_CAND="/usr/lib/jvm/java-17-openjdk-amd64"
  elif sudo apt-get install -y openjdk-21-jre-headless openjdk-21-jdk; then
    JAVA_HOME_CAND="/usr/lib/jvm/java-21-openjdk-amd64"
  elif sudo apt-get install -y default-jre default-jdk; then
    # Attempt to find the default Java home
    JAVA_HOME_CAND=$(dirname $(dirname $(readlink -f $(which java))))
  else
    echo "⚠️ Nenhum pacote OpenJDK encontrado. Por favor instale manualmente" >&2
    exit 1
  fi
  echo "✅ OpenJDK instalado"
  echo "export JAVA_HOME=${JAVA_HOME_CAND}" >> ~/.bashrc
  echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc
  echo "✅ OpenJDK 11 instalado"
  echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" >> ~/.bashrc
  echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc
  echo "✅ OpenJDK 11 instalado"
  echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" >> ~/.bashrc
  echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc
elif [ -f /etc/redhat-release ] || [ -f /etc/centos-release ]; then
  sudo yum install -y java-11-openjdk-devel || sudo yum install -y java-17-openjdk-devel
  echo "✅ OpenJDK instalado"
  if sudo yum install -y java-11-openjdk-devel; then
    JAVA_HOME_CAND="/usr/lib/jvm/java-11-openjdk"
  elif sudo yum install -y java-17-openjdk-devel; then
    JAVA_HOME_CAND="/usr/lib/jvm/java-17-openjdk"
  else
    echo "⚠️ Falha ao instalar JDK via yum. Instale manualmente." >&2
    exit 1
  fi
  echo "✅ OpenJDK instalado"
  echo "export JAVA_HOME=${JAVA_HOME_CAND}" >> ~/.bashrc
  echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc
else
  echo "⚠️ Sistema não reconhecido. Por favor instale OpenJDK 11 manualmente." >&2
  exit 1
fi

echo "✅ Finalizado. Reinicie o terminal para ativar JAVA_HOME (ou rode: source ~/.bashrc)"
