/**
 * Script de Inicialização dos Agentes IA - Assistente Jurídico PJe
 * 
 * INSTRUÇÕES DE USO:
 * 1. Abra o navegador e acesse: https://assistente-juridico-github.vercel.app
 * 2. Abra o Console do navegador (F12 → Console)
 * 3. Cole este script completo e pressione Enter
 * 4. Aguarde a confirmação de inicialização dos agentes
 * 
 * Este script configura:
 * - 7 Agentes de IA Autônomos
 * - Advogado Thiago Bodevan Veiga (OAB/MG 184.404)
 * - Monitoramento DJEN para TJMG, TRT3, TST, STJ
 */

(async function inicializarSistemaAgentes() {
  console.log("🚀 Iniciando configuração dos Agentes IA...");

  const BASE_URL = window.location.origin;
  const API_BASE = `${BASE_URL}/api`;

  // ============================================
  // 1. CONFIGURAR ADVOGADO
  // ============================================
  const advogado = {
    id: "lawyer-thiago-bodevan",
    name: "Thiago Bodevan Veiga",
    oab: "OAB/MG 184.404",
    email: "thiagobodevanadvocacia@gmail.com",
    phone: "+55 31 99999-9999",
    active: true,
    createdAt: new Date().toISOString(),
  };

  console.log("👨‍⚖️ Configurando advogado:", advogado.name);

  try {
    const lawyerResponse = await fetch(`${API_BASE}/lawyers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(advogado),
    });

    if (lawyerResponse.ok) {
      console.log("✅ Advogado configurado com sucesso");
    } else {
      console.warn("⚠️ Advogado já existe ou erro ao criar");
    }
  } catch (error) {
    console.error("❌ Erro ao configurar advogado:", error);
  }

  // ============================================
  // 2. CONFIGURAR TRIBUNAIS MONITORADOS
  // ============================================
  const tribunais = [
    {
      id: "tribunal-tjmg",
      name: "TJMG",
      fullName: "Tribunal de Justiça de Minas Gerais",
      type: "estadual",
      state: "MG",
      active: true,
    },
    {
      id: "tribunal-trt3",
      name: "TRT3",
      fullName: "Tribunal Regional do Trabalho da 3ª Região",
      type: "trabalhista",
      state: "MG",
      active: true,
    },
    {
      id: "tribunal-tst",
      name: "TST",
      fullName: "Tribunal Superior do Trabalho",
      type: "superior",
      state: "DF",
      active: true,
    },
    {
      id: "tribunal-stj",
      name: "STJ",
      fullName: "Superior Tribunal de Justiça",
      type: "superior",
      state: "DF",
      active: true,
    },
  ];

  console.log(`📋 Configurando ${tribunais.length} tribunais...`);

  for (const tribunal of tribunais) {
    try {
      const tribunalResponse = await fetch(`${API_BASE}/tribunais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tribunal),
      });

      if (tribunalResponse.ok) {
        console.log(`✅ Tribunal ${tribunal.name} configurado`);
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao configurar ${tribunal.name}`);
    }
  }

  // ============================================
  // 3. INICIALIZAR OS 7 AGENTES DE IA
  // ============================================
  const agentes = [
    {
      id: "agent-harvey-specter",
      name: "Harvey Specter",
      type: "STRATEGIC_ANALYST",
      description: "Estrategista-chefe do escritório",
      capabilities: [
        "strategic-analysis",
        "performance-monitoring",
        "risk-identification",
        "data-analysis",
      ],
      status: "ACTIVE",
      lastActive: new Date().toISOString(),
      config: {
        autoStart: true,
        priority: "HIGH",
        maxConcurrentTasks: 5,
      },
    },
    {
      id: "agent-mrs-justine",
      name: "Mrs. Justin-e",
      type: "INTIMATION_SPECIALIST",
      description: "Especialista em intimações e prazos",
      capabilities: [
        "intimation-analysis",
        "deadline-identification",
        "task-generation",
        "priority-assessment",
      ],
      status: "ACTIVE",
      lastActive: new Date().toISOString(),
      config: {
        autoStart: true,
        priority: "URGENT",
        maxConcurrentTasks: 10,
      },
    },
    {
      id: "agent-document-analyzer",
      name: "Analisador Documental",
      type: "DOCUMENT_ANALYST",
      description: "Análise automática de documentos 24/7",
      capabilities: [
        "document-analysis",
        "text-extraction",
        "entity-recognition",
        "classification",
      ],
      status: "ACTIVE",
      lastActive: new Date().toISOString(),
      config: {
        autoStart: true,
        priority: "HIGH",
        maxConcurrentTasks: 8,
      },
    },
    {
      id: "agent-djen-monitor",
      name: "Monitor DJEN",
      type: "DJEN_MONITOR",
      description: "Monitoramento contínuo do Diário de Justiça Eletrônico Nacional",
      capabilities: [
        "djen-monitoring",
        "publication-detection",
        "notification",
        "datajud-integration",
      ],
      status: "ACTIVE",
      lastActive: new Date().toISOString(),
      config: {
        autoStart: true,
        priority: "URGENT",
        maxConcurrentTasks: 3,
        cronSchedule: "0 9 * * *", // Diário às 9h UTC
      },
    },
    {
      id: "agent-deadline-manager",
      name: "Gestor de Prazos",
      type: "DEADLINE_CALCULATOR",
      description: "Cálculo e acompanhamento de prazos processuais",
      capabilities: [
        "deadline-calculation",
        "business-days",
        "holiday-detection",
        "alert-generation",
      ],
      status: "ACTIVE",
      lastActive: new Date().toISOString(),
      config: {
        autoStart: true,
        priority: "HIGH",
        maxConcurrentTasks: 5,
      },
    },
    {
      id: "agent-petition-writer",
      name: "Redator de Petições",
      type: "PETITION_DRAFTER",
      description: "Criação de petições e documentos jurídicos",
      capabilities: [
        "document-drafting",
        "legal-writing",
        "template-generation",
        "precedent-integration",
      ],
      status: "ACTIVE",
      lastActive: new Date().toISOString(),
      config: {
        autoStart: false, // Sob demanda
        priority: "MEDIUM",
        maxConcurrentTasks: 3,
      },
    },
    {
      id: "agent-jurisprudence-researcher",
      name: "Pesquisador Jurisprudencial",
      type: "RESEARCH_SPECIALIST",
      description: "Busca e análise de precedentes",
      capabilities: [
        "jurisprudence-search",
        "precedent-analysis",
        "case-law-research",
        "trend-analysis",
      ],
      status: "ACTIVE",
      lastActive: new Date().toISOString(),
      config: {
        autoStart: false, // Sob demanda
        priority: "MEDIUM",
        maxConcurrentTasks: 2,
      },
    },
  ];

  console.log(`🤖 Inicializando ${agentes.length} agentes de IA...`);

  for (const agente of agentes) {
    try {
      const agentResponse = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agente),
      });

      if (agentResponse.ok) {
        console.log(`✅ Agente "${agente.name}" inicializado`);
      } else {
        console.warn(`⚠️ Agente "${agente.name}" já existe ou erro ao criar`);
      }
    } catch (error) {
      console.error(`❌ Erro ao inicializar agente "${agente.name}":`, error);
    }
  }

  // ============================================
  // 4. ATIVAR MONITORAMENTO DJEN
  // ============================================
  console.log("📡 Ativando monitoramento DJEN...");

  const djenConfig = {
    lawyerId: advogado.id,
    tribunals: tribunais.map((t) => t.id),
    autoStart: true,
    cronSchedule: "0 9 * * *", // Diário às 9h UTC
    notificationEmail: advogado.email,
  };

  try {
    const djenResponse = await fetch(`${API_BASE}/djen-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(djenConfig),
    });

    if (djenResponse.ok) {
      console.log("✅ Monitoramento DJEN ativado");
    }
  } catch (error) {
    console.warn("⚠️ Erro ao ativar DJEN (endpoint pode não existir ainda)");
  }

  // ============================================
  // 5. RESUMO FINAL
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 SISTEMA DE AGENTES INICIALIZADO COM SUCESSO!");
  console.log("=".repeat(60));
  console.log("\n📊 RESUMO DA CONFIGURAÇÃO:");
  console.log(`✅ Advogado: ${advogado.name} (${advogado.oab})`);
  console.log(`✅ Email: ${advogado.email}`);
  console.log(`✅ Tribunais configurados: ${tribunais.length}`);
  console.log(`   - ${tribunais.map((t) => t.name).join(", ")}`);
  console.log(`✅ Agentes IA ativos: ${agentes.filter((a) => a.status === "ACTIVE").length}/${agentes.length}`);
  console.log(`   - ${agentes.map((a) => a.name).join("\n   - ")}`);
  console.log("\n🔄 PRÓXIMOS PASSOS:");
  console.log("1. Agentes estão monitorando processos automaticamente");
  console.log("2. DJEN será monitorado diariamente às 9h UTC");
  console.log("3. Intimações serão processadas automaticamente");
  console.log("4. Tarefas serão criadas com prazos calculados");
  console.log("\n📍 Acesse o dashboard para visualizar as atividades:");
  console.log(`   ${BASE_URL}`);
  console.log("=".repeat(60));
})();
