/**
 * Cálculo de remuneraciones según la legislación chilena.
 *
 * Funciones puras (sin base de datos): las usa el servidor al guardar
 * y el formulario para mostrar la liquidación en vivo, así ambos
 * calculan exactamente lo mismo.
 *
 * Los valores que cambian en el tiempo (UF, UTM, sueldo mínimo, topes,
 * tasas de AFP, SIS…) NO están aquí: vienen de los parámetros mensuales
 * que se cargan en el panel (/admin/personal/parametros).
 */

/* ── Catálogos ─────────────────────────────────────────────── */

export const CONTRACT_TYPES = {
  plazo_fijo: "Plazo fijo",
  obra_faena: "Por obra o faena",
  indefinido: "Indefinido",
  dia_hombre: "Día hombre (pago diario)",
} as const;

export type ContractType = keyof typeof CONTRACT_TYPES;

export const EMPLOYEE_STATUSES = {
  activo: "Activo",
  desvinculado: "Desvinculado",
} as const;

/** Contratos que reciben liquidación de sueldo (el día hombre no). */
export function hasPayslip(contractType: string) {
  return contractType !== "dia_hombre";
}

export const AFPS = {
  capital: "Capital",
  cuprum: "Cuprum",
  habitat: "Habitat",
  modelo: "Modelo",
  planvital: "PlanVital",
  provida: "ProVida",
  uno: "Uno",
} as const;

export type AfpCode = keyof typeof AFPS;

export const HEALTH_SYSTEMS = {
  fonasa: "Fonasa",
  isapre: "Isapre",
} as const;

/* ── Parámetros del mes ────────────────────────────────────── */

export type PayrollParamsData = {
  /** Valor de la UF del último día del mes. */
  uf: number;
  /** Valor de la UTM del mes. */
  utm: number;
  /** Ingreso mínimo mensual. */
  minWage: number;
  /** Tope imponible AFP, salud y SIS, en UF. */
  topeAfpUf: number;
  /** Tope imponible seguro de cesantía, en UF. */
  topeAfcUf: number;
  /** % total que descuenta cada AFP al trabajador (10% + comisión). */
  afpRates: Record<string, number>;
  /** % Seguro de Invalidez y Sobrevivencia (cargo empleador). */
  sisRate: number;
  /** % Mutual / ISL, ley 16.744 (cargo empleador). */
  mutualRate: number;
  /** % aporte del empleador de la reforma previsional. */
  employerPensionRate: number;
};

/**
 * Valores de respaldo para precargar un mes si nunca se pudo sincronizar
 * con Previred (ver indicators-sync.service.ts, que los trae solos).
 */
export const REFERENCE_PARAMS: PayrollParamsData = {
  // Previred, octubre de 2026. Solo se usan si nunca se pudo sincronizar.
  uf: 41247.63,
  utm: 72151,
  minWage: 553553,
  topeAfpUf: 90,
  topeAfcUf: 135.2,
  afpRates: {
    capital: 11.44,
    cuprum: 11.44,
    habitat: 11.27,
    modelo: 10.58,
    planvital: 11.16,
    provida: 11.45,
    uno: 10.46,
  },
  sisRate: 1.78,
  mutualRate: 0.93,
  employerPensionRate: 3.5,
};

/**
 * Tabla del impuesto único de segunda categoría (mensual), en UTM.
 * Los tramos están fijados en UTM por ley, así que no cambian mes a mes.
 */
const TAX_BRACKETS = [
  { upTo: 13.5, rate: 0, rebate: 0 },
  { upTo: 30, rate: 0.04, rebate: 0.54 },
  { upTo: 50, rate: 0.08, rebate: 1.74 },
  { upTo: 70, rate: 0.135, rebate: 4.49 },
  { upTo: 90, rate: 0.23, rebate: 11.14 },
  { upTo: 120, rate: 0.304, rebate: 17.8 },
  { upTo: 310, rate: 0.35, rebate: 23.32 },
  { upTo: Infinity, rate: 0.4, rebate: 38.82 },
];

export function incomeTax(taxable: number, utm: number) {
  if (taxable <= 0 || utm <= 0) return 0;
  const inUtm = taxable / utm;
  const bracket = TAX_BRACKETS.find((b) => inUtm <= b.upTo)!;
  return Math.max(0, Math.round(taxable * bracket.rate - bracket.rebate * utm));
}

/* ── Liquidación de sueldo ─────────────────────────────────── */

