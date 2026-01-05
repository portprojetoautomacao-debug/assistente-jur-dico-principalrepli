import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ==== CLASSES (Tailwind + clsx) =============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==== CSV EXPORT ============================================================

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (globalThis.window === undefined) return;
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        // Garantir stringify seguro
        let stringValue: string;
        if (typeof value === "string") {
          stringValue = value;
        } else if (typeof value === "object" && value !== null) {
          stringValue = JSON.stringify(value);
        } else {
          stringValue = String(value);
        }
        return `"${stringValue.replaceAll('"', '""')}"`;
      })
      .join(",")
  );

  const csv = [csvHeaders, ...csvRows].join("\n");

  // BOM UTF-8 evita caracteres bugados no Excel
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ==== EXCEL (XLSX) EXPORT (opcional, requer pacote 'xlsx') ==================

/**
 * Exporta dados para Excel (.xlsx)
 *
 * @note Funcionalidade desabilitada - pacote xlsx não instalado.
 * Para habilitar, instale: npm install xlsx
 * E descomente o código abaixo.
 */
export async function exportToXLSX(data: Record<string, unknown>[], filename: string) {
  if (globalThis.window === undefined) return;
  if (!data || data.length === 0) return;

  // Funcionalidade desabilitada - xlsx não está instalado
  // Para habilitar, instale xlsx e descomente o código abaixo
  console.warn(
    "[exportToXLSX] Funcionalidade desabilitada. Instale 'xlsx' para habilitar exportação Excel."
  );

  // Fallback: exportar como CSV
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          // Garantir stringify seguro
          let str: string;
          if (typeof val === "string") {
            str = val;
          } else if (typeof val === "object" && val !== null) {
            str = JSON.stringify(val);
          } else {
            str = String(val);
          }
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replaceAll('"', '""')}"`
            : str;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ==== MOEDA =================================================================

export function formatCurrency(value: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

// ==== DATAS GENÉRICAS (sem timezone fixo) ===================================

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}

// ==== DATAS COM TIMEZONE FIXO (America/Sao_Paulo) ===========================

const DEFAULT_TZ = "America/Sao_Paulo";

export function formatDateTz(date: string | Date, timeZone: string = DEFAULT_TZ): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    // fallback se o browser não suportar TZ
    return d.toLocaleDateString("pt-BR");
  }
}

export function formatDateTimeTz(date: string | Date, timeZone: string = DEFAULT_TZ): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString("pt-BR");
  }
}

// ==== HELPERS ESPECÍFICOS PJe (dd/MM/yyyy + hora) ===========================

/**
 * Converte "dd/MM/yyyy" → Date (timezone Brasil)
 */
export function parsePjeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm) - 1;
  const year = Number(yyyy);

  const d = new Date(year, month, day);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Converte "dd/MM/yyyy" + "HH:mm" → Date
 */
export function parsePjeDateTime(dateStr: string, timeStr?: string): Date | null {
  const baseDate = parsePjeDate(dateStr);
  if (!baseDate) return null;

  if (!timeStr) return baseDate;

  const match = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!match) return baseDate;

  const [, hh, mm] = match;
  baseDate.setHours(Number(hh), Number(mm), 0, 0);
  return baseDate;
}

/**
 * Formata Date → "dd/MM/yyyy" no padrão PJe
 */
export function formatPjeDate(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formata Date → "dd/MM/yyyy HH:mm" no padrão PJe
 */
export function formatPjeDateTime(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}
