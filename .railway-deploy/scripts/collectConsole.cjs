const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:4175';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const messages = [];

  page.on('console', (msg) => {
    messages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.error('[ERROR]', msg.text());
    } else if (msg.type() === 'warning') {
      console.warn('[WARN]', msg.text());
    } else {
      console.log('[LOG]', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error('[PAGE ERROR]', err);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('Page loaded:', url);
    // Wait a bit for runtime console messages
    await page.waitForTimeout(3000);
    const title = await page.title();
    console.log('Title:', title);
  } catch (err) {
    console.error('Navigation error:', err);
  } finally {
    await browser.close();
    // Summary
    console.log('Collected messages:', JSON.stringify(messages, null, 2));
    const errors = messages.filter(m => m.type === 'error');
    process.exit(errors.length > 0 ? 1 : 0);
  }
})();