export type PayrollEmployee = {
  contractType: string;
  baseSalary: number;
  weeklyHours: number;
  gratification: boolean;
  afp: string | null;
  healthSystem: string;
  isapreName?: string | null;
  isapreUf: number | null;
};

export type AmountLine = { name: string; amount: number };

export type PayslipInputData = {
  /** Días trabajados en el mes (30 = mes completo). */
  daysWorked: number;
  /** Horas extraordinarias (se pagan con 50% de recargo). */
  overtimeHours: number;
  /** Bonos y otros haberes imponibles. */
  bonuses: AmountLine[];
  /** Haberes no imponibles: colación, movilización, viáticos… */
  nonTaxable: AmountLine[];
  /** Anticipos de sueldo ya pagados en el mes. */
  advances: number;
  /** Otros descuentos: préstamos, cuotas, etc. */
  otherDiscounts: AmountLine[];
};

export type PayslipResult = {
  earnings: AmountLine[]; // haberes imponibles
  taxableTotal: number; // total imponible
  nonTaxable: AmountLine[];
  nonTaxableTotal: number;
  grossTotal: number; // total haberes
  legalDeductions: AmountLine[]; // AFP, salud, AFC, impuesto
  legalDeductionsTotal: number;
  otherDeductions: AmountLine[]; // anticipos y otros
  otherDeductionsTotal: number;
  deductionsTotal: number;
  netPay: number; // líquido a pagar
  /** Base para el impuesto único. */
  incomeTaxBase: number;
  employerCosts: AmountLine[];
  employerCostsTotal: number;
  /** Total haberes + aportes del empleador. */
  companyCost: number;
  warnings: string[];
};

const pct = (base: number, rate: number) => Math.round((base * rate) / 100);

/** Valor de una hora extra: sueldo/30 × 28 / (jornada × 4) × 1,5. */
export function overtimeHourValue(baseSalary: number, weeklyHours: number) {
  if (weeklyHours <= 0) return 0;
  return ((baseSalary / 30) * 28) / (weeklyHours * 4) * 1.5;
}

/** Gratificación legal art. 50: 25% de lo imponible con tope de 4,75 IMM al año. */
export function monthlyGratification(
  taxableBase: number,
  minWage: number,
  daysWorked = 30,
) {
  const cap = ((4.75 * minWage) / 12) * (daysWorked / 30);
  return Math.round(Math.min(taxableBase * 0.25, cap));
}

/** % de cesantía (AFC) según el tipo de contrato. */
export function afcRates(contractType: string) {
  if (contractType === "indefinido") return { worker: 0.6, employer: 2.4 };
  if (contractType === "plazo_fijo" || contractType === "obra_faena") {
    return { worker: 0, employer: 3 };
  }
  return { worker: 0, employer: 0 };
}

