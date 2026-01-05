# Configuração de Codespace / Copilot Space (guia rápido)

Este documento mostra como configurar um Codespace (ou Copilot Space) para que o Copilot tenha o contexto e as permissões necessárias para operar com autonomia no repositório sem depender do seu ambiente local.

1) Escolha entre Codespace vs Copilot Space
- Codespaces: ambiente completo (container) com todos os dev tools instalados. Útil para rodar o projeto e testes localmente na nuvem.
- Copilot Spaces: área colaborativa que expande o Copilot com fluxo de trabalho para automações. Use quando quiser integração com Copilot e ferramentas internas.

2) Arquivos adicionados neste repo
- `.devcontainer/devcontainer.json` — ambiente predefinido para Codespaces com Node 22, extensões e postCreateCommand para instalar dependências.
- `docs/MCP_SETUP.md` — já presente; use para rodar o GitHub MCP Server local se quiser que Copilot se integre com toolsets.

3) Permissões e variáveis secretas necessárias
- PAT (Personal Access Token): preferível criar um token com escopos mínimos:
  - `repo` (read/write) — para criar/atualizar PRs, issues e commits
  - `workflow` — para workflow runs se necessário
  - `codespace` (ou codespaces) — (se disponível) para gerenciar Codespaces
  - `admin:repo_hook` — (opcional) para webhooks
  - `read:user` ou `user` — (opcional) se precisar de detalhes do usuário

- Use os Secrets do GitHub: No repo vá em Settings → Secrets → Codespaces (para segredo no Codespace) e em Settings → Secrets → Actions (para workflows). Defina `GITHUB_MCP_PAT` e `GEMINI_API_KEY` (se necessário) entre outros.

4) Iniciando um Codespace (passo-a-passo)
1. Abra o repositório no GitHub
2. Clique "Code" → "Codespaces" → "New codespace"
3. Selecione a branch desejada (ex.: `main`) e aguarde o ambiente iniciar (pode demorar alguns minutos)
4. O `postCreateCommand` do `.devcontainer` instalará dependências automaticamente
5. Configure variáveis de ambiente (se não usou Secrets): abra o terminal do Codespace e `export` as variáveis necessárias ou use `codespaces` secrets

6) Testando PR creation (diagnóstico)
- Instale `gh` (se não estiver): https://cli.github.com/
- Em um Codespace (ou local com gh), configure o PAT no ambiente ou use `gh auth login --with-token` com a variável `GITHUB_MCP_PAT`.
- Teste com o script de diagnóstico adicionado ao repositório:

```bash
# Exemplo (set a variável):
export GITHUB_MCP_PAT=ghp_xxx
./scripts/test-pr-creation.sh
```

O script irá automaticamente criar uma branch temporária, criar um commit de teste, empurrar o branch e abrir um PR contra `main`. Se falhar, analise os erros exibidos:
- `gh auth login` falhará se o token estiver incorreto
- `git push` falhará se PAT não tiver `repo` escopo
- `gh pr create` falhará se os `pull_request` scope estiver ausente ou se as branch protections impederem pushes/merges


5) Habilitando o Copilot para atuar no Codespace com permissões
- Configure um PAT com escopos mencionados acima e guarde no Secrets do Codespace (não comite o token).
- No Codespace, utilize a extensão do Copilot e conecte ao MCP local via `docs/MCP_SETUP.md` para garantir toolsets e scopes.

6) Melhor prática de segurança
- Prefira OAuth apps/configurações em vez de PAT para produção.
- Habilite `GITHUB_READ_ONLY=1` por padrão em códigos de comunidade e desenvolvimento compartilhado.
- Use um token rotativo e armazene em um Secret Manager (GitHub/Cloud Provider).

7) Checklist rápido para devs
- [ ] Criar Codespace a partir do repositório
- [ ] Adicionar Secrets (GITHUB_MCP_PAT e GEMINI_API_KEY)
- [ ] Testar `npm ci` e `npm run dev`
- [ ] Rodar `npm run test:run` para garantir que environment está OK

8) Problemas comuns
- Erro ao rodar `npm ci`: ajuste `node` version no devcontainer
- Tokens inválidos: atualize `GITHUB_MCP_PAT` nos Secrets

9) Dicas de troubleshooting se o agente não conseguir abrir PRs
- Verifique se o PAT tem os escopos `repo`, `pull_request`, e `workflow` (se necessário). Em organizações onde SAML SSO é usado, confirme que o token foi concedido para a organização.
- Confirme se o user/token tem permissões de `Write` no repositório através de `Settings -> Collaborators` ou membro do time com permissões adequadas.
- Verifique branch protection rules: se `main` estiver protegido, o agente deve criar um novo branch e abrir PR (push direto agora não funcionará). Teste com o script `scripts/test-pr-creation.sh`.
- Confira se há restrições de third-party access/Apps na organização (Settings → Third-party access) — apps e PATs podem ser restritos e impedir operações do agente.
- Se o agente estiver em Copilot Space (ou running under a service account), confirme que o Copilot Space tem o token associado ou que a sessão foi autorizada via OAuth.
- Logs: se usar MCP Server, certifique-se que `GITHUB_TOOLSETS` habilita `pull_requests` e `repos` e que `GITHUB_READ_ONLY` não está ativado.

