import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { PayslipEmployeeOption } from "@/frontend/admin/payslip-form";
import { listWorks } from "@/backend/services/works.service";
import {
  CONTRACT_TYPES,
  hasPayslip,
  REFERENCE_PARAMS,
  computePayslip,
  formatPeriod,
  type ContractType,
  type PayrollParamsData,
  type PayslipResult,
} from "@/backend/lib/payroll";
import {
  TERMINATION_CAUSES,
  computeSettlement,
  type SettlementResult,
  type TerminationCause,
} from "@/backend/lib/settlement";
import { AUTOMATIC_CATEGORIES } from "@/backend/schemas/finanzas.schema";
import type {
  DayPaymentInput,
  PayrollParamsInput,
  PayslipInput,
  SettlementInput,
} from "@/backend/schemas/personal.schema";

type Tx = Prisma.TransactionClient;

/* ── Parámetros previsionales ──────────────────────────────── */

export function listPayrollParams() {
  return prisma.payrollParams.findMany({ orderBy: { period: "desc" } });
}

type ParamsRow = NonNullable<Awaited<ReturnType<typeof prisma.payrollParams.findUnique>>>;

export function toParamsData(row: ParamsRow): PayrollParamsData {
  let afpRates: Record<string, number> = {};
  try {
    afpRates = JSON.parse(row.afpRatesJson);
  } catch {
    afpRates = {};
  }
  return {
    uf: row.uf,
    utm: row.utm,
    minWage: row.minWage,
    topeAfpUf: row.topeAfpUf,
    topeAfcUf: row.topeAfcUf,
    afpRates,
    sisRate: row.sisRate,
    mutualRate: row.mutualRate,
    employerPensionRate: row.employerPensionRate,
  };
}

export async function getPayrollParams(period: string) {
  const row = await prisma.payrollParams.findUnique({ where: { period } });
  return row ? toParamsData(row) : null;
}

/** Valores para precargar un mes nuevo: los del último mes cargado. */
export async function suggestedPayrollParams(): Promise<PayrollParamsData> {
  const last = await prisma.payrollParams.findFirst({ orderBy: { period: "desc" } });
  return last ? toParamsData(last) : REFERENCE_PARAMS;
}

export function savePayrollParams(input: PayrollParamsInput) {
  const data = {
    uf: input.uf,
    utm: input.utm,
    minWage: input.minWage,
    topeAfpUf: input.topeAfpUf,
    topeAfcUf: input.topeAfcUf,
    afpRatesJson: JSON.stringify(input.afpRates),
    sisRate: input.sisRate,
    mutualRate: input.mutualRate,
    employerPensionRate: input.employerPensionRate,
    // Guardado a mano: la sincronización automática ya no lo sobrescribe.
    source: "manual",
    ufProvisional: false,
  };
  return prisma.payrollParams.upsert({
    where: { period: input.period },
    create: { period: input.period, ...data },
    update: data,
  });
}

export function deletePayrollParams(period: string) {
  return prisma.payrollParams.delete({ where: { period } });
}

/* ── Utilidades ────────────────────────────────────────────── */

/** Último día del mes "2026-11" (mediodía UTC para no cambiar de día en Chile). */
export function periodEndDate(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0, 12));
}

/** Datos del trabajador que se copian en cada documento. */
function employeeSnapshot(employee: {
  name: string;
  rut: string;
  position: string;
  contractType: string;
  startDate: Date;
  afp: string | null;
  healthSystem: string;
  isapreName: string | null;
  isapreUf: number | null;
  baseSalary: number;
  weeklyHours: number;
  bankName?: string | null;
  accountType?: string | null;
  accountNumber?: string | null;
}) {
  return {
    name: employee.name,
    rut: employee.rut,
    position: employee.position,
    contractType: employee.contractType,
    contractLabel: CONTRACT_TYPES[employee.contractType as ContractType] ?? employee.contractType,
    startDate: employee.startDate.toISOString(),
    afp: employee.afp,
    healthSystem: employee.healthSystem,
    isapreName: employee.isapreName,
    isapreUf: employee.isapreUf,
    baseSalary: employee.baseSalary,
    weeklyHours: employee.weeklyHours,
    bankName: employee.bankName ?? null,
    accountType: employee.accountType ?? null,
    accountNumber: employee.accountNumber ?? null,
  };
}