export function computePayslip(
  employee: PayrollEmployee,
  input: PayslipInputData,
  params: PayrollParamsData,
): PayslipResult {
  const warnings: string[] = [];
  const days = Math.min(30, Math.max(0, input.daysWorked));

  /* Haberes imponibles */
  const salary = Math.round((employee.baseSalary * days) / 30);
  const overtime = Math.round(
    overtimeHourValue(employee.baseSalary, employee.weeklyHours) *
      Math.max(0, input.overtimeHours),
  );
  const bonuses = input.bonuses.filter((b) => b.amount > 0);
  const bonusTotal = bonuses.reduce((s, b) => s + b.amount, 0);

  const earnings: AmountLine[] = [
    { name: `Sueldo base (${days} días)`, amount: salary },
  ];
  if (overtime > 0) {
    earnings.push({
      name: `Horas extra (${input.overtimeHours} h al 50%)`,
      amount: overtime,
    });
  }
  earnings.push(...bonuses);

  if (employee.gratification) {
    const gratification = monthlyGratification(
      salary + overtime + bonusTotal,
      params.minWage,
      days,
    );
    if (gratification > 0) {
      earnings.push({ name: "Gratificación legal (art. 50)", amount: gratification });
    }
  }

  const taxableTotal = earnings.reduce((s, e) => s + e.amount, 0);

  /* No imponibles */
  const nonTaxable = input.nonTaxable.filter((n) => n.amount > 0);
  const nonTaxableTotal = nonTaxable.reduce((s, n) => s + n.amount, 0);
  const grossTotal = taxableTotal + nonTaxableTotal;

  /* Bases con tope */
  const afpBase = Math.min(taxableTotal, Math.round(params.topeAfpUf * params.uf));
  const afcBase = Math.min(taxableTotal, Math.round(params.topeAfcUf * params.uf));

  /* Descuentos legales */
  const legalDeductions: AmountLine[] = [];

  const afpRate = employee.afp ? params.afpRates[employee.afp] : undefined;
  let afp = 0;
  if (afpRate === undefined) {
    warnings.push("El trabajador no tiene AFP asignada o falta su tasa en los parámetros del mes.");
  } else {
    afp = pct(afpBase, afpRate);
    legalDeductions.push({
      name: `AFP ${employee.afp ? (AFPS[employee.afp as AfpCode] ?? employee.afp) : ""} (${afpRate.toLocaleString("es-CL")}%)`,
      amount: afp,
    });
  }

  const legalHealth = pct(afpBase, 7);
  let health = legalHealth;
  let healthLabel = "Salud Fonasa (7%)";
  if (employee.healthSystem === "isapre") {
    const plan = Math.round((employee.isapreUf ?? 0) * params.uf);
    health = Math.max(legalHealth, plan);
    healthLabel = `Salud Isapre${employee.isapreName ? ` ${employee.isapreName}` : ""} (${(employee.isapreUf ?? 0).toLocaleString("es-CL")} UF)`;
    if (!employee.isapreUf) {
      warnings.push("El trabajador está en Isapre pero no tiene el valor del plan en UF: se descontó el 7% legal.");
    }
  }
  legalDeductions.push({ name: healthLabel, amount: health });

  const afcRate = afcRates(employee.contractType);
  const afcWorker = pct(afcBase, afcRate.worker);
  if (afcWorker > 0) {
    legalDeductions.push({ name: `Seguro de cesantía (${afcRate.worker}%)`, amount: afcWorker });
  }

  // Para el impuesto solo se rebaja la salud hasta el 7% legal.
  const incomeTaxBase = Math.max(0, taxableTotal - afp - Math.min(health, legalHealth) - afcWorker);
  const tax = incomeTax(incomeTaxBase, params.utm);
  if (tax > 0) legalDeductions.push({ name: "Impuesto único", amount: tax });

  const legalDeductionsTotal = legalDeductions.reduce((s, d) => s + d.amount, 0);

  /* Otros descuentos */
  const otherDeductions: AmountLine[] = [];
  if (input.advances > 0) otherDeductions.push({ name: "Anticipo de sueldo", amount: input.advances });
  otherDeductions.push(...input.otherDiscounts.filter((d) => d.amount > 0));
  const otherDeductionsTotal = otherDeductions.reduce((s, d) => s + d.amount, 0);

  const deductionsTotal = legalDeductionsTotal + otherDeductionsTotal;
  const netPay = grossTotal - deductionsTotal;
  if (netPay < 0) warnings.push("Los descuentos superan los haberes: el líquido queda negativo.");

  /* Aportes del empleador (no se descuentan al trabajador) */
  const employerCosts: AmountLine[] = [
    { name: `SIS (${params.sisRate}%)`, amount: pct(afpBase, params.sisRate) },
    { name: `Cesantía empleador (${afcRate.employer}%)`, amount: pct(afcBase, afcRate.employer) },
    { name: `Mutual ley 16.744 (${params.mutualRate}%)`, amount: pct(afpBase, params.mutualRate) },
    { name: `Aporte empleador reforma previsional (${params.employerPensionRate}%)`, amount: pct(afpBase, params.employerPensionRate) },
  ].filter((c) => c.amount > 0);
  const employerCostsTotal = employerCosts.reduce((s, c) => s + c.amount, 0);

  /* Avisos */
  const fullTimeMin = Math.round((params.minWage * Math.min(employee.weeklyHours, 42)) / 42);
  if (employee.baseSalary < fullTimeMin) {
    warnings.push("El sueldo base es menor al ingreso mínimo para la jornada pactada.");
  }

  return {
    earnings,
    taxableTotal,
    nonTaxable,
    nonTaxableTotal,
    grossTotal,
    legalDeductions,
    legalDeductionsTotal,
    otherDeductions,
    otherDeductionsTotal,
    deductionsTotal,
    netPay,
    incomeTaxBase,
    employerCosts,
    employerCostsTotal,
    companyCost: grossTotal + employerCostsTotal,
    warnings,
  };
}

/* ── Utilidades de periodo ─────────────────────────────────── */

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-11" → "noviembre 2026". */
export function formatPeriod(period: string) {
  const [year, month] = period.split("-").map(Number);
  return `${MONTHS[(month ?? 1) - 1] ?? ""} ${year}`;
}

/** Periodo actual en Chile: "2026-11". */
export function currentPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  return `${y}-${m}`;
}

export function isValidPeriod(period: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}
