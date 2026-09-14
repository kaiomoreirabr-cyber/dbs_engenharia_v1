export const DAY_KEYS = ["seg", "ter", "qua", "qui", "sex", "sab"];

export const DAY_LABELS = {
  seg: "SEG",
  ter: "TER",
  qua: "QUA",
  qui: "QUI",
  sex: "SEX",
  sab: "SÁB",
};

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Retorna a segunda-feira (ISO) da semana da data informada, no formato YYYY-MM-DD. */
export function getWeekStart(date = new Date()) {
  const clone = new Date(date);
  const weekday = clone.getDay(); // 0 = domingo ... 6 = sábado
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  clone.setDate(clone.getDate() + diffToMonday);
  clone.setHours(0, 0, 0, 0);
  return toISODate(clone);
}

export function addWeeks(weekStartISO, amount) {
  const [year, month, day] = weekStartISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount * 7);
  return toISODate(date);
}

export function getWeekEnd(weekStartISO) {
  const [year, month, day] = weekStartISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 5);
  return toISODate(date);
}

export function formatWeekRange(weekStartISO) {
  const format = (iso) => {
    const [, month, day] = iso.split("-");
    return `${day}/${month}`;
  };
  return `${format(weekStartISO)} a ${format(getWeekEnd(weekStartISO))}`;
}

export function isCurrentWeek(weekStartISO) {
  return weekStartISO === getWeekStart();
}

// ==================== ALTERAÇÃO: períodos de fechamento ====================
// Tudo abaixo é novo. Antes o app só entendia "semana" (1 bloco de 6 dias).
// Agora cada obra escolhe um "período de fechamento": semanal (1 semana) ou
// quinzenal (2 semanas seguidas). As funções abaixo generalizam a navegação
// e os cálculos de data para trabalhar com 1 ou 2 semanas, sem quebrar as
// funções de semana já existentes acima (que continuam sendo usadas
// internamente, semana a semana).

/** Quantas semanas cada período de fechamento cobre. */
export const CLOSING_PERIODS = {
  semanal: { value: "semanal", label: "Semanal", weeks: 1 },
  quinzenal: { value: "quinzenal", label: "Quinzenal", weeks: 2 },
};

/** Valor padrão usado quando a obra ainda não tem período definido. */
export const DEFAULT_CLOSING_PERIOD = "quinzenal";

/** Garante que sempre teremos um período válido ('semanal' ou 'quinzenal'). */
export function normalizeClosingPeriod(closingPeriod) {
  return CLOSING_PERIODS[closingPeriod] ? closingPeriod : DEFAULT_CLOSING_PERIOD;
}

/**
 * Retorna a lista de segundas-feiras (uma por semana) que compõem o período
 * de fechamento a partir de "periodStart".
 * - semanal  -> [segunda]
 * - quinzenal -> [segunda da semana 1, segunda da semana 2]
 */
export function getPeriodWeekStarts(periodStart, closingPeriod = DEFAULT_CLOSING_PERIOD) {
  const { weeks } = CLOSING_PERIODS[normalizeClosingPeriod(closingPeriod)];
  return Array.from({ length: weeks }, (_, index) => addWeeks(periodStart, index));
}

/** Último dia (sábado) do período de fechamento, no formato YYYY-MM-DD. */
export function getPeriodEnd(periodStart, closingPeriod = DEFAULT_CLOSING_PERIOD) {
  const weekStarts = getPeriodWeekStarts(periodStart, closingPeriod);
  const lastWeekStart = weekStarts[weekStarts.length - 1];
  return getWeekEnd(lastWeekStart);
}

/** Avança/retrocede "amount" períodos inteiros (1 ou 2 semanas de cada vez). */
export function addPeriods(periodStart, amount, closingPeriod = DEFAULT_CLOSING_PERIOD) {
  const { weeks } = CLOSING_PERIODS[normalizeClosingPeriod(closingPeriod)];
  return addWeeks(periodStart, amount * weeks);
}

/** Ex.: "04/08 a 09/08" (semanal) ou "04/08 a 16/08" (quinzenal). */
export function formatPeriodRange(periodStart, closingPeriod = DEFAULT_CLOSING_PERIOD) {
  const format = (iso) => {
    const [, month, day] = iso.split("-");
    return `${day}/${month}`;
  };
  return `${format(periodStart)} a ${format(getPeriodEnd(periodStart, closingPeriod))}`;
}

/** true se a data de hoje cai dentro do período de fechamento informado. */
export function isCurrentPeriod(periodStart, closingPeriod = DEFAULT_CLOSING_PERIOD) {
  const todayISO = toISODate(new Date());
  const periodEnd = getPeriodEnd(periodStart, closingPeriod);
  // Comparação de strings funciona pois as datas estão no formato ISO
  // (YYYY-MM-DD), que ordena igual à ordem cronológica.
  return todayISO >= periodStart && todayISO <= periodEnd;
}

// ==================== ALTERAÇÃO: navegação mobile (tela "Chamada") ====================
/**
 * Retorna a chave do dia de hoje (DAY_KEYS) — "seg", "ter" etc. Usado para
 * já abrir a Chamada na aba do dia certo quando o usuário entra na tela.
 * Se hoje for domingo (obra não trabalha), cai em "seg" como padrão.
 */
export function getTodayDayKey() {
  const weekdayToKey = { 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab" };
  return weekdayToKey[new Date().getDay()] || "seg";
}