export type EmployeeSnapshot = ReturnType<typeof employeeSnapshot>;

async function nextFolio(
  tx: Tx,
  model: "payslip" | "settlement" | "dayPayment",
) {
  const last =
    model === "payslip"
      ? await tx.payslip.aggregate({ _max: { folio: true } })
      : model === "settlement"
        ? await tx.settlement.aggregate({ _max: { folio: true } })
        : await tx.dayPayment.aggregate({ _max: { folio: true } });
  return (last._max.folio ?? 0) + 1;
}

/* ── Liquidaciones de sueldo ───────────────────────────────── */

export type PayslipSnapshot = {
  employee: EmployeeSnapshot;
  params: PayrollParamsData;
  result: PayslipResult;
};

export class PayrollError extends Error {}

/** Calcula la liquidación con los parámetros del mes; no guarda nada. */
export async function buildPayslip(input: PayslipInput) {
  const [employee, params] = await Promise.all([
    prisma.employee.findUnique({ where: { id: input.employeeId } }),
    getPayrollParams(input.period),
  ]);
  if (!employee) throw new PayrollError("El trabajador ya no existe.");
  if (employee.contractType === "dia_hombre") {
    throw new PayrollError("Los trabajadores de día hombre se pagan desde «Pagos día hombre».");
  }
  if (!params) {
    throw new PayrollError(
      `Faltan los indicadores previsionales de ${formatPeriod(input.period)}. Cárgalos en «Parámetros» antes de emitir la liquidación.`,
    );
  }
  const result = computePayslip(employee, input, params);
  const snapshot: PayslipSnapshot = {
    employee: employeeSnapshot(employee),
    params,
    result,
  };
  return { employee, snapshot };
}

function payslipMovement(
  payslip: { id: string; period: string; companyCost: number; workId: string | null },
  employeeName: string,
) {
  return {
    type: "gasto",
    date: periodEndDate(payslip.period),
    amount: payslip.companyCost,
    category: AUTOMATIC_CATEGORIES.payslip,
    description: `Liquidación ${formatPeriod(payslip.period)} — ${employeeName}`,
    workId: payslip.workId,
    docType: "liquidacion",
    counterparty: employeeName,
    notes: "Costo empresa: total de haberes más aportes del empleador. Generado automáticamente desde la liquidación.",
  };
}

export function payslipExists(employeeId: string, period: string, exceptId?: string) {
  return prisma.payslip
    .findFirst({
      where: { employeeId, period, NOT: exceptId ? { id: exceptId } : undefined },
    })
    .then(Boolean);
}

export async function createPayslip(input: PayslipInput) {
  const { employee, snapshot } = await buildPayslip(input);
  return prisma.$transaction(async (tx) => {
    const folio = await nextFolio(tx, "payslip");
    const payslip = await tx.payslip.create({
      data: {
        folio,
        employeeId: employee.id,
        period: input.period,
        workId: input.workId || null,
        inputJson: JSON.stringify(input),
        resultJson: JSON.stringify(snapshot),
        netPay: snapshot.result.netPay,
        companyCost: snapshot.result.companyCost,
      },
    });
    await tx.movement.create({
      data: { ...payslipMovement(payslip, employee.name), payslipId: payslip.id },
    });
    return payslip;
  });
}

/**
 * Recalcula la liquidación con los datos y parámetros actuales
 * (útil si se corrigió el sueldo o los indicadores del mes).
 */
