/** Une clases condicionales sin dependencias externas. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Pesos chilenos: 1269200 → "$1.269.200". */
export function formatCLP(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString("es-CL")}`;
}

/** Fecha para un <input type="date">: "2026-11-01". */
export function toDateInput(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** Hoy en Chile como "2026-11-01". */
export function todayInput() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}

/** Fecha guardada a mediodía UTC: se muestra sin correrse de día. */
export function formatDateLong(date: Date) {
  return date.toLocaleDateString("es-CL", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateUTC(date: Date) {
  return date.toLocaleDateString("es-CL", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
