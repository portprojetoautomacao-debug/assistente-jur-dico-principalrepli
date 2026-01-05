# Configuração do Catálogo CI/CD
# Este arquivo configura o projeto como um catálogo de componentes CI/CD

# Para habilitar o catálogo:
# 1. No GitLab: Settings > General > Visibility, project features, permissions
# 2. Ativar "CI/CD Catalog project"
# 3. Criar uma release com tag semântica (ex: 1.0.0)

# Componentes publicados no catálogo:
# - security-component: Auditoria de segurança abrangente
# - testing-component: Suite completa de testes
# - deployment-component: Deployment multi-plataforma
# - monitoring-component: Monitoramento de performance

# Para usar em outros projetos:
# include:
#   - component: $CI_SERVER_FQDN/assistente-juridico-p/templates/security/security-component@~latest
#     inputs:
#       audit_level: "standard"

# Tags suportadas:
# - latest: Última versão estável
# - 1.x.x: Versão major específica
# - 1.2.x: Versão minor específica
# - 1.2.3: Versão exata

# Exemplo de uso com versão específica:
# include:
#   - component: $CI_SERVER_FQDN/assistente-juridico-p/templates/security/security-component@1.0.0