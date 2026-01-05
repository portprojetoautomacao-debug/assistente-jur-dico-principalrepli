# Configuração da API DataJud

## Visão Geral

O **DataJud** é a Base Nacional de Dados do Poder Judiciário, mantida pelo Conselho Nacional de Justiça (CNJ). Através da API Pública do DataJud, é possível consultar informações oficiais sobre processos judiciais de todo o Brasil.

Este documento explica como configurar a integração com a API DataJud no Assistente Jurídico PJe.

## Pré-requisitos

- Conta no portal do DataJud (gratuita)
- API Key do DataJud (gratuita)
- Número CNJ do processo que deseja consultar

## Como Obter sua API Key

### Passo 1: Acesse o Portal do DataJud

Acesse o site oficial da API Pública do DataJud:
- **URL**: https://www.cnj.jus.br/sistemas/datajud/api-publica/

### Passo 2: Cadastre-se no Portal

1. Clique em "Cadastrar" ou "Solicitar Acesso"
2. Preencha o formulário de cadastro com suas informações
3. Aguarde a confirmação por e-mail
4. Ative sua conta através do link enviado por e-mail

### Passo 3: Solicite sua API Key

1. Faça login no portal do DataJud
2. Acesse a seção "Minhas Credenciais" ou "API Keys"
3. Clique em "Gerar Nova API Key"
4. Copie a API Key gerada (você precisará dela para configurar o sistema)

⚠️ **IMPORTANTE**: Guarde sua API Key em local seguro. Ela será mostrada apenas uma vez.

## Configuração no Sistema

### Passo 1: Localize o arquivo .env

No diretório raiz do projeto, você encontrará um arquivo chamado `.env.example`. 

Se o arquivo `.env` não existir:
```bash
cp .env.example .env
```

### Passo 2: Configure a API Key

Abra o arquivo `.env` e adicione sua API Key do DataJud:

```env
# DataJud API Configuration
VITE_DATAJUD_API_KEY=sua-api-key-aqui
```

**Exemplo:**
```env
VITE_DATAJUD_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901
```

### Passo 3: Reinicie o Servidor de Desenvolvimento

Após adicionar a API Key, reinicie o servidor:

```bash
npm run dev
```

## Usando a Consulta DataJud

### Na Interface do Sistema

1. Acesse o menu **Consultas** na barra lateral
2. Selecione a aba **Datajud**
3. Insira o número CNJ do processo (formato: NNNNNNN-DD.AAAA.J.TR.OOOO)
   - Exemplo: `5022377-13.2024.8.13.0223`
4. O sistema irá detectar automaticamente o tribunal baseado no número CNJ
5. Clique em **Consultar**

### Resultado da Consulta

O sistema retornará as seguintes informações:

- **Número do Processo**: Número CNJ completo
- **Tribunal**: Tribunal de origem
- **Classe**: Tipo de ação judicial
- **Assuntos**: Matérias do processo
- **Data de Ajuizamento**: Data de distribuição
- **Órgão Julgador**: Vara ou câmara responsável
- **Movimentações**: Histórico completo de andamentos processuais

## Tribunais Suportados

A integração suporta os seguintes tribunais:

| Sigla | Nome do Tribunal |
|-------|-----------------|
| TJSP  | Tribunal de Justiça de São Paulo |
| TJRJ  | Tribunal de Justiça do Rio de Janeiro |
| TJMG  | Tribunal de Justiça de Minas Gerais |
| TJRS  | Tribunal de Justiça do Rio Grande do Sul |
| TJPR  | Tribunal de Justiça do Paraná |
| TJSC  | Tribunal de Justiça de Santa Catarina |
| TRF1  | Tribunal Regional Federal da 1ª Região |
| TRF2  | Tribunal Regional Federal da 2ª Região |
| TRF3  | Tribunal Regional Federal da 3ª Região |
| TRF4  | Tribunal Regional Federal da 4ª Região |
| TRT2  | Tribunal Regional do Trabalho da 2ª Região |
| TST   | Tribunal Superior do Trabalho |
| STJ   | Superior Tribunal de Justiça |
| STF   | Supremo Tribunal Federal |

## Formato do Número CNJ

O número CNJ segue o padrão:

```
NNNNNNN-DD.AAAA.J.TR.OOOO
```

