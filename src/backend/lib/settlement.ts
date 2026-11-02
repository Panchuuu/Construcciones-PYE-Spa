/**
 * Cálculo de finiquitos (término de contrato) según el Código del Trabajo.
 *
 * Funciones puras: las usa el servidor al guardar y el formulario para
 * mostrar la propuesta en vivo. Todo monto propuesto puede corregirse
 * a mano antes de emitir el documento.
 */

import type { AmountLine } from "@/backend/lib/payroll";

export const TERMINATION_CAUSES = {
  "159-1": "Art. 159 N°1 — Mutuo acuerdo de las partes",
  "159-2": "Art. 159 N°2 — Renuncia del trabajador",
  "159-4": "Art. 159 N°4 — Vencimiento del plazo convenido",
  "159-5": "Art. 159 N°5 — Conclusión del trabajo o servicio (obra o faena)",
  "160": "Art. 160 — Despido por conducta del trabajador",
  "161-1": "Art. 161 inc. 1 — Necesidades de la empresa",
} as const;

export type TerminationCause = keyof typeof TERMINATION_CAUSES;

export type SettlementEmployee = {
  contractType: string;
  startDate: Date;
};

export type SettlementInputData = {
  endDate: Date;
  cause: string;
  /** Última remuneración mensual (base para indemnizaciones, art. 172). */
  lastMonthlyPay: number;
  /** Remuneración mensual para valorizar el feriado (sueldo + gratificación). */
  vacationMonthlyBase: number;
  /** ¿Se avisó el despido con 30 días de anticipación? */
  noticeGiven: boolean;
  /** Días hábiles de vacaciones ya tomados en toda la relación laboral. */
  vacationDaysTaken: number;
  /** Remuneración del último mes aún no pagada. */
  pendingSalary: number;
  otherEarnings: AmountLine[];
  discounts: AmountLine[];
  /** Montos corregidos a mano: clave del concepto → monto. */
  overrides: Partial<Record<SettlementConcept, number>>;
};

export type SettlementConcept =
  | "yearsOfService"
  | "noticeInLieu"
  | "workCompletion"
  | "vacation";

export type SettlementResult = {
  /** Tiempo servido. */
  service: { years: number; months: number; days: number; totalMonths: number };
  vacation: {
    accruedDays: number; // hábiles devengados
    pendingWorkingDays: number; // hábiles pendientes
    calendarDays: number; // corridos a pagar
  };
  earnings: (AmountLine & { concept?: SettlementConcept; note?: string })[];
  earningsTotal: number;
  discounts: AmountLine[];
  discountsTotal: number;
  total: number;
  warnings: string[];
};

const DAY_MS = 86_400_000;

/** Diferencia en años, meses y días (calendario) entre dos fechas. */
export function serviceTime(start: Date, end: Date) {
  // El día de término cuenta como trabajado: se mide hasta el día siguiente.
  const until = new Date(end.getTime() + DAY_MS);
  let years = until.getUTCFullYear() - start.getUTCFullYear();
  let months = until.getUTCMonth() - start.getUTCMonth();
  let days = until.getUTCDate() - start.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(
      Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), 0),
    ).getUTCDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return { years: 0, months: 0, days: 0, totalMonths: 0 };
  return { years, months, days, totalMonths: years * 12 + months };
}

/**
 * Convierte días hábiles de feriado en días corridos a pagar: se cuentan
 * desde el día siguiente al término y se suman sábados y domingos.
 * (Los feriados legales no se descuentan aquí: si cae alguno, corrige
 * el monto a mano.)
 */
