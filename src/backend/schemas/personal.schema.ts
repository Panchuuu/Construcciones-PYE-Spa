import { z } from "zod";

import { rutSchema } from "@/backend/schemas/admin.schema";
import { AFPS, CONTRACT_TYPES, isValidPeriod } from "@/backend/lib/payroll";
import { TERMINATION_CAUSES } from "@/backend/lib/settlement";

/** Contratos de datos del módulo de personal y remuneraciones. */

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

/**
 * Pesos chilenos: acepta "1.234.567" o "$ 1234567".
 * Vacío o ausente = 0 (los campos ocultos según el contrato no se envían).
 */
export const moneySchema = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) =>
    typeof value === "number" ? value : Number((value ?? "").replace(/[^\d-]/g, "") || 0),
  )
  .refine((value) => Number.isInteger(value) && value >= 0, {
    message: "Monto no válido",
  })
  .refine((value) => value <= 9_999_999_999, { message: "Monto demasiado grande" });

/** "39.500,12" → 39500.12 · "3,25" → 3.25 · "3.25" → 3.25 · "" → 0. */
export function parseDecimal(raw: string) {
  const value = raw.trim().replace(/\s|\$/g, "");
  if (!value) return 0;
  return value.includes(",")
    ? Number(value.replace(/\./g, "").replace(",", "."))
    : Number(value);
}

/** Decimal con coma o punto: "1,5" → 1.5. Vacío o ausente = 0. */
export const decimalSchema = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) =>
    typeof value === "number" ? value : parseDecimal(value ?? ""),
  )
  .refine((value) => Number.isFinite(value) && value >= 0, {
    message: "Número no válido",
  });

const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? new Date(`${value}T12:00:00Z`) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: "Fecha no válida",
  });

const requiredDate = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .transform((value) => new Date(`${value}T12:00:00Z`))
    .refine((value) => !Number.isNaN(value.getTime()), { message: "Fecha no válida" });

/* ── Trabajadores ──────────────────────────────────────────── */

export const ACCOUNT_TYPES = {
  vista: "Cuenta Vista / RUT",
  corriente: "Cuenta corriente",
  ahorro: "Cuenta de ahorro",
} as const;

export const employeeSchema = z
  .object({
    rut: rutSchema.refine((value) => value !== "", { message: "Escribe el RUT" }),
    name: z.string().trim().min(3, "Escribe el nombre completo").max(120),
    birthDate: optionalDate,
    nationality: optionalText(40),
    address: optionalText(150),
    phone: z
      .string()
      .trim()
      .max(20)
      .regex(/^[0-9+()\s-]*$/, "El teléfono solo puede tener números y + ( ) -")
      .optional()
      .or(z.literal("")),
    email: z.string().trim().email("Correo no válido").optional().or(z.literal("")),
    position: z.string().trim().min(2, "Indica el cargo").max(80),
    contractType: z.enum(
      Object.keys(CONTRACT_TYPES) as [keyof typeof CONTRACT_TYPES, ...(keyof typeof CONTRACT_TYPES)[]],
      { message: "Elige el tipo de contrato" },
    ),
    startDate: requiredDate("Indica la fecha de ingreso"),
    contractEndDate: optionalDate,
    baseSalary: moneySchema,
    dailyRate: moneySchema,
    weeklyHours: z.coerce
      .number()
      .int("Debe ser un número entero")
      .min(1, "Mínimo 1 hora")
      .max(45, "Máximo 45 horas"),
    gratification: z.boolean(),
    afp: optionalText(20),
    healthSystem: z.enum(["fonasa", "isapre"]),
    isapreName: optionalText(40),
    isapreUf: decimalSchema,
    mealAllowance: moneySchema,
    transportAllowance: moneySchema,
    bankName: optionalText(60),
    accountType: optionalText(20),
    accountNumber: optionalText(30),
    workId: optionalText(40),
    notes: optionalText(2000),
  })
  .superRefine((data, ctx) => {
    if (data.contractType === "dia_hombre") {
      if (data.dailyRate <= 0) {
        ctx.addIssue({ code: "custom", path: ["dailyRate"], message: "Indica el valor del día" });
      }
      return;
    }
    if (data.baseSalary <= 0) {
      ctx.addIssue({ code: "custom", path: ["baseSalary"], message: "Indica el sueldo base" });
    }
    if (!data.afp || !(data.afp in AFPS)) {
      ctx.addIssue({ code: "custom", path: ["afp"], message: "Elige la AFP" });
    }
    if (data.healthSystem === "isapre" && data.isapreUf <= 0) {
      ctx.addIssue({ code: "custom", path: ["isapreUf"], message: "Indica el plan en UF" });
    }
    if (data.contractType === "plazo_fijo" && !data.contractEndDate) {
      ctx.addIssue({ code: "custom", path: ["contractEndDate"], message: "Indica el término del plazo" });
    }
    if (data.contractEndDate && data.contractEndDate < data.startDate) {
      ctx.addIssue({ code: "custom", path: ["contractEndDate"], message: "Debe ser posterior al ingreso" });
    }
  });

