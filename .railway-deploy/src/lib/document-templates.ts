// Templates jurídicos para o editor de minutas
export interface DocumentTemplate {
  id: string;
  nome: string;
  tipo: "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";
  categoria: string;
  descricao: string;
  conteudo: string;
  variaveis: string[];
  tags: string[];
}

export const documentTemplates: DocumentTemplate[] = [
  // PETIÇÕES
  {
    id: "peticao-inicial-civel",
    nome: "Petição Inicial - Ação Cível",
    tipo: "peticao",
    categoria: "Cível",
    descricao: "Modelo de petição inicial para ações cíveis em geral",
    variaveis: [
      "juizo",
      "vara",
      "comarca",
      "estado",
      "autor.nome",
      "autor.nacionalidade",
      "autor.estadoCivil",
      "autor.profissao",
      "autor.cpf",
      "autor.rg",
      "autor.endereco",
      "autor.email",
      "reu.nome",
      "reu.endereco",
      "reu.cpf",
      "valor.causa",
      "advogado.nome",
      "advogado.oab",
    ],
    tags: ["petição inicial", "cível", "ação"],
    conteudo: `<h1 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{juizo}} VARA {{vara}} DA COMARCA DE {{comarca}}/{{estado}}</h1>

<p><br></p>

<p style="text-align: justify;"><strong>{{autor.nome}}</strong>, {{autor.nacionalidade}}, {{autor.estadoCivil}}, {{autor.profissao}}, portador(a) do RG nº {{autor.rg}} e inscrito(a) no CPF sob o nº {{autor.cpf}}, residente e domiciliado(a) na {{autor.endereco}}, endereço eletrônico {{autor.email}}, por seu advogado que esta subscreve (procuração anexa), com escritório profissional no endereço constante do timbre, onde recebe intimações, vem, respeitosamente, à presença de Vossa Excelência, propor a presente</p>

<h2 style="text-align: center;">AÇÃO DE [TIPO DA AÇÃO]</h2>

<p style="text-align: justify;">em face de <strong>{{reu.nome}}</strong>, [qualificação do réu], residente e domiciliado(a) na {{reu.endereco}}, inscrito(a) no CPF sob o nº {{reu.cpf}}, pelos fatos e fundamentos a seguir expostos.</p>

<h3>I - DOS FATOS</h3>

<p style="text-align: justify;">[Narrar os fatos de forma clara e cronológica]</p>

<h3>II - DO DIREITO</h3>

<p style="text-align: justify;">[Fundamentação jurídica - artigos de lei, jurisprudência, doutrina]</p>

<h3>III - DOS PEDIDOS</h3>

<p style="text-align: justify;">Ante o exposto, requer:</p>

<ol>
  <li>A citação do(a) réu(ré) para, querendo, contestar a presente ação, sob pena de revelia;</li>
  <li>[Pedidos específicos];</li>
  <li>A procedência total dos pedidos, condenando o(a) réu(ré) a [condenação pretendida];</li>
  <li>A condenação do(a) réu(ré) ao pagamento das custas processuais e honorários advocatícios;</li>
  <li>A produção de todas as provas admitidas em direito, especialmente a prova documental, testemunhal e pericial.</li>
</ol>

<p style="text-align: justify;">Dá-se à causa o valor de <strong>R$ {{valor.causa}}</strong> para fins fiscais.</p>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><br></p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  {
    id: "contestacao-civel",
    nome: "Contestação - Ação Cível",
    tipo: "peticao",
    categoria: "Cível",
    descricao: "Modelo de contestação para ações cíveis",
    variaveis: [
      "processo.numero",
      "autor.nome",
      "reu.nome",
      "advogado.nome",
      "advogado.oab",
      "comarca",
      "estado",
    ],
    tags: ["contestação", "cível", "defesa"],
    conteudo: `<h1 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO</h1>

<p style="text-align: center;"><strong>Processo nº {{processo.numero}}</strong></p>

<p><br></p>

<p style="text-align: justify;"><strong>{{reu.nome}}</strong>, já qualificado(a) nos autos da ação em epígrafe, por seu advogado que esta subscreve, vem, respeitosamente, à presença de Vossa Excelência, apresentar</p>

<h2 style="text-align: center;">CONTESTAÇÃO</h2>

<p style="text-align: justify;">à ação proposta por <strong>{{autor.nome}}</strong>, pelos fatos e fundamentos a seguir expostos.</p>

<h3>I - SÍNTESE DOS FATOS</h3>

<p style="text-align: justify;">[Resumo da ação proposta pela parte autora]</p>

<h3>II - PRELIMINARES</h3>

<p style="text-align: justify;">[Se houver preliminares a arguir: inépcia da inicial, ilegitimidade de parte, incompetência, etc.]</p>

<h3>III - DO MÉRITO</h3>

<p style="text-align: justify;">[Argumentação de mérito refutando os pedidos do autor]</p>

<h3>IV - DOS PEDIDOS</h3>

<p style="text-align: justify;">Ante o exposto, requer:</p>

<ol>
  <li>O acolhimento das preliminares arguidas, com a extinção do processo sem resolução do mérito;</li>
  <li>Caso assim não entenda Vossa Excelência, seja julgada TOTALMENTE IMPROCEDENTE a presente ação;</li>
  <li>A condenação da parte autora ao pagamento das custas processuais e honorários advocatícios;</li>
  <li>A produção de todas as provas admitidas em direito.</li>
</ol>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  {
    id: "manifestacao-simples",
    nome: "Manifestação Simples",
    tipo: "peticao",
    categoria: "Geral",
    descricao: "Manifestação processual simples",
    variaveis: [
      "processo.numero",
      "parte.nome",
      "advogado.nome",
      "advogado.oab",
      "comarca",
      "estado",
    ],
    tags: ["manifestação", "petição intercorrente"],
    conteudo: `<h1 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO</h1>

<p style="text-align: center;"><strong>Processo nº {{processo.numero}}</strong></p>

<p><br></p>

<p style="text-align: justify;"><strong>{{parte.nome}}</strong>, já qualificado(a) nos autos, por seu advogado que esta subscreve, vem, respeitosamente, à presença de Vossa Excelência, manifestar-se nos seguintes termos:</p>

<p style="text-align: justify;">[Conteúdo da manifestação]</p>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  // CONTRATOS
  {
    id: "contrato-honorarios",
    nome: "Contrato de Honorários Advocatícios",
    tipo: "contrato",
    categoria: "Honorários",
    descricao: "Contrato de prestação de serviços advocatícios",
    variaveis: [
      "cliente.nome",
      "cliente.cpf",
      "cliente.endereco",
      "advogado.nome",
      "advogado.oab",
      "advogado.cpf",
      "advogado.endereco",
      "servico.descricao",
      "honorarios.valor",
      "honorarios.forma",
      "data.assinatura",
      "cidade",
      "estado",
    ],
    tags: ["contrato", "honorários", "advocatício"],
    conteudo: `<h1 style="text-align: center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS</h1>

<p><br></p>

<p style="text-align: justify;">Pelo presente instrumento particular, de um lado:</p>

<p style="text-align: justify;"><strong>CONTRATANTE:</strong> {{cliente.nome}}, inscrito(a) no CPF sob o nº {{cliente.cpf}}, residente e domiciliado(a) na {{cliente.endereco}};</p>

<p style="text-align: justify;"><strong>CONTRATADO:</strong> {{advogado.nome}}, advogado(a), inscrito(a) na OAB/{{estado}} sob o nº {{advogado.oab}}, CPF nº {{advogado.cpf}}, com escritório profissional na {{advogado.endereco}};</p>

<p style="text-align: justify;">Têm entre si justo e contratado o seguinte:</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>

<p style="text-align: justify;">O presente contrato tem por objeto a prestação de serviços advocatícios consistentes em: {{servico.descricao}}.</p>

<h3>CLÁUSULA SEGUNDA - DOS HONORÁRIOS</h3>

<p style="text-align: justify;">Pelos serviços prestados, o(a) CONTRATANTE pagará ao(à) CONTRATADO(A) honorários advocatícios no valor de <strong>R$ {{honorarios.valor}}</strong>, a ser pago da seguinte forma: {{honorarios.forma}}.</p>

<h3>CLÁUSULA TERCEIRA - DAS DESPESAS</h3>

<p style="text-align: justify;">As despesas processuais, custas, emolumentos, diligências, cópias e demais gastos necessários à execução dos serviços correrão por conta exclusiva do(a) CONTRATANTE.</p>

<h3>CLÁUSULA QUARTA - DA VIGÊNCIA</h3>

<p style="text-align: justify;">O presente contrato vigorará até o trânsito em julgado da ação ou até a conclusão dos serviços contratados.</p>

<h3>CLÁUSULA QUINTA - DO FORO</h3>

<p style="text-align: justify;">Fica eleito o foro da Comarca de {{cidade}}/{{estado}} para dirimir quaisquer questões oriundas deste contrato.</p>

<p style="text-align: justify;">E, por estarem assim justos e contratados, firmam o presente em duas vias de igual teor.</p>

<p style="text-align: center;">{{cidade}}/{{estado}}, {{data.assinatura}}.</p>

<p><br></p>

<table style="width: 100%;">
  <tr>
    <td style="width: 50%; text-align: center;">
      _________________________________<br>
      <strong>CONTRATANTE</strong><br>
      {{cliente.nome}}
    </td>
    <td style="width: 50%; text-align: center;">
      _________________________________<br>
      <strong>CONTRATADO</strong><br>
      {{advogado.nome}}<br>
      OAB/{{estado}} nº {{advogado.oab}}
    </td>
  </tr>
</table>

<p><br></p>

<p style="text-align: center;"><strong>TESTEMUNHAS:</strong></p>

<table style="width: 100%;">
  <tr>
    <td style="width: 50%; text-align: center;">
      1. _________________________________<br>
      Nome:<br>
      CPF:
    </td>
    <td style="width: 50%; text-align: center;">
      2. _________________________________<br>
      Nome:<br>
      CPF:
    </td>
  </tr>
</table>`,
  },

  // PROCURAÇÕES
  {
    id: "procuracao-ad-judicia",
    nome: "Procuração Ad Judicia",
    tipo: "procuracao",
    categoria: "Procuração",
    descricao: "Procuração para representação judicial",
    variaveis: [
      "outorgante.nome",
      "outorgante.nacionalidade",
      "outorgante.estadoCivil",
      "outorgante.profissao",
      "outorgante.cpf",
      "outorgante.rg",
      "outorgante.endereco",
      "advogado.nome",
      "advogado.oab",
      "advogado.endereco",
      "cidade",
      "estado",
      "data",
    ],
    tags: ["procuração", "ad judicia", "mandato"],
    conteudo: `<h1 style="text-align: center;">PROCURAÇÃO AD JUDICIA</h1>

<p><br></p>

<p style="text-align: justify;"><strong>OUTORGANTE:</strong> {{outorgante.nome}}, {{outorgante.nacionalidade}}, {{outorgante.estadoCivil}}, {{outorgante.profissao}}, portador(a) do RG nº {{outorgante.rg}} e inscrito(a) no CPF sob o nº {{outorgante.cpf}}, residente e domiciliado(a) na {{outorgante.endereco}}.</p>

<p style="text-align: justify;"><strong>OUTORGADO:</strong> {{advogado.nome}}, advogado(a), inscrito(a) na OAB/{{estado}} sob o nº {{advogado.oab}}, com escritório profissional na {{advogado.endereco}}.</p>

<p style="text-align: justify;"><strong>PODERES:</strong> Pelo presente instrumento particular de procuração, o(a) OUTORGANTE nomeia e constitui seu(sua) bastante procurador(a) o(a) OUTORGADO(A) acima qualificado(a), a quem confere amplos poderes para o foro em geral, com a cláusula "ad judicia", podendo propor contra quem de direito as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhe, ainda, poderes especiais para confessar, desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente, podendo ainda substabelecer esta a outrem, com ou sem reservas de iguais poderes, dando tudo por bom, firme e valioso, especialmente para [ESPECIFICAR O OBJETO].</p>

<p style="text-align: center;">{{cidade}}/{{estado}}, {{data}}.</p>

<p><br></p>

<p style="text-align: center;">_________________________________<br>
<strong>{{outorgante.nome}}</strong><br>
CPF: {{outorgante.cpf}}</p>`,
  },

  {
    id: "procuracao-poderes-especiais",
    nome: "Procuração com Poderes Especiais",
    tipo: "procuracao",
    categoria: "Procuração",
    descricao: "Procuração com poderes especiais (art. 105 CPC)",
    variaveis: [
      "outorgante.nome",
      "outorgante.nacionalidade",
      "outorgante.estadoCivil",
      "outorgante.profissao",
      "outorgante.cpf",
      "outorgante.rg",
      "outorgante.endereco",
      "advogado.nome",
      "advogado.oab",
      "advogado.endereco",
      "cidade",
      "estado",
      "data",
    ],
    tags: ["procuração", "poderes especiais", "mandato"],
    conteudo: `<h1 style="text-align: center;">PROCURAÇÃO AD JUDICIA ET EXTRA<br>COM PODERES ESPECIAIS</h1>

<p><br></p>

<p style="text-align: justify;"><strong>OUTORGANTE:</strong> {{outorgante.nome}}, {{outorgante.nacionalidade}}, {{outorgante.estadoCivil}}, {{outorgante.profissao}}, portador(a) do RG nº {{outorgante.rg}} e inscrito(a) no CPF sob o nº {{outorgante.cpf}}, residente e domiciliado(a) na {{outorgante.endereco}}.</p>

<p style="text-align: justify;"><strong>OUTORGADO:</strong> {{advogado.nome}}, advogado(a), inscrito(a) na OAB/{{estado}} sob o nº {{advogado.oab}}, com escritório profissional na {{advogado.endereco}}.</p>

<p style="text-align: justify;"><strong>PODERES:</strong> Pelo presente instrumento particular de procuração, o(a) OUTORGANTE nomeia e constitui seu(sua) bastante procurador(a) o(a) OUTORGADO(A) acima qualificado(a), a quem confere amplos poderes para o foro em geral, com a cláusula "ad judicia et extra", podendo propor contra quem de direito as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhe, ainda, <strong>PODERES ESPECIAIS</strong> para:</p>

<ul>
  <li>Receber citação inicial (art. 105, CPC);</li>
  <li>Confessar (art. 105, CPC);</li>
  <li>Reconhecer a procedência do pedido (art. 105, CPC);</li>
  <li>Transigir (art. 105, CPC);</li>
  <li>Desistir (art. 105, CPC);</li>
  <li>Renunciar ao direito sobre o qual se funda a ação (art. 105, CPC);</li>
  <li>Receber e dar quitação (art. 105, CPC);</li>
  <li>Firmar compromisso (art. 105, CPC);</li>
  <li>Assinar declaração de hipossuficiência.</li>
</ul>

<p style="text-align: justify;">Podendo ainda substabelecer esta a outrem, com ou sem reservas de iguais poderes, dando tudo por bom, firme e valioso.</p>

<p style="text-align: center;">{{cidade}}/{{estado}}, {{data}}.</p>

<p><br></p>

<p style="text-align: center;">_________________________________<br>
<strong>{{outorgante.nome}}</strong><br>
CPF: {{outorgante.cpf}}</p>`,
  },

  // RECURSOS
  {
    id: "recurso-apelacao",
    nome: "Recurso de Apelação",
    tipo: "recurso",
    categoria: "Recursos",
    descricao: "Modelo de recurso de apelação cível",
    variaveis: [
      "processo.numero",
      "apelante.nome",
      "apelado.nome",
      "advogado.nome",
      "advogado.oab",
      "comarca",
      "estado",
    ],
    tags: ["recurso", "apelação", "segunda instância"],
    conteudo: `<h1 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO</h1>

<p style="text-align: center;"><strong>Processo nº {{processo.numero}}</strong></p>

<p><br></p>

<p style="text-align: justify;"><strong>{{apelante.nome}}</strong>, já qualificado(a) nos autos, por seu advogado que esta subscreve, inconformado(a) com a r. sentença de fls., vem, respeitosamente, à presença de Vossa Excelência, interpor o presente</p>

<h2 style="text-align: center;">RECURSO DE APELAÇÃO</h2>

<p style="text-align: justify;">em face de <strong>{{apelado.nome}}</strong>, com fundamento no art. 1.009 e seguintes do Código de Processo Civil, requerendo seja o presente recurso recebido e processado, com a remessa dos autos ao Egrégio Tribunal de Justiça do Estado de {{estado}}, onde espera seja dado provimento ao recurso, nos termos das razões anexas.</p>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>

<hr>

<h1 style="text-align: center;">RAZÕES DE APELAÇÃO</h1>

<p style="text-align: center;"><strong>Processo nº {{processo.numero}}</strong><br>
Apelante: {{apelante.nome}}<br>
Apelado(a): {{apelado.nome}}</p>

<h2 style="text-align: center;">EGRÉGIO TRIBUNAL DE JUSTIÇA DO ESTADO DE {{estado}}<br>COLENDA CÂMARA</h2>

<h3>I - DA TEMPESTIVIDADE</h3>

<p style="text-align: justify;">O presente recurso é tempestivo, tendo sido interposto dentro do prazo legal de 15 (quinze) dias úteis, nos termos do art. 1.003, §5º, do CPC.</p>

<h3>II - DO CABIMENTO</h3>

<p style="text-align: justify;">O recurso de apelação é cabível contra sentença, nos termos do art. 1.009 do CPC.</p>

<h3>III - DA SÍNTESE DOS FATOS E DA SENTENÇA</h3>

<p style="text-align: justify;">[Resumo dos fatos e do teor da sentença recorrida]</p>

<h3>IV - DAS RAZÕES PARA REFORMA</h3>

<p style="text-align: justify;">[Argumentação jurídica demonstrando os erros da sentença]</p>

<h3>V - DO PEDIDO</h3>

<p style="text-align: justify;">Ante o exposto, requer seja conhecido e provido o presente recurso, reformando-se a r. sentença recorrida para [especificar o pedido de reforma].</p>

<p style="text-align: justify;">Nestes termos,<br>Pede deferimento.</p>

<p style="text-align: center;">{{comarca}}/{{estado}}, [data].</p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  // PARECER
  {
    id: "parecer-juridico",
    nome: "Parecer Jurídico",
    tipo: "parecer",
    categoria: "Parecer",
    descricao: "Modelo de parecer jurídico",
    variaveis: [
      "cliente.nome",
      "assunto",
      "advogado.nome",
      "advogado.oab",
      "cidade",
      "estado",
      "data",
    ],
    tags: ["parecer", "consultoria", "opinião legal"],
    conteudo: `<h1 style="text-align: center;">PARECER JURÍDICO</h1>

<p><br></p>

<p><strong>CONSULENTE:</strong> {{cliente.nome}}</p>
<p><strong>ASSUNTO:</strong> {{assunto}}</p>
<p><strong>REFERÊNCIA:</strong> [Número de referência interno]</p>

<hr>

<h3>I - RELATÓRIO</h3>

<p style="text-align: justify;">Trata-se de consulta formulada por {{cliente.nome}}, acerca de {{assunto}}.</p>

<p style="text-align: justify;">[Narrar os fatos apresentados pelo consulente]</p>

<h3>II - DA QUESTÃO JURÍDICA</h3>

<p style="text-align: justify;">A questão jurídica a ser analisada consiste em:</p>

<p style="text-align: justify;">[Definir a(s) questão(ões) jurídica(s) a ser(em) respondida(s)]</p>

<h3>III - FUNDAMENTAÇÃO</h3>

<p style="text-align: justify;">[Análise jurídica completa com citação de legislação, doutrina e jurisprudência]</p>

<h3>IV - CONCLUSÃO</h3>

<p style="text-align: justify;">Ante o exposto, conclui-se que:</p>

<p style="text-align: justify;">[Resposta objetiva às questões formuladas]</p>

<p style="text-align: justify;">É o parecer, salvo melhor juízo.</p>

<p style="text-align: center;">{{cidade}}/{{estado}}, {{data}}.</p>

<p style="text-align: center;"><br></p>

<p style="text-align: center;"><strong>{{advogado.nome}}</strong><br>OAB/{{estado}} nº {{advogado.oab}}</p>`,
  },

  // AÇÕES ESPECÍFICAS
  {
    id: "acao-alimentos",
    nome: "Ação de Alimentos",
    tipo: "peticao",
    categoria: "Família",
    descricao: "Modelo de ação de alimentos com pedido de alimentos provisórios",
    variaveis: [
      "VARA",
      "COMARCA",
      "UF",
      "NOME_AUTOR",
      "QUALIFICACAO_AUTOR",
      "NOME_REPRESENTANTE",
      "QUALIFICACAO_REPRESENTANTE",
      "NOME_REU",
      "QUALIFICACAO_REU",
      "DATA_NASCIMENTO",
      "IDADE",
      "NARRATIVA_FATOS",
      "VALOR_ALIMENTACAO",
      "VALOR_EDUCACAO",
      "VALOR_SAUDE",
      "VALOR_VESTUARIO",
      "VALOR_HIGIENE",
      "VALOR_TRANSPORTE",
      "VALOR_LAZER",
      "VALOR_OUTROS",
      "VALOR_TOTAL_DESPESAS",
      "PROFISSAO_REU",
      "EMPRESA_REU",
      "RENDA_REU",
      "INFORMACOES_ADICIONAIS_RENDA",
      "VALOR_PROVISORIOS",
      "VALOR_PROVISORIOS_EXTENSO",
      "PERCENTUAL_PROVISORIOS",
      "DIA_PAGAMENTO",
      "VALOR_DEFINITIVOS",
      "VALOR_DEFINITIVOS_EXTENSO",
      "PERCENTUAL_DEFINITIVOS",
      "VALOR_CAUSA",
      "VALOR_CAUSA_EXTENSO",
      "CIDADE",
      "DATA",
      "NOME_ADVOGADO",
      "UF_OAB",
      "NUMERO_OAB",
      "LISTA_DOCUMENTOS",
    ],
    tags: ["família", "alimentos", "pensão", "menor", "guarda", "sustento"],
    conteudo: `<h1 style="text-align: center;">AÇÃO DE ALIMENTOS</h1>

<h2 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{VARA}} DA COMARCA DE {{COMARCA}}/{{UF}}</h2>

<p><br></p>

<p style="text-align: justify;"><strong>{{NOME_AUTOR}}</strong>, {{QUALIFICACAO_AUTOR}}, neste ato representado(a) por seu/sua genitor(a) <strong>{{NOME_REPRESENTANTE}}</strong>, {{QUALIFICACAO_REPRESENTANTE}}, vem, respeitosamente, à presença de Vossa Excelência, por seu advogado que esta subscreve, com fundamento nos artigos 1.694 e seguintes do Código Civil e Lei nº 5.478/68, propor a presente:</p>

<h2 style="text-align: center;">AÇÃO DE ALIMENTOS</h2>

<p style="text-align: justify;">em face de <strong>{{NOME_REU}}</strong>, {{QUALIFICACAO_REU}}, pelos fatos e fundamentos jurídicos a seguir expostos:</p>

<h3>I – DA GRATUIDADE DE JUSTIÇA</h3>

<p style="text-align: justify;">Inicialmente, requer a concessão dos benefícios da Justiça Gratuita, nos termos do artigo 98 do CPC, uma vez que o(a) representante legal do(a) Autor(a) não possui condições de arcar com as custas processuais e honorários advocatícios sem prejuízo do sustento próprio e de sua família.</p>

<h3>II – DA RELAÇÃO DE PARENTESCO</h3>

<p style="text-align: justify;">O(A) Autor(a) é filho(a) do(a) Réu(Ré), conforme demonstra a Certidão de Nascimento anexa, nascido(a) em {{DATA_NASCIMENTO}}, contando atualmente com {{IDADE}} anos de idade.</p>

<h3>III – DOS FATOS</h3>

<p style="text-align: justify;">{{NARRATIVA_FATOS}}</p>

<p style="text-align: justify;">O(A) Réu(Ré), apesar de possuir condições financeiras, não vem contribuindo para o sustento do(a) filho(a), deixando-o(a) em situação de necessidade.</p>

<h3>IV – DA NECESSIDADE DO(A) ALIMENTANDO(A)</h3>

<p style="text-align: justify;">O(A) Autor(a) necessita dos alimentos para custear suas despesas básicas, quais sejam:</p>

<table style="width: 100%; border-collapse: collapse;">
  <tr style="background-color: #f2f2f2;">
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Despesa</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Valor Mensal</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Alimentação</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_ALIMENTACAO}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Educação (escola/material)</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_EDUCACAO}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Saúde (plano/medicamentos)</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_SAUDE}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Vestuário</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_VESTUARIO}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Higiene e limpeza</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_HIGIENE}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Transporte</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_TRANSPORTE}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Lazer</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_LAZER}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Outros</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_OUTROS}}</td>
  </tr>
  <tr style="background-color: #f2f2f2;">
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>TOTAL</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>R$ {{VALOR_TOTAL_DESPESAS}}</strong></td>
  </tr>
</table>

<h3>V – DA POSSIBILIDADE DO(A) ALIMENTANTE</h3>

<p style="text-align: justify;">O(A) Réu(Ré) trabalha como {{PROFISSAO_REU}} na empresa {{EMPRESA_REU}}, auferindo renda mensal de aproximadamente <strong>R$ {{RENDA_REU}}</strong>.</p>

<p style="text-align: justify;">{{INFORMACOES_ADICIONAIS_RENDA}}</p>

<h3>VI – DO DIREITO</h3>

<h4>6.1 – Do Dever de Sustento</h4>

<p style="text-align: justify;">O artigo 1.566, IV, do Código Civil estabelece como dever dos cônjuges o sustento, guarda e educação dos filhos. O artigo 1.634 também prevê que compete aos pais, quanto à pessoa dos filhos menores, dirigir-lhes a criação e a educação.</p>

<h4>6.2 – Dos Alimentos</h4>

<p style="text-align: justify;">O artigo 1.694 do Código Civil dispõe que podem os parentes exigir uns dos outros os alimentos de que necessitem para viver de modo compatível com a sua condição social.</p>

<h4>6.3 – Do Binômio Necessidade x Possibilidade</h4>

<p style="text-align: justify;">Nos termos do artigo 1.695 do Código Civil, são devidos os alimentos quando quem os pretende não tem bens suficientes, nem pode prover, pelo seu trabalho, à própria mantença, e aquele, de quem se reclamam, pode fornecê-los, sem desfalque do necessário ao seu sustento.</p>

<h3>VII – DOS ALIMENTOS PROVISÓRIOS</h3>

<p style="text-align: justify;">Requer a fixação de alimentos provisórios, nos termos do artigo 4º da Lei nº 5.478/68, no valor de <strong>R$ {{VALOR_PROVISORIOS}}</strong> ({{VALOR_PROVISORIOS_EXTENSO}}), equivalente a {{PERCENTUAL_PROVISORIOS}}% do salário mínimo / dos rendimentos líquidos do(a) Réu(Ré), tendo em vista a urgência e necessidade do(a) alimentando(a).</p>

<h3>VIII – DOS PEDIDOS</h3>

<p style="text-align: justify;">Ante o exposto, requer a Vossa Excelência:</p>

<ol>
  <li>A concessão dos benefícios da Justiça Gratuita;</li>
  <li>A fixação de alimentos provisórios no valor de R$ {{VALOR_PROVISORIOS}}, a serem pagos todo dia {{DIA_PAGAMENTO}} de cada mês;</li>
  <li>A citação do(a) Réu(Ré) para comparecer à audiência de conciliação e, querendo, apresentar contestação;</li>
  <li>A procedência do pedido, com a condenação do(a) Réu(Ré) ao pagamento de pensão alimentícia definitiva no valor de <strong>R$ {{VALOR_DEFINITIVOS}}</strong> ({{VALOR_DEFINITIVOS_EXTENSO}}), equivalente a {{PERCENTUAL_DEFINITIVOS}}% de seus rendimentos líquidos, incluindo 13º salário, férias e PLR;</li>
  <li>A determinação de desconto em folha de pagamento, nos termos do artigo 529 do CPC;</li>
  <li>A produção de todas as provas em direito admitidas.</li>
</ol>

<h3>IX – DO VALOR DA CAUSA</h3>

<p style="text-align: justify;">Dá-se à causa o valor de <strong>R$ {{VALOR_CAUSA}}</strong> ({{VALOR_CAUSA_EXTENSO}}), correspondente a 12 (doze) parcelas dos alimentos pleiteados.</p>

<p style="text-align: justify;">Termos em que,<br>Pede deferimento.</p>

<p style="text-align: center;">{{CIDADE}}/{{UF}}, {{DATA}}.</p>

<p><br></p>

<p style="text-align: center;"><strong>{{NOME_ADVOGADO}}</strong><br>OAB/{{UF_OAB}} nº {{NUMERO_OAB}}</p>

<h3>DOCUMENTOS ANEXOS:</h3>

<ol>
  <li>Procuração ad judicia</li>
  <li>Certidão de nascimento do(a) Autor(a)</li>
  <li>Comprovante de residência</li>
  <li>Declaração de hipossuficiência</li>
  <li>Comprovantes de despesas</li>
  <li>{{LISTA_DOCUMENTOS}}</li>
</ol>`,
  },

  {
    id: "acao-indenizacao-danos",
    nome: "Ação de Indenização por Danos Morais e Materiais",
    tipo: "peticao",
    categoria: "Cível",
    descricao: "Modelo de ação de indenização por danos morais e materiais",
    variaveis: [
      "VARA",
      "COMARCA",
      "UF",
      "NOME_AUTOR",
      "QUALIFICACAO_AUTOR",
      "NOME_REU",
      "QUALIFICACAO_REU",
      "NARRATIVA_FATOS",
      "DESCRICAO_CONDUTA_ILICITA",
      "DESCRICAO_DANO",
      "DESCRICAO_NEXO",
      "ITEM_DANO_1",
      "VALOR_DANO_1",
      "ITEM_DANO_2",
      "VALOR_DANO_2",
      "ITEM_DANO_3",
      "VALOR_DANO_3",
      "VALOR_TOTAL_MATERIAIS",
      "DESCRICAO_DANO_MORAL",
      "VALOR_DANOS_MORAIS",
      "JURISPRUDENCIA",
      "PROVAS_REQUERIDAS",
      "VALOR_CAUSA",
      "VALOR_CAUSA_EXTENSO",
      "CIDADE",
      "DATA",
      "NOME_ADVOGADO",
      "UF_OAB",
      "NUMERO_OAB",
      "LISTA_DOCUMENTOS",
    ],
    tags: ["indenização", "danos morais", "danos materiais", "responsabilidade civil", "cível"],
    conteudo: `<h1 style="text-align: center;">AÇÃO DE INDENIZAÇÃO POR DANOS MORAIS E MATERIAIS</h1>

<h2 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{VARA}} DA COMARCA DE {{COMARCA}}/{{UF}}</h2>

<p><br></p>

<p style="text-align: justify;"><strong>{{NOME_AUTOR}}</strong>, {{QUALIFICACAO_AUTOR}}, vem, respeitosamente, à presença de Vossa Excelência, por seu advogado que esta subscreve, com fundamento nos artigos 186, 187 e 927 do Código Civil, propor a presente:</p>

<h2 style="text-align: center;">AÇÃO DE INDENIZAÇÃO POR DANOS MORAIS E MATERIAIS</h2>

<p style="text-align: justify;">em face de <strong>{{NOME_REU}}</strong>, {{QUALIFICACAO_REU}}, pelos fatos e fundamentos jurídicos a seguir expostos:</p>

<h3>I – DOS FATOS</h3>

<p style="text-align: justify;">{{NARRATIVA_FATOS}}</p>

<h3>II – DO DIREITO</h3>

<h4>2.1 – Da Responsabilidade Civil</h4>

<p style="text-align: justify;">O artigo 186 do Código Civil estabelece que "aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilícito".</p>

<p style="text-align: justify;">Complementarmente, o artigo 927 determina que "aquele que, por ato ilícito (arts. 186 e 187), causar dano a outrem, fica obrigado a repará-lo".</p>

<h4>2.2 – Dos Pressupostos da Responsabilidade Civil</h4>

<p style="text-align: justify;">No presente caso, restam configurados todos os pressupostos da responsabilidade civil:</p>

<p style="text-align: justify;"><strong>a) Conduta ilícita:</strong> {{DESCRICAO_CONDUTA_ILICITA}}</p>

<p style="text-align: justify;"><strong>b) Dano:</strong> {{DESCRICAO_DANO}}</p>

<p style="text-align: justify;"><strong>c) Nexo causal:</strong> {{DESCRICAO_NEXO}}</p>

<h4>2.3 – Dos Danos Materiais</h4>

<p style="text-align: justify;">Os danos materiais sofridos pelo(a) Autor(a) consistem em:</p>

<table style="width: 100%; border-collapse: collapse;">
  <tr style="background-color: #f2f2f2;">
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Descrição</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Valor</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">{{ITEM_DANO_1}}</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_DANO_1}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">{{ITEM_DANO_2}}</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_DANO_2}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">{{ITEM_DANO_3}}</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_DANO_3}}</td>
  </tr>
  <tr style="background-color: #f2f2f2;">
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>TOTAL DANOS MATERIAIS</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>R$ {{VALOR_TOTAL_MATERIAIS}}</strong></td>
  </tr>
</table>

<h4>2.4 – Dos Danos Morais</h4>

<p style="text-align: justify;">Os danos morais são caracterizados pela violação aos direitos da personalidade, causando sofrimento, angústia, humilhação ou constrangimento à vítima.</p>

<p style="text-align: justify;">No caso em tela, o(a) Autor(a) sofreu {{DESCRICAO_DANO_MORAL}}.</p>

<p style="text-align: justify;">A quantificação dos danos morais deve observar o caráter compensatório para a vítima e pedagógico para o ofensor, levando em consideração:</p>

<ul>
  <li>A gravidade do dano</li>
  <li>A capacidade econômica das partes</li>
  <li>O grau de culpa do ofensor</li>
  <li>A repercussão do fato</li>
</ul>

<p style="text-align: justify;">Assim, pleiteia-se indenização por danos morais no valor de <strong>R$ {{VALOR_DANOS_MORAIS}}</strong>.</p>

<h4>2.5 – Da Jurisprudência</h4>

<p style="text-align: justify;">{{JURISPRUDENCIA}}</p>

<h3>III – DOS PEDIDOS</h3>

<p style="text-align: justify;">Ante o exposto, requer a Vossa Excelência:</p>

<ol>
  <li>A citação do(a) Réu(Ré) para que, querendo, apresente contestação no prazo legal;</li>
  <li>A procedência do pedido, condenando o(a) Réu(Ré) ao pagamento de:
    <ul>
      <li><strong>Danos materiais</strong>: R$ {{VALOR_TOTAL_MATERIAIS}}, acrescido de correção monetária desde o evento danoso e juros de mora de 1% ao mês desde a citação;</li>
      <li><strong>Danos morais</strong>: R$ {{VALOR_DANOS_MORAIS}}, acrescido de correção monetária a partir do arbitramento e juros de mora de 1% ao mês desde o evento danoso;</li>
    </ul>
  </li>
  <li>A condenação do(a) Réu(Ré) ao pagamento das custas processuais e honorários advocatícios;</li>
  <li>A concessão dos benefícios da Justiça Gratuita (se aplicável);</li>
  <li>A produção de todas as provas em direito admitidas, especialmente {{PROVAS_REQUERIDAS}}.</li>
</ol>

<h3>IV – DO VALOR DA CAUSA</h3>

<p style="text-align: justify;">Dá-se à causa o valor de <strong>R$ {{VALOR_CAUSA}}</strong> ({{VALOR_CAUSA_EXTENSO}}), correspondente à soma dos danos materiais e morais pleiteados.</p>

<p style="text-align: justify;">Termos em que,<br>Pede deferimento.</p>

<p style="text-align: center;">{{CIDADE}}/{{UF}}, {{DATA}}.</p>

<p><br></p>

<p style="text-align: center;"><strong>{{NOME_ADVOGADO}}</strong><br>OAB/{{UF_OAB}} nº {{NUMERO_OAB}}</p>

<h3>DOCUMENTOS ANEXOS:</h3>

<ol>
  <li>Procuração ad judicia</li>
  <li>Documentos pessoais do(a) Autor(a)</li>
  <li>Comprovantes dos danos materiais</li>
  <li>{{LISTA_DOCUMENTOS}}</li>
</ol>`,
  },

  {
    id: "acao-revisional-bancaria",
    nome: "Ação Revisional de Contrato Bancário",
    tipo: "peticao",
    categoria: "Consumidor",
    descricao: "Modelo de ação revisional de contrato bancário com pedido de repetição de indébito",
    variaveis: [
      "VARA",
      "COMARCA",
      "UF",
      "NOME_AUTOR",
      "QUALIFICACAO_AUTOR",
      "NOME_BANCO",
      "CNPJ_BANCO",
      "ENDERECO_BANCO",
      "TIPO_CONTRATO",
      "NUMERO_CONTRATO",
      "DATA_CONTRATO",
      "VALOR_CONTRATADO",
      "NUMERO_PARCELAS",
      "VALOR_PARCELA",
      "NARRATIVA_FATOS",
      "TAXA_JUROS_PRATICADA",
      "TAXA_JUROS_ANUAL",
      "TAXA_MEDIA_BACEN",
      "DIFERENCA_TAXA",
      "ARGUMENTOS_COMISSAO_PERMANENCIA",
      "VALOR_TAC",
      "VALOR_TEC",
      "VALOR_CADASTRO",
      "VALOR_SEGURO",
      "VALOR_IOF",
      "OUTRAS_TARIFAS",
      "VALOR_OUTRAS",
      "JURISPRUDENCIA",
      "VALOR_PARCELA_CORRETA",
      "VALOR_CAUSA",
      "VALOR_CAUSA_EXTENSO",
      "CIDADE",
      "DATA",
      "NOME_ADVOGADO",
      "UF_OAB",
      "NUMERO_OAB",
      "LISTA_DOCUMENTOS",
    ],
    tags: [
      "revisional",
      "contrato bancário",
      "consumidor",
      "juros abusivos",
      "CDC",
      "banco",
      "financiamento",
    ],
    conteudo: `<h1 style="text-align: center;">AÇÃO REVISIONAL DE CONTRATO BANCÁRIO</h1>

<h2 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{VARA}} DA COMARCA DE {{COMARCA}}/{{UF}}</h2>

<p><br></p>

<p style="text-align: justify;"><strong>{{NOME_AUTOR}}</strong>, {{QUALIFICACAO_AUTOR}}, vem, respeitosamente, à presença de Vossa Excelência, por seu advogado que esta subscreve, com fundamento nos artigos 6º, V, e 51, IV, do Código de Defesa do Consumidor, propor a presente:</p>

<h2 style="text-align: center;">AÇÃO REVISIONAL DE CONTRATO BANCÁRIO C/C REPETIÇÃO DE INDÉBITO</h2>

<p style="text-align: justify;">em face de <strong>{{NOME_BANCO}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{CNPJ_BANCO}}, com sede na {{ENDERECO_BANCO}}, pelos fatos e fundamentos jurídicos a seguir expostos:</p>

<h3>I – DA GRATUIDADE DE JUSTIÇA</h3>

<p style="text-align: justify;">Requer a concessão dos benefícios da Justiça Gratuita, nos termos do artigo 98 do CPC, por não possuir condições de arcar com as custas processuais sem prejuízo do sustento próprio e de sua família.</p>

<h3>II – DOS FATOS</h3>

<p style="text-align: justify;">O(A) Autor(a) firmou com o(a) Réu(Ré) contrato de {{TIPO_CONTRATO}} nº {{NUMERO_CONTRATO}}, em {{DATA_CONTRATO}}, no valor de <strong>R$ {{VALOR_CONTRATADO}}</strong>, a ser pago em {{NUMERO_PARCELAS}} parcelas de <strong>R$ {{VALOR_PARCELA}}</strong>.</p>

<p style="text-align: justify;">{{NARRATIVA_FATOS}}</p>

<h3>III – DO DIREITO</h3>

<h4>3.1 – Da Aplicação do Código de Defesa do Consumidor</h4>

<p style="text-align: justify;">A relação entre as partes é de consumo, aplicando-se as disposições do CDC, conforme entendimento sumulado pelo STJ (Súmula 297).</p>

<h4>3.2 – Da Abusividade das Cláusulas Contratuais</h4>

<p style="text-align: justify;"><strong>a) Dos Juros Remuneratórios</strong></p>

<p style="text-align: justify;">Os juros remuneratórios praticados pelo Réu são de {{TAXA_JUROS_PRATICADA}}% ao mês ({{TAXA_JUROS_ANUAL}}% ao ano), enquanto a taxa média de mercado divulgada pelo BACEN para a mesma modalidade de operação é de {{TAXA_MEDIA_BACEN}}% ao mês.</p>

<p style="text-align: justify;">A diferença de {{DIFERENCA_TAXA}}% caracteriza abusividade que deve ser coibida.</p>

<p style="text-align: justify;"><strong>b) Da Capitalização de Juros</strong></p>

<p style="text-align: justify;">O contrato prevê capitalização de juros em periodicidade inferior à anual, o que eleva consideravelmente o custo efetivo total da operação.</p>

<p style="text-align: justify;"><strong>c) Da Comissão de Permanência</strong></p>

<p style="text-align: justify;">{{ARGUMENTOS_COMISSAO_PERMANENCIA}}</p>

<p style="text-align: justify;"><strong>d) Das Tarifas Administrativas</strong></p>

<p style="text-align: justify;">O contrato contém cobrança das seguintes tarifas:</p>

<table style="width: 100%; border-collapse: collapse;">
  <tr style="background-color: #f2f2f2;">
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Tarifa</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Valor</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">TAC (Tarifa de Abertura de Crédito)</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_TAC}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">TEC (Tarifa de Emissão de Carnê)</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_TEC}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Tarifa de Cadastro</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_CADASTRO}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Seguro Prestamista</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_SEGURO}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">IOF Financiado</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_IOF}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">{{OUTRAS_TARIFAS}}</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_OUTRAS}}</td>
  </tr>
</table>

<h4>3.3 – Da Jurisprudência</h4>

<p style="text-align: justify;">{{JURISPRUDENCIA}}</p>

<h3>IV – DA REPETIÇÃO DE INDÉBITO</h3>

<p style="text-align: justify;">Os valores cobrados indevidamente devem ser devolvidos em dobro, nos termos do artigo 42, parágrafo único, do CDC, ou, subsidiariamente, de forma simples.</p>

<h3>V – DOS PEDIDOS</h3>

<p style="text-align: justify;">Ante o exposto, requer a Vossa Excelência:</p>

<ol>
  <li>A concessão dos benefícios da Justiça Gratuita;</li>
  <li>A citação do(a) Réu(Ré) para que, querendo, apresente contestação no prazo legal;</li>
  <li>A procedência dos pedidos para:
    <ol>
      <li>Revisar o contrato, afastando as cláusulas abusivas;</li>
      <li>Limitar os juros remuneratórios à taxa média de mercado divulgada pelo BACEN;</li>
      <li>Afastar a capitalização de juros em periodicidade inferior à anual;</li>
      <li>Declarar a nulidade da comissão de permanência;</li>
      <li>Afastar a cobrança das tarifas abusivas (TAC, TEC, etc.);</li>
      <li>Condenar o(a) Réu(Ré) à repetição do indébito, em dobro, dos valores cobrados indevidamente;</li>
      <li>Recalcular o débito com base nos parâmetros legais;</li>
    </ol>
  </li>
  <li>A inversão do ônus da prova, nos termos do artigo 6º, VIII, do CDC;</li>
  <li>A determinação para que o(a) Réu(Ré) apresente o contrato original e planilha de evolução do débito;</li>
  <li>A condenação ao pagamento das custas processuais e honorários advocatícios;</li>
  <li>A produção de todas as provas em direito admitidas.</li>
</ol>

<h3>VI – DO DEPÓSITO JUDICIAL (se aplicável)</h3>

<p style="text-align: justify;">O(A) Autor(a) propõe-se a depositar judicialmente o valor das parcelas que entende devido, qual seja, <strong>R$ {{VALOR_PARCELA_CORRETA}}</strong>, demonstrando sua boa-fé e evitando a mora.</p>

<h3>VII – DO VALOR DA CAUSA</h3>

<p style="text-align: justify;">Dá-se à causa o valor de <strong>R$ {{VALOR_CAUSA}}</strong> ({{VALOR_CAUSA_EXTENSO}}).</p>

<p style="text-align: justify;">Termos em que,<br>Pede deferimento.</p>

<p style="text-align: center;">{{CIDADE}}/{{UF}}, {{DATA}}.</p>

<p><br></p>

<p style="text-align: center;"><strong>{{NOME_ADVOGADO}}</strong><br>OAB/{{UF_OAB}} nº {{NUMERO_OAB}}</p>

<h3>DOCUMENTOS ANEXOS:</h3>

<ol>
  <li>Procuração ad judicia</li>
  <li>Contrato bancário</li>
  <li>Comprovantes de pagamento</li>
  <li>Extrato bancário</li>
  <li>Declaração de hipossuficiência</li>
  <li>{{LISTA_DOCUMENTOS}}</li>
</ol>`,
  },

  {
    id: "acao-usucapiao",
    nome: "Ação de Usucapião",
    tipo: "peticao",
    categoria: "Imobiliário",
    descricao: "Modelo de ação de usucapião para aquisição de propriedade imobiliária",
    variaveis: [
      "VARA",
      "COMARCA",
      "UF",
      "NOME_AUTOR",
      "QUALIFICACAO_AUTOR",
      "TIPO_USUCAPIAO",
      "ENDERECO_IMOVEL",
      "AREA_IMOVEL",
      "MATRICULA_IMOVEL",
      "CONFRONTACAO_NORTE",
      "CONFRONTACAO_SUL",
      "CONFRONTACAO_LESTE",
      "CONFRONTACAO_OESTE",
      "VALOR_VENAL",
      "NUMERO_IPTU",
      "NUMERO_INCRA",
      "NARRATIVA_FATOS",
      "DATA_INICIO_POSSE",
      "TEMPO_POSSE",
      "ORIGEM_POSSE",
      "LISTA_BENFEITORIAS",
      "ARTIGO_FUNDAMENTO",
      "TRANSCRICAO_ARTIGO",
      "TEMPO_EXIGIDO",
      "REQUISITO_ESPECIFICO",
      "COMPROVACAO_ESPECIFICA",
      "JURISPRUDENCIA",
      "NOMES_PROPRIETARIOS",
      "NOMES_CONFINANTES",
      "VALOR_CAUSA",
      "VALOR_CAUSA_EXTENSO",
      "CIDADE",
      "DATA",
      "NOME_ADVOGADO",
      "UF_OAB",
      "NUMERO_OAB",
      "LISTA_DOCUMENTOS",
    ],
    tags: ["usucapião", "imóvel", "propriedade", "posse", "registro", "imobiliário"],
    conteudo: `<h1 style="text-align: center;">AÇÃO DE USUCAPIÃO</h1>

<h2 style="text-align: center;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{VARA}} DA COMARCA DE {{COMARCA}}/{{UF}}</h2>

<p><br></p>

<p style="text-align: justify;"><strong>{{NOME_AUTOR}}</strong>, {{QUALIFICACAO_AUTOR}}, vem, respeitosamente, à presença de Vossa Excelência, por seu advogado que esta subscreve, com fundamento nos artigos 1.238 a 1.244 do Código Civil e artigo 1.071 do CPC, propor a presente:</p>

<h2 style="text-align: center;">AÇÃO DE USUCAPIÃO {{TIPO_USUCAPIAO}}</h2>

<p style="text-align: justify;">tendo por objeto o imóvel situado na {{ENDERECO_IMOVEL}}, pelos fatos e fundamentos jurídicos a seguir expostos:</p>

<h3>I – DO IMÓVEL</h3>

<p style="text-align: justify;">O imóvel objeto da presente ação possui as seguintes características:</p>

<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Informação</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Descrição</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Endereço</td>
    <td style="border: 1px solid #ddd; padding: 8px;">{{ENDERECO_IMOVEL}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Área</td>
    <td style="border: 1px solid #ddd; padding: 8px;">{{AREA_IMOVEL}} m²</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Matrícula</td>
    <td style="border: 1px solid #ddd; padding: 8px;">{{MATRICULA_IMOVEL}} (se houver)</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Confrontações</td>
    <td style="border: 1px solid #ddd; padding: 8px;">Norte: {{CONFRONTACAO_NORTE}}; Sul: {{CONFRONTACAO_SUL}}; Leste: {{CONFRONTACAO_LESTE}}; Oeste: {{CONFRONTACAO_OESTE}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Valor venal</td>
    <td style="border: 1px solid #ddd; padding: 8px;">R$ {{VALOR_VENAL}}</td>
  </tr>
</table>

<p style="text-align: justify;">O imóvel encontra-se cadastrado no IPTU sob o nº {{NUMERO_IPTU}} (se urbano) / INCRA nº {{NUMERO_INCRA}} (se rural).</p>

<h3>II – DOS FATOS</h3>

<p style="text-align: justify;">{{NARRATIVA_FATOS}}</p>

<p style="text-align: justify;">O(A) Autor(a) exerce a posse mansa, pacífica, ininterrupta e com animus domini sobre o referido imóvel desde {{DATA_INICIO_POSSE}}, ou seja, há mais de {{TEMPO_POSSE}} anos.</p>

<h3>III – DA POSSE</h3>

<h4>3.1 – Da Origem da Posse</h4>

<p style="text-align: justify;">A posse do(a) Autor(a) teve origem {{ORIGEM_POSSE}}.</p>

<h4>3.2 – Das Características da Posse</h4>

<p style="text-align: justify;">A posse exercida pelo(a) Autor(a) é:</p>

<ul>
  <li><strong>Mansa e pacífica</strong>: nunca houve oposição à posse;</li>
  <li><strong>Contínua e ininterrupta</strong>: o(a) Autor(a) jamais abandonou o imóvel;</li>
  <li><strong>Com animus domini</strong>: o(a) Autor(a) sempre se comportou como dono(a);</li>
  <li><strong>Pública</strong>: a posse é conhecida por todos;</li>
  <li><strong>De boa-fé</strong> (se aplicável): o(a) Autor(a) desconhece qualquer vício.</li>
</ul>

<h4>3.3 – Das Benfeitorias Realizadas</h4>

<p style="text-align: justify;">O(A) Autor(a) realizou as seguintes benfeitorias no imóvel:</p>

<p style="text-align: justify;">{{LISTA_BENFEITORIAS}}</p>

<h4>3.4 – Do Pagamento de Tributos</h4>

<p style="text-align: justify;">O(A) Autor(a) vem arcando com o pagamento dos tributos incidentes sobre o imóvel (IPTU/ITR), conforme comprovantes anexos.</p>

<h3>IV – DO DIREITO</h3>

<h4>4.1 – Da Modalidade de Usucapião</h4>

<p style="text-align: justify;">O presente caso enquadra-se na modalidade de usucapião {{TIPO_USUCAPIAO}}, prevista no artigo {{ARTIGO_FUNDAMENTO}} do Código Civil:</p>

<p style="text-align: justify;">{{TRANSCRICAO_ARTIGO}}</p>

<h4>4.2 – Dos Requisitos Legais</h4>

<table style="width: 100%; border-collapse: collapse;">
  <tr style="background-color: #f2f2f2;">
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Requisito</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Comprovação</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Posse por {{TEMPO_EXIGIDO}} anos</td>
    <td style="border: 1px solid #ddd; padding: 8px;">✓ Posse desde {{DATA_INICIO_POSSE}}</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Posse mansa e pacífica</td>
    <td style="border: 1px solid #ddd; padding: 8px;">✓ Sem oposição</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Posse contínua</td>
    <td style="border: 1px solid #ddd; padding: 8px;">✓ Jamais abandonou</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">Animus domini</td>
    <td style="border: 1px solid #ddd; padding: 8px;">✓ Comportamento de proprietário</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">{{REQUISITO_ESPECIFICO}}</td>
    <td style="border: 1px solid #ddd; padding: 8px;">✓ {{COMPROVACAO_ESPECIFICA}}</td>
  </tr>
</table>

<h4>4.3 – Da Jurisprudência</h4>

<p style="text-align: justify;">{{JURISPRUDENCIA}}</p>

<h3>V – DOS PEDIDOS</h3>

<p style="text-align: justify;">Ante o exposto, requer a Vossa Excelência:</p>

<ol>
  <li>A citação dos proprietários registrais do imóvel: {{NOMES_PROPRIETARIOS}};</li>
  <li>A citação dos confinantes: {{NOMES_CONFINANTES}};</li>
  <li>A intimação da Fazenda Pública (Municipal, Estadual e Federal);</li>
  <li>A publicação de edital para citação de eventuais interessados;</li>
  <li>A intimação do Ministério Público;</li>
  <li>A procedência do pedido, declarando a aquisição da propriedade do imóvel por usucapião em favor do(a) Autor(a);</li>
  <li>A expedição de mandado ao Cartório de Registro de Imóveis para registro da sentença;</li>
  <li>A produção de todas as provas em direito admitidas, especialmente:
    <ul>
      <li>Prova testemunhal</li>
      <li>Prova documental</li>
      <li>Prova pericial (levantamento topográfico e avaliação)</li>
      <li>Inspeção judicial</li>
    </ul>
  </li>
</ol>

<h3>VI – DO VALOR DA CAUSA</h3>

<p style="text-align: justify;">Dá-se à causa o valor de <strong>R$ {{VALOR_CAUSA}}</strong> ({{VALOR_CAUSA_EXTENSO}}), correspondente ao valor venal do imóvel.</p>

<p style="text-align: justify;">Termos em que,<br>Pede deferimento.</p>

<p style="text-align: center;">{{CIDADE}}/{{UF}}, {{DATA}}.</p>

<p><br></p>

<p style="text-align: center;"><strong>{{NOME_ADVOGADO}}</strong><br>OAB/{{UF_OAB}} nº {{NUMERO_OAB}}</p>

<h3>DOCUMENTOS ANEXOS:</h3>

<ol>
  <li>Procuração ad judicia</li>
  <li>Documentos pessoais do(a) Autor(a)</li>
  <li>Certidão de matrícula do imóvel (ou certidão negativa)</li>
  <li>Planta e memorial descritivo do imóvel</li>
  <li>Comprovantes de pagamento de IPTU/ITR</li>
  <li>Comprovantes de contas de água, luz, etc.</li>
  <li>Fotos do imóvel e benfeitorias</li>
  <li>Declarações de vizinhos</li>
  <li>{{LISTA_DOCUMENTOS}}</li>
</ol>`,
  },
];

// Função para buscar template por ID
export function getTemplateById(id: string): DocumentTemplate | undefined {
  return documentTemplates.find((t) => t.id === id);
}

// Função para buscar templates por tipo
export function getTemplatesByTipo(tipo: DocumentTemplate["tipo"]): DocumentTemplate[] {
  return documentTemplates.filter((t) => t.tipo === tipo);
}

// Função para buscar templates por categoria
export function getTemplatesByCategoria(categoria: string): DocumentTemplate[] {
  return documentTemplates.filter((t) => t.categoria === categoria);
}

// Função para buscar templates por tag / texto livre
export function searchTemplates(query: string): DocumentTemplate[] {
  const lowerQuery = query.toLowerCase();
  return documentTemplates.filter(
    (t) =>
      t.nome.toLowerCase().includes(lowerQuery) ||
      t.descricao.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      t.categoria.toLowerCase().includes(lowerQuery)
  );
}

// Função para substituir variáveis no template
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  Object.entries(variables).forEach(([key, value]) => {
    // Escapar pontos da chave para uso em regex
    const escapedKey = key.replaceAll(".", String.raw`\.`);
    const regex = new RegExp(String.raw`\{\{\s*${escapedKey}\s*\}\}`, "g");
    result = result.replaceAll(regex, value || `[${key}]`);
  });

  return result;
}

// Extrair variáveis não preenchidas de um conteúdo
export function extractUnfilledVariables(content: string): string[] {
  const regex = /\{\{\s*([^}]+)\s*\}\}/g;
  const matches: string[] = [];

  // Usar matchAll ao invés de exec em loop (mais seguro)
  for (const match of content.matchAll(regex)) {
    const variable = match[1].trim();
    if (!matches.includes(variable)) {
      matches.push(variable);
    }
  }

  return matches;
}