export async function updatePayslip(id: string, input: PayslipInput) {
  const { employee, snapshot } = await buildPayslip(input);
  return prisma.$transaction(async (tx) => {
    const payslip = await tx.payslip.update({
      where: { id },
      data: {
        period: input.period,
        workId: input.workId || null,
        inputJson: JSON.stringify(input),
        resultJson: JSON.stringify(snapshot),
        netPay: snapshot.result.netPay,
        companyCost: snapshot.result.companyCost,
      },
    });
    const data = payslipMovement(payslip, employee.name);
    await tx.movement.upsert({
      where: { payslipId: id },
      create: { ...data, payslipId: id },
      update: data,
    });
    return payslip;
  });
}

export function listPayslips(period?: string) {
  return prisma.payslip.findMany({
    where: period ? { period } : undefined,
    orderBy: [{ period: "desc" }, { folio: "desc" }],
    include: { employee: { select: { id: true, name: true, rut: true } } },
  });
}

export function getPayslip(id: string) {
  return prisma.payslip.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true } },
      work: { select: { id: true, title: true } },
    },
  });
}

export function deletePayslip(id: string) {
  // El gasto asociado se borra en cascada.
  return prisma.payslip.delete({ where: { id } });
}

export function parsePayslipSnapshot(json: string) {
  return JSON.parse(json) as PayslipSnapshot;
}

export function parsePayslipInput(json: string) {
  return JSON.parse(json) as PayslipInput;
}

/** Datos que necesita el formulario de liquidación. */
export async function payslipFormOptions() {
  const [employees, params, works] = await Promise.all([
    prisma.employee.findMany({ where: { status: "activo" }, orderBy: { name: "asc" } }),
    listPayrollParams(),
    listWorks(),
  ]);
  return {
    employees: employees.filter((e) => hasPayslip(e.contractType)).map(
      (e): PayslipEmployeeOption => ({
        id: e.id,
        name: e.name,
        rut: e.rut,
        workId: e.workId,
        contractType: e.contractType,
        baseSalary: e.baseSalary,
        weeklyHours: e.weeklyHours,
        gratification: e.gratification,
        afp: e.afp,
        healthSystem: e.healthSystem,
        isapreName: e.isapreName,
        isapreUf: e.isapreUf,
        mealAllowance: e.mealAllowance,
        transportAllowance: e.transportAllowance,
      }),
    ),
    paramsByPeriod: Object.fromEntries(params.map((p) => [p.period, toParamsData(p)])),
    works: works.map((w) => ({ id: w.id, title: w.title })),
  };
}

/* ── Pagos día hombre ──────────────────────────────────────── */

export function dayPaymentTotal(input: Pick<DayPaymentInput, "days" | "dailyRate" | "extras" | "discounts">) {
  return Math.round(input.days * input.dailyRate) + input.extras - input.discounts;
}

export async function createDayPayment(input: DayPaymentInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) throw new PayrollError("El trabajador ya no existe.");
  const total = dayPaymentTotal(input);
  if (total <= 0) throw new PayrollError("El total a pagar debe ser mayor que cero.");

  return prisma.$transaction(async (tx) => {
    const folio = await nextFolio(tx, "dayPayment");
    const payment = await tx.dayPayment.create({
      data: {
        folio,
        employeeId: employee.id,
        workId: input.workId || null,
        date: input.date,
        periodText: input.periodText || null,
        days: input.days,
        dailyRate: input.dailyRate,
        extras: input.extras,
        discounts: input.discounts,
        total,
        notes: input.notes || null,
      },
    });
    await tx.movement.create({
      data: {
        type: "gasto",
        date: input.date,
        amount: total,
        category: AUTOMATIC_CATEGORIES.dayPayment,
        description: `Día hombre: ${employee.name} (${input.days.toLocaleString("es-CL")} ${input.days === 1 ? "día" : "días"})`,
        workId: input.workId || null,
        docType: "comprobante",
        docNumber: String(folio),
        counterparty: employee.name,
        counterpartyRut: employee.rut,
        notes: "Generado automáticamente desde el pago de día hombre.",
        dayPaymentId: payment.id,
      },
    });
    return payment;
  });
}

