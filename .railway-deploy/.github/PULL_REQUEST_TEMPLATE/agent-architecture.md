# Pull Request: Arquitetura de Agentes - Atualização

Resumo do objetivo
- Atualizar / Documentar a arquitetura dos agentes (Harvey, Justin-e, etc.) para o repositório.

O que está sendo alterado
- Arquivos de configuração do MCP / Codespace / Devcontainer
- Documentação (`docs/TODOS_OS_15_AGENTES.md`, `docs/AGENTS_SYSTEM.md`)
- Possível configuração de secrets e template de PRs

Checklist de revisão
- [ ] Validar `devcontainer.json` para Codespaces
- [ ] Validar `docs/MCP_SETUP.md` e orientações de segurança
- [ ] Verificar se nenhum segredo foi comitado
- [ ] Verificar se `GITHUB_TOOLSETS` e permissões de repo estão adequadas
- [ ] Realizar checagem de lint + test: `npm run lint && npm run test:run`

Notas adicionais
- Este PR se destina a harmonizar a configuração para facilitar o trabalho do Copilot e dos 15 agentes autônomos do repositório. Não agregar novas funcionalidades sem aprovação humana.