export type EmployeeInput = z.infer<typeof employeeSchema>;

/* ── Parámetros previsionales ──────────────────────────────── */

const positive = (message: string) =>
  decimalSchema.refine((value) => value > 0, { message });

export const payrollParamsSchema = z.object({
  period: z.string().refine(isValidPeriod, { message: "Periodo no válido" }),
  uf: positive("Indica el valor de la UF"),
  utm: moneySchema.refine((v) => v > 0, { message: "Indica el valor de la UTM" }),
  minWage: moneySchema.refine((v) => v > 0, { message: "Indica el sueldo mínimo" }),
  topeAfpUf: positive("Indica el tope en UF"),
  topeAfcUf: positive("Indica el tope en UF"),
  afpRates: z.record(z.string(), positive("Indica la tasa")),
  sisRate: decimalSchema,
  mutualRate: decimalSchema,
  employerPensionRate: decimalSchema,
});

export type PayrollParamsInput = z.infer<typeof payrollParamsSchema>;

/* ── Liquidaciones ─────────────────────────────────────────── */

export const amountLineSchema = z.object({
  name: z.string().trim().min(1, "Describe el concepto").max(80),
  amount: moneySchema,
});

export const payslipSchema = z.object({
  employeeId: z.string().min(1, "Elige al trabajador"),
  period: z.string().refine(isValidPeriod, { message: "Elige el mes" }),
  workId: optionalText(40),
  daysWorked: decimalSchema.refine((v) => v <= 30, { message: "Máximo 30 días" }),
  overtimeHours: decimalSchema.refine((v) => v <= 200, { message: "Revisa las horas" }),
  bonuses: z.array(amountLineSchema).default([]),
  nonTaxable: z.array(amountLineSchema).default([]),
  advances: moneySchema,
  otherDiscounts: z.array(amountLineSchema).default([]),
});

export type PayslipInput = z.infer<typeof payslipSchema>;

/* ── Pagos día hombre ──────────────────────────────────────── */

export const dayPaymentSchema = z.object({
  employeeId: z.string().min(1, "Elige al trabajador"),
  workId: optionalText(40),
  date: requiredDate("Indica la fecha de pago"),
  periodText: optionalText(80),
  days: decimalSchema.refine((v) => v > 0 && v <= 62, { message: "Indica los días trabajados" }),
  dailyRate: moneySchema.refine((v) => v > 0, { message: "Indica el valor del día" }),
  extras: moneySchema,
  discounts: moneySchema,
  notes: optionalText(1000),
});

export type DayPaymentInput = z.infer<typeof dayPaymentSchema>;

/* ── Finiquitos ────────────────────────────────────────────── */

export const settlementSchema = z.object({
  employeeId: z.string().min(1, "Elige al trabajador"),
  endDate: requiredDate("Indica la fecha de término"),
  cause: z.enum(
    Object.keys(TERMINATION_CAUSES) as [keyof typeof TERMINATION_CAUSES, ...(keyof typeof TERMINATION_CAUSES)[]],
    { message: "Elige la causal" },
  ),
  lastMonthlyPay: moneySchema.refine((v) => v > 0, { message: "Indica la última remuneración" }),
  vacationMonthlyBase: moneySchema,
  noticeGiven: z.boolean(),
  vacationDaysTaken: decimalSchema,
  pendingSalary: moneySchema,
  otherEarnings: z.array(amountLineSchema).default([]),
  discounts: z.array(amountLineSchema).default([]),
  overrides: z
    .object({
      yearsOfService: moneySchema.optional(),
      noticeInLieu: moneySchema.optional(),
      workCompletion: moneySchema.optional(),
      vacation: moneySchema.optional(),
    })
    .default({}),
});

export type SettlementInput = z.infer<typeof settlementSchema>;
