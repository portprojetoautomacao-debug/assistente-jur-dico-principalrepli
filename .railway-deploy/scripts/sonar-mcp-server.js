#!/usr/bin/env node

/**
 * SonarQube MCP Server
 * Servidor Model Context Protocol para integração com SonarCloud/SonarQube
 */

const https = require('https');
const { URL } = require('url');

// Configurações do SonarCloud
const SONARCLOUD_URL = process.env.SONARQUBE_URL || 'https://sonarcloud.io';
const SONARQUBE_TOKEN = process.env.SONARQUBE_TOKEN || '';
const ORGANIZATION = process.env.SONARQUBE_ORGANIZATION || '';
const PROJECT_KEY = process.env.SONARQUBE_PROJECT_KEY || '';

// Verificar configuração
if (!SONARQUBE_TOKEN) {
  console.error('[SonarQube MCP] ERRO: SONARQUBE_TOKEN não configurado');
  process.exit(1);
}

if (!PROJECT_KEY) {
  console.error('[SonarQube MCP] ERRO: SONARQUBE_PROJECT_KEY não configurado');
  process.exit(1);
}

console.error('[SonarQube MCP] Iniciando servidor...');
console.error('[SonarQube MCP] URL:', SONARCLOUD_URL);
console.error('[SonarQube MCP] Organization:', ORGANIZATION);
console.error('[SonarQube MCP] Project:', PROJECT_KEY);

/**
 * Fazer requisição ao SonarCloud API
 */
function sonarRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SONARCLOUD_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SONARQUBE_TOKEN}`,
        'Accept': 'application/json',
      },
    };

    console.error('[SonarQube MCP] Request:', url.toString());

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Erro ao parsear resposta JSON'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Listar issues do projeto
 */
async function listIssues(severities = ['BLOCKER', 'CRITICAL', 'MAJOR']) {
  try {
    const params = {
      componentKeys: PROJECT_KEY,
      severities: severities.join(','),
      statuses: 'OPEN,CONFIRMED,REOPENED',
      ps: 100, // Page size
    };

    if (ORGANIZATION) {
      params.organization = ORGANIZATION;
    }

    const result = await sonarRequest('/api/issues/search', params);
    return result;
  } catch (error) {
    console.error('[SonarQube MCP] Erro ao listar issues:', error.message);
    throw error;
  }
}

/**
 * Buscar métricas do projeto
 */
async function getMetrics() {
  try {
    const params = {
      component: PROJECT_KEY,
      metricKeys: 'bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,sqale_index',
    };

    if (ORGANIZATION) {
      params.organization = ORGANIZATION;
    }

    const result = await sonarRequest('/api/measures/component', params);
    return result;
  } catch (error) {
    console.error('[SonarQube MCP] Erro ao buscar métricas:', error.message);
    throw error;
  }
}

/**
 * Protocolo MCP - JSON-RPC 2.0
 */
async function handleRequest(request) {
  const { method, params = {}, id } = request;

  console.error('[SonarQube MCP] Recebido:', method);

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '0.1.0',
            serverInfo: {
              name: 'sonarqube-mcp',
              version: '1.0.0',
            },
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'list_issues',
                description: 'Listar issues do SonarCloud',
                inputSchema: {
                  type: 'object',
                  properties: {
                    severities: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Severidades: BLOCKER, CRITICAL, MAJOR, MINOR, INFO',
                    },
                  },
                },
              },
              {
                name: 'get_metrics',
                description: 'Obter métricas do projeto',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
            ],
          },
        };

      case 'tools/call':
        const toolName = params.name;
        const toolArgs = params.arguments || {};

        if (toolName === 'list_issues') {
          const issues = await listIssues(toolArgs.severities);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(issues, null, 2),
                },
              ],
            },
          };
        }

        if (toolName === 'get_metrics') {
          const metrics = await getMetrics();
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(metrics, null, 2),
                },
              ],
            },
          };
        }

        throw new Error(`Ferramenta desconhecida: ${toolName}`);

      default:
        throw new Error(`Método desconhecido: ${method}`);
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message,
      },
    };
  }
}

/**
 * Ler entrada via stdin e processar requisições
 */
let buffer = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', async (chunk) => {
  buffer += chunk;

  // Processar linhas completas (JSON-RPC over stdio)
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const request = JSON.parse(line);
      const response = await handleRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      console.error('[SonarQube MCP] Erro:', error.message);
    }
  }
});

process.stdin.on('end', () => {
  console.error('[SonarQube MCP] Encerrando...');
  process.exit(0);
});

// Manter processo ativo
process.stdin.resume();

console.error('[SonarQube MCP] Servidor pronto!');