Onde:
- **NNNNNNN**: Número sequencial do processo (7 dígitos)
- **DD**: Dígitos verificadores (2 dígitos)
- **AAAA**: Ano de distribuição (4 dígitos)
- **J**: Segmento da Justiça (1 dígito)
  - 1 = Supremo Tribunal Federal
  - 2 = Conselho Nacional de Justiça
  - 3 = Superior Tribunal de Justiça
  - 4 = Justiça Federal
  - 5 = Justiça do Trabalho
  - 6 = Justiça Eleitoral
  - 7 = Justiça Militar da União
  - 8 = Justiça Estadual
  - 9 = Justiça Militar Estadual
- **TR**: Tribunal (2 dígitos) - identifica o tribunal específico
- **OOOO**: Órgão de origem (4 dígitos)

**Exemplos válidos:**
- `5022377-13.2024.8.13.0223` (TJMG - Justiça Estadual de MG)
- `0001234-56.2023.5.02.0001` (TRT2 - Justiça do Trabalho de SP)
- `0000123-45.2024.4.01.0000` (TRF1 - Justiça Federal da 1ª Região)

## Tratamento de Erros

### API Key Não Configurada

Se a API Key não estiver configurada, o sistema exibirá:
```
API Key do DataJud não configurada. Configure VITE_DATAJUD_API_KEY no arquivo .env
```

**Solução**: Configure a API Key conforme instruções acima.

### API Key Inválida

Se a API Key estiver incorreta ou expirada:
```
API Key inválida ou sem permissão. Verifique suas credenciais no site do DataJud
```

**Solução**: 
1. Verifique se copiou a API Key corretamente
2. Gere uma nova API Key no portal do DataJud
3. Atualize o arquivo `.env`

### Processo Não Encontrado

Se o processo não existir no tribunal:
```
Processo não encontrado no tribunal especificado
```

**Possíveis causas**:
- Número CNJ digitado incorretamente
- Processo ainda não indexado no DataJud
- Processo em segredo de justiça (não disponível via API)

### Formato CNJ Inválido

```
Número de processo CNJ inválido. Use o formato: NNNNNNN-DD.AAAA.J.TR.OOOO
```

**Solução**: Verifique se o número está no formato correto com todos os dígitos e separadores.

### Tribunal Não Suportado

```
Tribunal não suportado ou não reconhecido
```

**Solução**: Verifique a lista de tribunais suportados acima. Alguns tribunais menores podem não estar disponíveis na API pública.

## Limitações e Observações

### Dados Disponíveis

- ✅ **Disponível**: Processos públicos de tribunais participantes
- ❌ **Não disponível**: Processos em segredo de justiça
- ❌ **Não disponível**: Processos de tribunais não participantes do DataJud

### Performance

- A consulta pode levar alguns segundos dependendo da carga do servidor do CNJ
- Timeout padrão: 30 segundos
- Em caso de timeout, tente novamente após alguns minutos

### Atualizações

- Os dados são atualizados periodicamente pelos tribunais
- Pode haver um delay entre a movimentação real e sua disponibilização na API
- Recomenda-se verificar diretamente no site do tribunal para informações críticas

## Segurança

### Boas Práticas

1. **Nunca compartilhe sua API Key** com outras pessoas
2. **Não commite o arquivo .env** no Git (já está no .gitignore)
3. **Use variáveis de ambiente** em produção
4. **Revogue e gere nova API Key** se suspeitar de comprometimento

### Armazenamento da API Key

- Em **desenvolvimento**: arquivo `.env` (não commitado)
- Em **produção**: variáveis de ambiente do servidor/plataforma
  - Render: Dashboard → Environment → Environment Variables
  - Vercel: Project Settings → Environment Variables
  - Heroku: Settings → Config Vars

## Recursos Adicionais

### Documentação Oficial

- **Portal DataJud**: https://www.cnj.jus.br/sistemas/datajud/
- **API Pública**: https://www.cnj.jus.br/sistemas/datajud/api-publica/
- **Tutorial PDF**: https://www.cnj.jus.br/wp-content/uploads/2023/05/tutorial-api-publica-datajud-beta.pdf
- **Wiki DataJud**: https://datajud-wiki.cnj.jus.br/

### Suporte

- **CNJ**: Entre em contato através do portal oficial do DataJud
- **Sistema**: Abra uma issue no repositório do projeto

## Changelog

### Versão 1.0.0 (2024)
- ✅ Integração inicial com API DataJud
- ✅ Suporte a 14 tribunais principais
- ✅ Validação automática de número CNJ
- ✅ Detecção automática de tribunal
- ✅ Tratamento completo de erros
- ✅ Interface integrada ao sistema

---

**Última atualização**: Novembro 2024  
**Mantido por**: Equipe de Desenvolvimento Assistente Jurídico PJe
