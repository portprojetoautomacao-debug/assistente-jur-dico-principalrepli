
import { test, expect } from '@playwright/test';

test.describe('Fluxo Todoist e Processos', () => {
  test.skip('deve criar tarefas no Todoist ao adicionar um novo processo', async ({ page }) => {
    // 1. Mock da API do Todoist
    await page.route('https://api.todoist.com/rest/v2/tasks', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        
        // Verificar se a tarefa criada tem os dados corretos
        if (body.content.includes('Processo 1234567-89.2024.8.09.0000')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'task_123',
              content: body.content,
              description: body.description,
              due: { string: body.due_string, date: '2024-12-31' },
              priority: body.priority
            })
          });
          return;
        }
      }
      await route.continue();
    });

    // 2. Navegar para a página de Processos
    await page.goto('/');
    // Assumindo que há navegação ou estamos na home e vamos para CRM
    // Se não houver link direto, vamos tentar navegar via URL ou botão
    // O Dashboard tem um DataManager, mas o ProcessCRM é o componente principal
    // Vamos assumir que a rota é /processos ou que clicamos no menu
    
    // Simular clique no menu se necessário (ajustar conforme navegação real)
    const processosLink = page.getByRole('button', { name: /processos/i }).first();
    if (await processosLink.isVisible()) {
      await processosLink.click();
    } else {
      // Tentar ir direto se a rota existir (ajustar conforme App.tsx)
      // Por enquanto, vamos assumir que estamos na view correta ou o botão "Novo Processo" está visível
    }

    // 3. Abrir modal de Novo Processo
    await page.getByRole('button', { name: 'Novo Processo' }).click();

    // 4. Preencher formulário
    await page.getByLabel('Número CNJ').fill('1234567-89.2024.8.09.0000');
    await page.getByLabel('Título do Processo').fill('Ação de Teste E2E');
    await page.getByLabel('Autor').fill('João da Silva');
    await page.getByLabel('Réu').fill('Empresa X');

    // 5. Salvar
    // Vamos interceptar a promessa da requisição para garantir que ela aconteça
    const todoistRequestPromise = page.waitForRequest(request => 
      request.url().includes('api.todoist.com/rest/v2/tasks') && 
      request.method() === 'POST'
    );

    await page.getByRole('button', { name: 'Adicionar Processo' }).click();

    // 6. Verificar se a requisição foi feita
    const request = await todoistRequestPromise;
    const postData = request.postDataJSON();
    
    expect(postData.content).toContain('Processo 1234567-89.2024.8.09.0000');
    expect(postData.priority).toBe(4); // Prioridade urgente para processos
    
    // 7. Verificar feedback na UI
    await expect(page.getByText('Processo adicionado com sucesso')).toBeVisible();
  });
});