export function listDayPayments() {
  return prisma.dayPayment.findMany({
    orderBy: [{ date: "desc" }, { folio: "desc" }],
    include: {
      employee: { select: { id: true, name: true, rut: true } },
      work: { select: { id: true, title: true } },
    },
  });
}

export function getDayPayment(id: string) {
  return prisma.dayPayment.findUnique({
    where: { id },
    include: { employee: true, work: { select: { id: true, title: true } } },
  });
}

export function deleteDayPayment(id: string) {
  return prisma.dayPayment.delete({ where: { id } });
}

/* ── Finiquitos ────────────────────────────────────────────── */

export type SettlementSnapshot = {
  employee: EmployeeSnapshot;
  uf: number;
  causeLabel: string;
  result: SettlementResult;
};

/** UF para el tope de 90 UF: la del mes de término o, si no está, la última cargada. */
async function ufFor(date: Date) {
  const period = date.toISOString().slice(0, 7);
  const exact = await getPayrollParams(period);
  if (exact) return exact.uf;
  return (await suggestedPayrollParams()).uf;
}

export async function buildSettlement(input: SettlementInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) throw new PayrollError("El trabajador ya no existe.");
  if (employee.contractType === "dia_hombre") {
    throw new PayrollError("Los trabajadores de día hombre no tienen contrato que finiquitar.");
  }
  if (input.endDate < employee.startDate) {
    throw new PayrollError("La fecha de término es anterior al ingreso del trabajador.");
  }
  const uf = await ufFor(input.endDate);
  const result = computeSettlement(employee, input, uf);
  const snapshot: SettlementSnapshot = {
    employee: employeeSnapshot(employee),
    uf,
    causeLabel: TERMINATION_CAUSES[input.cause as TerminationCause],
    result,
  };
  return { employee, snapshot };
}

export async function createSettlement(input: SettlementInput) {
  const { employee, snapshot } = await buildSettlement(input);
  return prisma.$transaction(async (tx) => {
    const folio = await nextFolio(tx, "settlement");
    const settlement = await tx.settlement.create({
      data: {
        folio,
        employeeId: employee.id,
        endDate: input.endDate,
        cause: input.cause,
        inputJson: JSON.stringify(input),
        resultJson: JSON.stringify(snapshot),
        total: snapshot.result.total,
      },
    });
    await tx.employee.update({
      where: { id: employee.id },
      data: { status: "desvinculado", terminationDate: input.endDate },
    });
    if (snapshot.result.total > 0) {
      await tx.movement.create({
        data: {
          type: "gasto",
          date: input.endDate,
          amount: snapshot.result.total,
          category: AUTOMATIC_CATEGORIES.settlement,
          description: `Finiquito — ${employee.name}`,
          workId: employee.workId,
          docType: "finiquito",
          docNumber: String(folio),
          counterparty: employee.name,
          counterpartyRut: employee.rut,
          notes: "Generado automáticamente desde el finiquito.",
          settlementId: settlement.id,
        },
      });
    }
    return settlement;
  });
}

export function listSettlements() {
  return prisma.settlement.findMany({
    orderBy: { folio: "desc" },
    include: { employee: { select: { id: true, name: true, rut: true } } },
  });
}

export function getSettlement(id: string) {
  return prisma.settlement.findUnique({
    where: { id },
    include: { employee: { select: { id: true, name: true, status: true } } },
  });
}

/** Anula el finiquito: lo borra (con su gasto) y reactiva al trabajador. */
export async function deleteSettlement(id: string) {
  const settlement = await prisma.settlement.findUnique({ where: { id } });
  if (!settlement) return;
  await prisma.$transaction([
    prisma.settlement.delete({ where: { id } }),
    prisma.employee.update({
      where: { id: settlement.employeeId },
      data: { status: "activo", terminationDate: null },
    }),
  ]);
}

export function parseSettlementSnapshot(json: string) {
  return JSON.parse(json) as SettlementSnapshot;
}

/* ── Formato ───────────────────────────────────────────────── */

export function formatDocFolio(folio: number) {
  return `N° ${String(folio).padStart(4, "0")}`;
}
