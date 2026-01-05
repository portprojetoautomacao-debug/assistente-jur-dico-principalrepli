import cron from "node-cron";
import { buscarPublicacoesDJEN } from "./djen-api.js";
import { extractPartiesWithFallback } from "./extract-parties.js";
import { salvarExpediente } from "../db/expedientes.js";
import { enviarEmailNotificacao } from "./email-notifier.js";

/**
 * Configuração do advogado padrão
 * TODO: Fazer isso dinâmico baseado em múltiplos advogados cadastrados
 */
const ADVOGADO_PADRAO = {
  numeroOab: process.env.DJEN_OAB_NUMERO || "184404",
  ufOab: process.env.DJEN_OAB_UF || "MG",
  nome: process.env.DJEN_ADVOGADO_NOME || "Thiago Bodevan Veiga",
};

/**
 * Processa publicações DJEN automaticamente
 */
async function processarPublicacoesDJEN() {
  const startTime = Date.now();
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🤖 [DJEN Scheduler] Iniciando busca automática`);
  console.log(`⏰ Horário: ${new Date().toLocaleString("pt-BR")}`);
  console.log(
    `👨‍⚖️ Advogado: ${ADVOGADO_PADRAO.nome} (OAB/${ADVOGADO_PADRAO.ufOab} ${ADVOGADO_PADRAO.numeroOab})`
  );
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  try {
    // Data de hoje no formato ISO
    const dataHoje = new Date().toISOString().split("T")[0];

    // Buscar publicações
    const publicacoes = await buscarPublicacoesDJEN({
      numeroOab: ADVOGADO_PADRAO.numeroOab,
      ufOab: ADVOGADO_PADRAO.ufOab,
      dataInicio: dataHoje,
      dataFim: dataHoje,
    });

    console.log(`📄 Publicações encontradas: ${publicacoes.length}`);

    if (publicacoes.length === 0) {
      console.log(`✅ Nenhuma publicação nova. Sistema OK.\n`);
      return { sucesso: true, total: 0, processadas: 0 };
    }

    let processadas = 0;
    let erros = 0;

    // Processar cada publicação
    for (const pub of publicacoes) {
      try {
        console.log(`\n📋 Processando: ${pub.numeroProcesso}`);
        console.log(`   Tribunal: ${pub.siglaTribunal}`);
        console.log(`   Tipo: ${pub.tipoComunicacao}`);

        // Extrair partes (Regex → IA)
        const partes = await extractPartiesWithFallback(pub.texto);

        // Salvar no banco de dados
        const expediente = await salvarExpediente({
          numeroProcesso: pub.numeroProcesso,
          tribunal: pub.siglaTribunal,
          tipo: pub.tipoComunicacao,
          titulo: `${pub.tipoComunicacao} - ${pub.numeroProcesso}`,
          conteudo: pub.texto,
          dataDisponibilizacao: pub.dataDisponibilizacao,
          nomeOrgao: pub.nomeOrgao,
          autor: partes.autor,
          reu: partes.reu,
          advogadoAutor: partes.advogadoAutor,
          advogadoReu: partes.advogadoReu,
          lawyerName: ADVOGADO_PADRAO.nome,
        });

        console.log(`   ✅ Salvo: ID ${expediente.id}`);
        processadas++;

        // Enviar email se configurado
        if (process.env.EMAIL_NOTIFICACAO_ENABLED === "true") {
          await enviarEmailNotificacao({
            destinatario: process.env.EMAIL_NOTIFICACAO_DESTINO || "",
            assunto: `[DJEN] ${pub.tipoComunicacao} - ${pub.numeroProcesso}`,
            processo: pub.numeroProcesso,
            tribunal: pub.siglaTribunal,
            tipo: pub.tipoComunicacao,
            teor: pub.texto,
            autor: partes.autor || "Não identificado",
            reu: partes.reu || "Não identificado",
          });
          console.log(`   📧 Email enviado`);
        }
      } catch (error) {
        console.error(`   ❌ Erro ao processar ${pub.numeroProcesso}:`, error);
        erros++;
      }

      // Delay entre publicações para não sobrecarregar APIs
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Processamento concluído`);
    console.log(`   Total: ${publicacoes.length}`);
    console.log(`   Sucesso: ${processadas}`);
    console.log(`   Erros: ${erros}`);
    console.log(`   Duração: ${duration}s`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      sucesso: true,
      total: publicacoes.length,
      processadas,
      erros,
      duracao: duration,
    };
  } catch (error) {
    console.error(`\n❌ [DJEN Scheduler] Erro fatal:`, error);
    return { sucesso: false, erro: (error as Error).message };
  }
}

/**
 * Configura os jobs de cron para monitoramento DJEN
 */
export function iniciarSchedulerDJEN() {
  const timezone = process.env.TZ || "America/Sao_Paulo";

  console.log(`\n🕐 [DJEN Scheduler] Iniciando jobs automáticos`);
  console.log(`   Timezone: ${timezone}`);
  console.log(`   Job 1: 01:00 (todos os dias)`);
  console.log(`   Job 2: 09:00 (todos os dias)`);

  // Job 1: 01:00 da manhã
  cron.schedule(
    "0 1 * * *",
    async () => {
      console.log(`\n🌙 [DJEN Scheduler] Executando job 01:00...`);
      await processarPublicacoesDJEN();
    },
    {
      timezone,
    }
  );

  // Job 2: 09:00 da manhã
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log(`\n☀️ [DJEN Scheduler] Executando job 09:00...`);
      await processarPublicacoesDJEN();
    },
    {
      timezone,
    }
  );

  console.log(`✅ [DJEN Scheduler] Jobs configurados com sucesso\n`);
}

/**
 * Endpoint para trigger manual (útil para testes)
 */
export async function executarManualmente() {
  console.log(`\n🔧 [DJEN Scheduler] Execução manual requisitada`);
  return await processarPublicacoesDJEN();
}
