"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import { toFieldErrors } from "@/backend/schemas/admin.schema";
import {
  dayPaymentSchema,
  employeeSchema,
  payrollParamsSchema,
  payslipSchema,
  settlementSchema,
} from "@/backend/schemas/personal.schema";
import * as employees from "@/backend/services/employees.service";
import * as payroll from "@/backend/services/payroll.service";
import { syncPayrollParams } from "@/backend/services/indicators-sync.service";
import { currentPeriod, isValidPeriod } from "@/backend/lib/payroll";

const INVALID = "Revisa los campos marcados.";

/** Lee un campo JSON enviado por los formularios dinámicos. */
function jsonField(formData: FormData, name: string, fallback: unknown = []) {
  try {
    return JSON.parse(String(formData.get(name) ?? ""));
  } catch {
    return fallback;
  }
}

/** Convierte los errores de dominio en un mensaje para el formulario. */
function domainError(error: unknown): ActionState {
  if (error instanceof payroll.PayrollError) return { error: error.message };
  throw error;
}

function refresh() {
  revalidatePath("/admin", "layout");
}

/* ── Trabajadores ──────────────────────────────────────────── */

export async function saveEmployeeAction(
  employeeId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = employeeSchema.safeParse({
    ...Object.fromEntries(formData),
    gratification: formData.get("gratification") === "on",
  });
  if (!parsed.success) {
    return { error: INVALID, fieldErrors: toFieldErrors(parsed.error) };
  }

  if (await employees.rutTaken(parsed.data.rut, employeeId ?? undefined)) {
    return { error: INVALID, fieldErrors: { rut: "Ya existe un trabajador con este RUT" } };
  }

  const employee = employeeId
    ? await employees.updateEmployee(employeeId, parsed.data)
    : await employees.createEmployee(parsed.data);

  refresh();
  redirect(`/admin/personal/${employee.id}`);
}

export async function deleteEmployeeAction(employeeId: string): Promise<void> {
  await requireAdmin();
  // Con documentos emitidos no se borra: se desvincula con un finiquito.
  if (await employees.employeeHasDocuments(employeeId)) {
    redirect(`/admin/personal/${employeeId}?error=documentos`);
  }
  await employees.deleteEmployee(employeeId);
  refresh();
  redirect("/admin/personal");
}

/* ── Parámetros previsionales ──────────────────────────────── */

export async function savePayrollParamsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const afpRates: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData) {
    if (key.startsWith("afp_")) afpRates[key.slice(4)] = value;
  }

  const parsed = payrollParamsSchema.safeParse({
    ...Object.fromEntries(formData),
    afpRates,
  });
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    // Los errores de tasas AFP llegan como afpRates.<afp>
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "afpRates" && issue.path[1]) {
        fieldErrors[`afp_${String(issue.path[1])}`] = issue.message;
      }
    }
    return { error: INVALID, fieldErrors };
  }

  await payroll.savePayrollParams(parsed.data);
  refresh();
  redirect(`/admin/personal/parametros?guardado=${parsed.data.period}`);
}

export async function deletePayrollParamsAction(period: string): Promise<void> {
  await requireAdmin();
  await payroll.deletePayrollParams(period);
  refresh();
  redirect("/admin/personal/parametros");
}

/* ── Liquidaciones ─────────────────────────────────────────── */

export async function savePayslipAction(
  payslipId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = payslipSchema.safeParse({
    employeeId: formData.get("employeeId"),
    period: formData.get("period"),
    workId: formData.get("workId"),
    daysWorked: formData.get("daysWorked"),
    overtimeHours: formData.get("overtimeHours"),
    advances: formData.get("advances"),
    bonuses: jsonField(formData, "bonuses"),
    nonTaxable: jsonField(formData, "nonTaxable"),
    otherDiscounts: jsonField(formData, "otherDiscounts"),
  });
  if (!parsed.success) {
    return { error: INVALID, fieldErrors: toFieldErrors(parsed.error) };
  }

  const { employeeId, period } = parsed.data;
  if (await payroll.payslipExists(employeeId, period, payslipId ?? undefined)) {
    return {
      error: INVALID,
      fieldErrors: { period: "Este trabajador ya tiene liquidación para ese mes" },
    };
  }

  let id: string;
  try {
    const payslip = payslipId
      ? await payroll.updatePayslip(payslipId, parsed.data)
      : await payroll.createPayslip(parsed.data);
    id = payslip.id;
  } catch (error) {
    return domainError(error);
  }

  refresh();
  redirect(`/admin/personal/liquidaciones/${id}`);
}

export async function deletePayslipAction(payslipId: string): Promise<void> {
  await requireAdmin();
  await payroll.deletePayslip(payslipId);
  refresh();
  redirect("/admin/personal/liquidaciones");
}

/* ── Pagos día hombre ──────────────────────────────────────── */

export async function createDayPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = dayPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: INVALID, fieldErrors: toFieldErrors(parsed.error) };
  }

  let id: string;
  try {
    id = (await payroll.createDayPayment(parsed.data)).id;
  } catch (error) {
    return domainError(error);
  }

  refresh();
  redirect(`/admin/personal/dia-hombre/${id}`);
}

export async function deleteDayPaymentAction(paymentId: string): Promise<void> {
  await requireAdmin();
  await payroll.deleteDayPayment(paymentId);
  refresh();
  redirect("/admin/personal/dia-hombre");
}

/* ── Finiquitos ────────────────────────────────────────────── */

export async function createSettlementAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = settlementSchema.safeParse({
    employeeId: formData.get("employeeId"),
    endDate: formData.get("endDate"),
    cause: formData.get("cause"),
    lastMonthlyPay: formData.get("lastMonthlyPay"),
    vacationMonthlyBase: formData.get("vacationMonthlyBase"),
    noticeGiven: formData.get("noticeGiven") === "on",
    vacationDaysTaken: formData.get("vacationDaysTaken"),
    pendingSalary: formData.get("pendingSalary"),
    otherEarnings: jsonField(formData, "otherEarnings"),
    discounts: jsonField(formData, "discounts"),
    overrides: jsonField(formData, "overrides", {}),
  });
  if (!parsed.success) {
    return { error: INVALID, fieldErrors: toFieldErrors(parsed.error) };
  }

  let id: string;
  try {
    id = (await payroll.createSettlement(parsed.data)).id;
  } catch (error) {
    return domainError(error);
  }

  refresh();
  redirect(`/admin/personal/finiquitos/${id}`);
}

export async function deleteSettlementAction(settlementId: string): Promise<void> {
  await requireAdmin();
  await payroll.deleteSettlement(settlementId);
  refresh();
  redirect("/admin/personal/finiquitos");
}

/* ── Indicadores automáticos ───────────────────────────────── */

/**
 * Trae ahora los indicadores desde Previred (mes anterior y actual).
 * Con `period`, además sobrescribe ese mes aunque se haya editado a mano.
 */
export async function syncPayrollParamsAction(period: string | null): Promise<void> {
  await requireAdmin();
  const target = period && isValidPeriod(period) ? period : currentPeriod();
  const results = await syncPayrollParams(period ? { force: target } : {});
  const result = results.find((r) => r.period === target);
  refresh();
  redirect(`/admin/personal/parametros?periodo=${target}&sync=${encodeURIComponent(result?.status ?? "sin cambios")}`);
}
