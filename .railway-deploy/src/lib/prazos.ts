import type { Feriado } from "@/types";
import { addDays, differenceInDays, format, isWeekend, parseISO } from "date-fns";

/**
 * Feriados nacionais fixos para 2025.
 * Obs.: se o prazo ultrapassar o ano, estes feriados não cobrem 2026+.
 */
const feriadosNacionais2025: Feriado[] = [
  { data: "2025-01-01", nome: "Ano Novo", tipo: "nacional" },
  { data: "2025-04-18", nome: "Sexta-feira Santa", tipo: "nacional" },
  { data: "2025-04-21", nome: "Tiradentes", tipo: "nacional" },
  { data: "2025-05-01", nome: "Dia do Trabalho", tipo: "nacional" },
  { data: "2025-06-19", nome: "Corpus Christi", tipo: "nacional" },
  { data: "2025-09-07", nome: "Independência do Brasil", tipo: "nacional" },
  { data: "2025-10-12", nome: "Nossa Senhora Aparecida", tipo: "nacional" },
  { data: "2025-11-02", nome: "Finados", tipo: "nacional" },
  { data: "2025-11-15", nome: "Proclamação da República", tipo: "nacional" },
  { data: "2025-12-25", nome: "Natal", tipo: "nacional" },
];

/**
 * Retorna cópia da lista de feriados (para evitar mutação externa).
 */
export function getFeriadosNacionais(): Feriado[] {
  return [...feriadosNacionais2025];
}

/**
 * Verifica se uma data é feriado nacional conhecido.
 */
export function isFeriado(date: Date): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  return feriadosNacionais2025.some((f) => f.data === dateStr);
}

/**
 * Verifica se é dia útil (não é sábado/domingo nem feriado).
 */
export function isDiaUtil(date: Date): boolean {
  return !isWeekend(date) && !isFeriado(date);
}

/**
 * Contagem em dias ÚTEIS (padrão CPC), a partir da data de início.
 * - dataInicio não é contada; começa no dia seguinte.
 * - pula fins de semana e feriados nacionais cadastrados.
 * - garante que a data final também caia em dia útil.
 */
export function calcularPrazoCPC(dataInicio: Date, diasCorridos: number): Date {
  let dataFinal = dataInicio;
  let diasContados = 0;

  while (diasContados < diasCorridos) {
    dataFinal = addDays(dataFinal, 1);
    if (isDiaUtil(dataFinal)) {
      diasContados++;
    }
  }

  // Se por algum motivo cair em não útil, ajusta para o próximo útil
  while (!isDiaUtil(dataFinal)) {
    dataFinal = addDays(dataFinal, 1);
  }

  return dataFinal;
}

/**
 * Contagem em dias CORRIDOS (padrão CLT na sua lógica):
 * - soma diasCorridos em calendário
 * - se cair em fim de semana/feriado, empurra para o próximo dia útil.
 */
export function calcularPrazoCLT(dataInicio: Date, diasCorridos: number): Date {
  let dataFinal = addDays(dataInicio, diasCorridos);

  while (!isDiaUtil(dataFinal)) {
    dataFinal = addDays(dataFinal, 1);
  }

  return dataFinal;
}

/**
 * Calcula quantos dias faltam até uma data final (ISO yyyy-MM-dd),
 * desconsiderando horário (zera hora em ambos).
 */
export function calcularDiasRestantes(dataFinal: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const final = parseISO(dataFinal);
  final.setHours(0, 0, 0, 0);

  return differenceInDays(final, hoje);
}

/**
 * Considera urgente quando faltam entre 0 e 5 dias (inclusive).
 */
export function isUrgente(diasRestantes: number): boolean {
  return diasRestantes >= 0 && diasRestantes <= 5;
}

/**
 * Formata data ISO (yyyy-MM-dd ou ISO completo) em dd/MM/yyyy.
 */
export function formatarData(dataISO: string): string {
  const date = parseISO(dataISO);
  return format(date, "dd/MM/yyyy");
}

/**
 * Formata número CNJ bruto (com ou sem máscara) para:
 * NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function formatarNumeroCNJ(numero: string): string {
  const cleanNumber = numero.replaceAll(/\D/g, "");

  if (cleanNumber.length !== 20) return numero;

  const nnnnnnn = cleanNumber.slice(0, 7);
  const dd = cleanNumber.slice(7, 9);
  const aaaa = cleanNumber.slice(9, 13);
  const j = cleanNumber.slice(13, 14);
  const tr = cleanNumber.slice(14, 16);
  const oooo = cleanNumber.slice(16, 20);

  return `${nnnnnnn}-${dd}.${aaaa}.${j}.${tr}.${oooo}`;
}

/**
 * Validação simples de CNJ:
 * - 20 dígitos
 * - ano entre 1900 e (anoAtual + 1)
 * (não valida dígitos verificadores aqui).
 */
export function validarNumeroCNJ(numero: string): boolean {
  const cleanNumber = numero.replaceAll(/\D/g, "");

  if (cleanNumber.length !== 20) return false;

  const ano = Number.parseInt(cleanNumber.slice(9, 13), 10);
  const anoAtual = new Date().getFullYear();

  if (Number.isNaN(ano)) return false;
  if (ano < 1900 || ano > anoAtual + 1) return false;

  return true;
}

/**
 * Formata número em moeda BRL.
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}