export function workingToCalendarDays(endDate: Date, workingDays: number) {
  const whole = Math.floor(workingDays);
  const fraction = workingDays - whole;
  let calendar = 0;
  let counted = 0;
  let cursor = endDate.getTime();
  while (counted < whole) {
    cursor += DAY_MS;
    calendar += 1;
    const weekday = new Date(cursor).getUTCDay();
    if (weekday !== 0 && weekday !== 6) counted += 1;
  }
  return Math.round((calendar + fraction) * 100) / 100;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function computeSettlement(
  employee: SettlementEmployee,
  input: SettlementInputData,
  uf: number,
): SettlementResult {
  const warnings: string[] = [];
  const service = serviceTime(employee.startDate, input.endDate);
  const cap90Uf = Math.round(90 * uf);
  const indemnityBase = Math.min(input.lastMonthlyPay, cap90Uf);
  if (input.lastMonthlyPay > cap90Uf) {
    warnings.push("La remuneración supera las 90 UF: las indemnizaciones se calcularon con ese tope.");
  }

  const earnings: SettlementResult["earnings"] = [];
  const pick = (concept: SettlementConcept, proposed: number) =>
    input.overrides[concept] ?? proposed;

  /* Remuneración pendiente */
  if (input.pendingSalary > 0) {
    earnings.push({ name: "Remuneración pendiente del último mes", amount: input.pendingSalary });
  }

  /* Indemnización por años de servicio (art. 163): solo art. 161 */
  if (input.cause === "161-1") {
    if (service.years >= 1) {
      // Un mes por año y fracción superior a 6 meses, con tope de 11.
      const years = Math.min(11, service.years + (service.months >= 6 && (service.months > 6 || service.days > 0) ? 1 : 0));
      earnings.push({
        concept: "yearsOfService",
        name: `Indemnización por años de servicio (${years} ${years === 1 ? "año" : "años"})`,
        amount: pick("yearsOfService", indemnityBase * years),
      });
    } else {
      warnings.push("Con menos de un año de servicio no corresponde indemnización por años de servicio.");
    }

    if (!input.noticeGiven) {
      earnings.push({
        concept: "noticeInLieu",
        name: "Indemnización sustitutiva del aviso previo",
        amount: pick("noticeInLieu", indemnityBase),
      });
    }
  }

  /* Contrato por obra o faena: 2,5 días por mes (art. 163 inc. 3) */
  if (input.cause === "159-5" && employee.contractType === "obra_faena") {
    // Fracción superior a 15 días cuenta como mes completo.
    const months = service.totalMonths + (service.days > 15 ? 1 : 0);
    if (months >= 1) {
      earnings.push({
        concept: "workCompletion",
        name: `Indemnización por término de obra (2,5 días × ${months} ${months === 1 ? "mes" : "meses"})`,
        amount: pick("workCompletion", Math.round((input.lastMonthlyPay / 30) * 2.5 * months)),
      });
    }
  }
  if (input.cause === "159-5" && employee.contractType !== "obra_faena") {
    warnings.push("La causal de conclusión de obra corresponde a contratos por obra o faena.");
  }
  if (input.cause === "159-4" && employee.contractType !== "plazo_fijo") {
    warnings.push("La causal de vencimiento del plazo corresponde a contratos a plazo fijo.");
  }

  /* Feriado: 1,25 días hábiles por mes trabajado */
  const exactMonths = service.totalMonths + service.days / 30;
  const accruedDays = round2(exactMonths * 1.25);
  const pendingWorkingDays = Math.max(0, round2(accruedDays - input.vacationDaysTaken));
  const calendarDays = workingToCalendarDays(input.endDate, pendingWorkingDays);
  if (calendarDays > 0) {
    earnings.push({
      concept: "vacation",
      name: `Feriado proporcional y pendiente (${pendingWorkingDays.toLocaleString("es-CL")} días hábiles = ${calendarDays.toLocaleString("es-CL")} corridos)`,
      amount: pick("vacation", Math.round((input.vacationMonthlyBase / 30) * calendarDays)),
    });
  }

  earnings.push(...input.otherEarnings.filter((e) => e.amount > 0));
  const earningsTotal = earnings.reduce((s, e) => s + e.amount, 0);

  const discounts = input.discounts.filter((d) => d.amount > 0);
  const discountsTotal = discounts.reduce((s, d) => s + d.amount, 0);

  const total = earningsTotal - discountsTotal;
  if (total < 0) warnings.push("Los descuentos superan los haberes del finiquito.");

  return {
    service,
    vacation: { accruedDays, pendingWorkingDays, calendarDays },
    earnings,
    earningsTotal,
    discounts,
    discountsTotal,
    total,
    warnings,
  };
}

/** "3 años, 2 meses y 5 días". */
export function formatServiceTime(service: SettlementResult["service"]) {
  const parts: string[] = [];
  if (service.years) parts.push(`${service.years} ${service.years === 1 ? "año" : "años"}`);
  if (service.months) parts.push(`${service.months} ${service.months === 1 ? "mes" : "meses"}`);
  if (service.days || parts.length === 0) {
    parts.push(`${service.days} ${service.days === 1 ? "día" : "días"}`);
  }
  return parts.length > 1
    ? `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`
    : parts[0];
}
