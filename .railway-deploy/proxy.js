import { createServer } from 'node:http';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

const server = createServer((req, res) => {
  // Basic routing for GitHub runtime wrapper
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'GitHub Runtime Wrapper Active',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message: 'Endpoint not available in wrapper mode'
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 GitHub Runtime Wrapper listening on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});