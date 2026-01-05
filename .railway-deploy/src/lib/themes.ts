/**
 * Sistema de cores semânticas e temas para UI Premium
 * Usado em componentes como AcervoPJe, ProcessTimelineViewer, etc.
 */

export const themeConfig = {
  /**
   * Cores semânticas para tipos de evento processual
   */
  colors: {
    // Estados de urgência
    urgente: "hsl(0, 72%, 51%)", // Vermelho
    alerta: "hsl(38, 92%, 50%)", // Laranja
    sucesso: "hsl(142, 71%, 45%)", // Verde
    info: "hsl(221, 83%, 53%)", // Azul

    // Tipos de documento (alinhado com ProcessTimelineViewer)
    certidao: "hsl(199, 89%, 48%)", // Sky blue
    sentenca: "hsl(0, 72%, 51%)", // Red
    despacho: "hsl(262, 83%, 58%)", // Indigo/Purple
    peticao: "hsl(160, 84%, 39%)", // Emerald
    intimacao: "hsl(280, 65%, 60%)", // Purple
    mandado: "hsl(38, 92%, 50%)", // Amber
    juntada: "hsl(221, 83%, 53%)", // Blue
    conclusos: "hsl(173, 80%, 40%)", // Teal
  },

  /**
   * Transições e animações
   */
  transitions: {
    fast: "150ms ease",
    normal: "200ms ease",
    slow: "300ms ease-out",
  },

  /**
   * Sombras e elevações
   */
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },

  /**
   * Bordas arredondadas
   */
  radius: {
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    full: "9999px",
  },
} as const;

/**
 * Utilitário para obter cor de um tipo de evento com type guard
 */
export function getEventColor(tipo?: string): string {
  if (!tipo) return themeConfig.colors.info;

  // Type guard: verifica se o tipo existe nas cores
  const validEventTypes = [
    "urgente",
    "alerta",
    "sucesso",
    "info",
    "certidao",
    "sentenca",
    "despacho",
    "peticao",
    "intimacao",
    "mandado",
    "juntada",
    "conclusos",
  ] as const;

  type EventType = (typeof validEventTypes)[number];

  function isEventType(value: string): value is EventType {
    return validEventTypes.includes(value as EventType);
  }

  if (isEventType(tipo)) {
    return themeConfig.colors[tipo];
  }

  return themeConfig.colors.info;
}

/**
 * Utilitário para obter classe de badge baseada no tipo
 * @deprecated Use getEventBadgeStyle() para consistência com themeConfig.colors
 */
export function getEventBadgeClass(tipo?: string): string {
  const baseClass = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border";

  switch (tipo) {
    case "certidao":
      return `${baseClass} bg-sky-500/10 text-sky-600 border-sky-500/30`;
    case "mandado":
      return `${baseClass} bg-amber-500/10 text-amber-600 border-amber-500/30`;
    case "despacho":
      return `${baseClass} bg-indigo-500/10 text-indigo-600 border-indigo-500/30`;
    case "sentenca":
      return `${baseClass} bg-red-500/10 text-red-600 border-red-500/30`;
    case "peticao":
      return `${baseClass} bg-emerald-500/10 text-emerald-600 border-emerald-500/30`;
    case "intimacao":
      return `${baseClass} bg-purple-500/10 text-purple-600 border-purple-500/30`;
    case "juntada":
      return `${baseClass} bg-blue-500/10 text-blue-600 border-blue-500/30`;
    case "conclusos":
      return `${baseClass} bg-teal-500/10 text-teal-600 border-teal-500/30`;
    default:
      return `${baseClass} bg-gray-500/10 text-gray-600 border-gray-500/30`;
  }
}

/**
 * Utilitário para obter estilo inline de badge baseada no tipo
 * Usa themeConfig.colors para centralização (padrão 10% bg / 20% border)
 */
export function getEventBadgeStyle(tipo?: string): React.CSSProperties {
  const base = getEventColor(tipo);
  return {
    color: base,
    backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
    borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
  };
}

/**
 * Utilitário para obter classe de status de processo
 * @deprecated Use getStatusBadgeStyle() para consistência com themeConfig.colors
 */
export function getStatusBadgeClass(status: string): string {
  const baseClass = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border";

  switch (status) {
    case "ativo":
      return `${baseClass} bg-green-500/10 text-green-600 border-green-500/30`;
    case "suspenso":
      return `${baseClass} bg-yellow-500/10 text-yellow-600 border-yellow-500/30`;
    case "arquivado":
      return `${baseClass} bg-gray-500/10 text-gray-600 border-gray-500/30`;
    case "concluido":
      return `${baseClass} bg-blue-500/10 text-blue-600 border-blue-500/30`;
    default:
      return `${baseClass} bg-gray-500/10 text-gray-600 border-gray-500/30`;
  }
}

/**
 * Utilitário para obter estilo inline de status de processo
 * Usa themeConfig.colors para centralização (padrão 10% bg / 20% border)
 */
export function getStatusBadgeStyle(status: string): React.CSSProperties {
  const colorMap: Record<string, string> = {
    ativo: themeConfig.colors.sucesso,
    suspenso: themeConfig.colors.alerta,
    arquivado: "hsl(0, 0%, 45%)", // Gray
    concluido: themeConfig.colors.info,
  };

  const base = colorMap[status] || themeConfig.colors.info;
  return {
    color: base,
    backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
    borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
  };
}

export default themeConfig;
