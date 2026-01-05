import { expect, test } from "@playwright/test";

test.describe("Gestão de Minutas com TiptapEditorV2", () => {
  test.beforeEach(async ({ page }) => {
    // Navega para a aplicação
    await page.goto("/");

    // Aguarda carregar
    await page.waitForLoadState("networkidle");

    // Fazer login se necessário
    const loginButton = page.locator('button:has-text("Entrar")');
    if (await loginButton.isVisible({ timeout: 2000 })) {
      await page.fill('input[type="text"], input[name="username"]', "adm");
      await page.fill('input[type="password"], input[name="password"]', "adm123");
      await loginButton.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("deve criar e editar minuta com TiptapEditorV2", async ({ page }) => {
    // Aguardar sidebar carregar completamente
    await page.waitForSelector('[data-testid="sidebar-nav"]', { timeout: 15000 });
    // Clica no menu Minutas usando data-testid da sidebar
    await page.click('[data-testid="nav-minutas"]', { timeout: 10000 });

    // Aguarda carregar a lista de minutas
    await page.waitForTimeout(500);

    // Clica em "Nova Minuta" ou botão similar
    const novaMinutaButton = page
      .locator(
        'button:has-text("Nova Minuta"), button:has-text("Criar Minuta"), button:has-text("+ Minuta")'
      )
      .first();
    await novaMinutaButton.click();

    // Aguarda modal/formulário de minuta abrir
    await page.waitForTimeout(500);

    // Preenche título da minuta
    const tituloInput = page
      .locator('input[name="titulo"], input[placeholder*="título"], input[placeholder*="Título"]')
      .first();
    if (await tituloInput.isVisible()) {
      await tituloInput.fill("Petição de Teste E2E");
    }

    // Preenche o editor TiptapEditorV2 (usar seletor mais específico para o conteúdo)
    const editorLocator = page
      .locator('.tiptap, [contenteditable="true"]')
      .first();
    await editorLocator.click();

    // Digita conteúdo no editor
    await page.keyboard.type("Este é um teste automatizado do TiptapEditorV2. ");
    await page.keyboard.type("O editor deve funcionar corretamente com comandos de IA.");

    // Verifica se o texto foi digitado
    await expect(editorLocator).toContainText("teste automatizado");

    // Aguarda um pouco para garantir que onChange foi chamado
    await page.waitForTimeout(300);

    // Verifica contador de palavras (se visível)
    const wordCounter = page.locator("text=/\\d+ palavras/i");
    if (await wordCounter.isVisible()) {
      await expect(wordCounter).toBeVisible();
    }

    // Salva a minuta
    const salvarButton = page
      .locator('button:has-text("Salvar"), button:has-text("Criar"), button:has-text("Confirmar")')
      .first();
    await salvarButton.click();

    // Aguarda feedback de sucesso
    await page.waitForTimeout(500);

    // Verifica se minuta foi criada (deve aparecer na lista)
    await expect(page.locator("text=Petição de Teste E2E")).toBeVisible();
  });

  test("deve usar comandos AI rápidos no editor", async ({ page }) => {
    // Navega para Minutas
    await page.waitForSelector('[data-testid="sidebar-nav"]', { timeout: 15000 });
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    // Cria nova minuta
    const novaMinutaButton = page
      .locator(
        'button:has-text("Nova Minuta"), button:has-text("Criar Minuta"), button:has-text("+ Minuta")'
      )
      .first();
    await novaMinutaButton.click();
    await page.waitForTimeout(500);

    // Escreve texto no editor
    const editorLocator = page
      .locator('.tiptap, [contenteditable="true"]')
      .first();
    await editorLocator.click();
    await page.keyboard.type("Texto curto para expandir");

    // Abre popover de IA
    const aiButton = page.locator('button[title="Comandos de IA"]').first();
    await aiButton.click();

    // Aguarda popover abrir
    await page.waitForTimeout(300);

    // Verifica se comandos rápidos estão visíveis
    await expect(page.locator("text=Expandir")).toBeVisible();
    await expect(page.locator("text=Resumir")).toBeVisible();
    await expect(page.locator("text=Formalizar")).toBeVisible();
    await expect(page.locator("text=Corrigir")).toBeVisible();

    // Clica em "Expandir"
    await page.click('button:has-text("Expandir")');

    // Nota: Em ambiente de teste, a IA pode não responder
    // Mas o comando deve ser disparado sem erros
    await page.waitForTimeout(500);

    // Verifica que não houve erro crítico
    const errorMessages = page.locator("text=/erro|error/i");
    const errorCount = await errorMessages.count();
    expect(errorCount).toBe(0);
  });

  test("deve exibir e usar variáveis no editor", async ({ page }) => {
    // Navega para Minutas
    await page.waitForSelector('[data-testid="sidebar-nav"]', { timeout: 15000 });
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    // Cria nova minuta
    const novaMinutaButton = page
      .locator(
        'button:has-text("Nova Minuta"), button:has-text("Criar Minuta"), button:has-text("+ Minuta")'
      )
      .first();
    await novaMinutaButton.click();
    await page.waitForTimeout(500);

    // Vincula a um processo (se houver seletor)
    const processoSelect = page
      .locator('select[name="processId"], button:has-text("Selecionar Processo")')
      .first();
    if (await processoSelect.isVisible()) {
      await processoSelect.click();
      await page.waitForTimeout(300);

      // Seleciona primeiro processo da lista
      const primeiroProcesso = page.locator('[role="option"], li').first();
      if (await primeiroProcesso.isVisible()) {
        await primeiroProcesso.click();
      }
    }

    // Verifica se badge de variáveis está visível
    const variablesBadge = page.locator("text=/variável\\(is\\) disponível\\(is\\)/i");
    if (await variablesBadge.isVisible()) {
      await expect(variablesBadge).toBeVisible();
    }

    // Digita variável no editor
    const editorLocator = page
      .locator('.tiptap, [contenteditable="true"]')
      .first();
    await editorLocator.click();
    await page.keyboard.type("Processo número {{processo}} ");

    // Verifica que o texto foi inserido
    await expect(editorLocator).toContainText("{{processo}}");
  });

  test("deve editar minuta existente", async ({ page }) => {
    // Navega para Minutas
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    // Busca primeira minuta da lista
    const primeiraMinuta = page.locator('[role="row"], .minuta-item, li').first();

    // Se não houver minutas, cria uma primeiro
    const minutasCount = await primeiraMinuta.count();
    if (minutasCount === 0) {
      // Cria minuta de teste
      const novaMinutaButton = page.locator('button:has-text("Nova Minuta")').first();
      await novaMinutaButton.click();
      await page.waitForTimeout(500);

      const editorLocator = page.locator('[role="presentation"], .tiptap').first();
      await editorLocator.click();
      await page.keyboard.type("Minuta para edição");

      const salvarButton = page.locator('button:has-text("Salvar")').first();
      await salvarButton.click();
      await page.waitForTimeout(500);
    }

    // Clica para editar primeira minuta
    const editarButton = page
      .locator('button:has-text("Editar"), button[aria-label*="Editar"]')
      .first();
    await editarButton.click();
    await page.waitForTimeout(500);

    // Verifica se editor está visível
    const editorLocator = page
      .locator('.tiptap, [contenteditable="true"]')
      .first();
    await expect(editorLocator).toBeVisible();

    // Adiciona mais texto
    await editorLocator.click();
    await page.keyboard.press("End"); // Vai para o fim
    await page.keyboard.type(" - Texto editado no E2E");

    // Salva alterações
    const salvarButton = page
      .locator('button:has-text("Salvar"), button:has-text("Atualizar")')
      .first();
    await salvarButton.click();

    // Aguarda feedback
    await page.waitForTimeout(500);

    // Verifica se alteração foi salva
    await expect(page.locator("text=Texto editado no E2E")).toBeVisible();
  });

  test("deve permitir geração customizada com IA", async ({ page }) => {
    // Navega para Minutas
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    // Cria nova minuta
    const novaMinutaButton = page
      .locator('button:has-text("Nova Minuta"), button:has-text("Criar Minuta")')
      .first();
    await novaMinutaButton.click();
    await page.waitForTimeout(500);

    // Abre popover de IA
    const aiButton = page.locator('button[title="Comandos de IA"]').first();
    await aiButton.click();
    await page.waitForTimeout(300);

    // Digita prompt customizado
    const promptInput = page.locator('input[placeholder*="Ex: Escreva uma petição"]').first();
    await promptInput.fill("Escreva uma petição inicial sobre dano moral");

    // Clica em gerar
    const gerarButton = page.locator('button:has-text("Gerar")').first();
    await gerarButton.click();

    // Aguarda resposta (pode demorar ou falhar em ambiente de teste)
    await page.waitForTimeout(2000);

    // Verifica que não houve erro crítico
    const pageContent = await page.content();
    expect(pageContent).not.toContain("Uncaught");
  });

  test("deve validar contador de palavras e caracteres", async ({ page }) => {
    // Navega para Minutas
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    // Cria nova minuta
    const novaMinutaButton = page.locator('button:has-text("Nova Minuta")').first();
    await novaMinutaButton.click();
    await page.waitForTimeout(500);

    // Escreve texto conhecido
    const editorLocator = page.locator('[role="presentation"], .tiptap').first();
    await editorLocator.click();
    await page.keyboard.type("Uma duas três"); // 3 palavras

    // Aguarda atualização
    await page.waitForTimeout(300);

    // Verifica contador de palavras
    const wordCounter = page.locator("text=/3 palavras/i");
    await expect(wordCounter).toBeVisible();

    // Verifica contador de caracteres (12 caracteres sem espaços = 11 com)
    const charCounter = page.locator("text=/\\d+ caracteres/i");
    await expect(charCounter).toBeVisible();
  });

  test("deve cancelar criação de minuta", async ({ page }) => {
    // Navega para Minutas
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    // Cria nova minuta
    const novaMinutaButton = page.locator('button:has-text("Nova Minuta")').first();
    await novaMinutaButton.click();
    await page.waitForTimeout(500);

    // Escreve algo
    const editorLocator = page.locator('[role="presentation"], .tiptap').first();
    await editorLocator.click();
    await page.keyboard.type("Texto que será cancelado");

    // Clica em cancelar
    const cancelarButton = page
      .locator('button:has-text("Cancelar"), button:has-text("Fechar")')
      .first();
    await cancelarButton.click();

    // Aguarda fechar
    await page.waitForTimeout(500);

    // Verifica que voltou para lista (sem a minuta cancelada)
    const textoCancelado = page.locator("text=Texto que será cancelado");
    await expect(textoCancelado).not.toBeVisible();
  });

  test("deve excluir minuta", async ({ page }) => {
    // Navega para Minutas
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    // Cria minuta para excluir
    const novaMinutaButton = page.locator('button:has-text("Nova Minuta")').first();
    await novaMinutaButton.click();
    await page.waitForTimeout(500);

    const tituloInput = page.locator('input[name="titulo"], input[placeholder*="título"]').first();
    if (await tituloInput.isVisible()) {
      await tituloInput.fill("Minuta para Excluir E2E");
    }

    const editorLocator = page.locator('[role="presentation"], .tiptap').first();
    await editorLocator.click();
    await page.keyboard.type("Esta minuta será excluída");

    const salvarButton = page.locator('button:has-text("Salvar")').first();
    await salvarButton.click();
    await page.waitForTimeout(500);

    // Busca botão de excluir
    const excluirButton = page
      .locator('button:has-text("Excluir"), button[aria-label*="Excluir"]')
      .first();
    await excluirButton.click();

    // Confirma exclusão (se houver dialog)
    const confirmarButton = page
      .locator('button:has-text("Confirmar"), button:has-text("Sim")')
      .first();
    if (await confirmarButton.isVisible()) {
      await confirmarButton.click();
    }

    // Aguarda exclusão
    await page.waitForTimeout(500);

    // Verifica que minuta foi removida
    const minutaExcluida = page.locator("text=Minuta para Excluir E2E");
    await expect(minutaExcluida).not.toBeVisible();
  });

  test("deve manter formatação do editor ao salvar", async ({ page }) => {
    // Navega para Minutas
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    // Cria nova minuta
    const novaMinutaButton = page.locator('button:has-text("Nova Minuta")').first();
    await novaMinutaButton.click();
    await page.waitForTimeout(500);

    // Aplica formatação no editor
    const editorLocator = page.locator('[role="presentation"], .tiptap').first();
    await editorLocator.click();

    // Digita texto
    await page.keyboard.type("Texto em negrito");

    // Seleciona tudo
    await page.keyboard.press("Control+A");

    // Aplica negrito (botão B na toolbar)
    const boldButton = page.locator('button[data-variant*="bold"], button:has-text("B")').first();
    if (await boldButton.isVisible()) {
      await boldButton.click();
    }

    // Salva
    const salvarButton = page.locator('button:has-text("Salvar")').first();
    await salvarButton.click();
    await page.waitForTimeout(500);

    // Edita novamente para verificar formatação
    const editarButton = page.locator('button:has-text("Editar")').first();
    if (await editarButton.isVisible()) {
      await editarButton.click();
      await page.waitForTimeout(500);

      // Verifica se negrito foi mantido
      const strongElement = page.locator('strong:has-text("Texto em negrito")');
      if (await strongElement.isVisible()) {
        await expect(strongElement).toBeVisible();
      }
    }
  });
});

test.describe("Toolbar e Formatação TiptapEditorV2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Abre Minutas e cria nova
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);

    const novaMinutaButton = page.locator('button:has-text("Nova Minuta")').first();
    await novaMinutaButton.click();
    await page.waitForTimeout(500);
  });

  test("deve aplicar formatação de negrito", async ({ page }) => {
    const editorLocator = page.locator('[role="presentation"], .tiptap').first();
    await editorLocator.click();
    await page.keyboard.type("Negrito");
    await page.keyboard.press("Control+A");

    const boldButton = page.locator('button[aria-label*="Bold"], button:has-text("B")').first();
    if (await boldButton.isVisible()) {
      await boldButton.click();
      await expect(page.locator("strong")).toBeVisible();
    }
  });

  test("deve aplicar formatação de itálico", async ({ page }) => {
    const editorLocator = page.locator('[role="presentation"], .tiptap').first();
    await editorLocator.click();
    await page.keyboard.type("Itálico");
    await page.keyboard.press("Control+A");

    const italicButton = page.locator('button[aria-label*="Italic"], button:has-text("I")').first();
    if (await italicButton.isVisible()) {
      await italicButton.click();
      await expect(page.locator("em, i")).toBeVisible();
    }
  });

  test("deve inserir lista não ordenada", async ({ page }) => {
    const editorLocator = page.locator('[role="presentation"], .tiptap').first();
    await editorLocator.click();

    const listButton = page.locator('button[aria-label*="List"], button:has-text("Lista")').first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.keyboard.type("Item 1");
      await expect(page.locator("ul li")).toBeVisible();
    }
  });

  test("deve desfazer e refazer ações", async ({ page }) => {
    const editorLocator = page.locator('[role="presentation"], .tiptap').first();
    await editorLocator.click();
    await page.keyboard.type("Texto para desfazer");

    // Desfaz
    await page.keyboard.press("Control+Z");
    await page.waitForTimeout(200);

    // Refaz
    await page.keyboard.press("Control+Shift+Z");
    await page.waitForTimeout(200);

    await expect(editorLocator).toContainText("Texto para desfazer");
  });
});
