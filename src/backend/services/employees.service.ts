import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { EmployeeInput } from "@/backend/schemas/personal.schema";

function toData(input: EmployeeInput) {
  const dayWorker = input.contractType === "dia_hombre";
  return {
    rut: input.rut,
    name: input.name,
    birthDate: input.birthDate,
    nationality: input.nationality || null,
    address: input.address || null,
    phone: input.phone || null,
    email: input.email || null,
    position: input.position,
    contractType: input.contractType,
    startDate: input.startDate,
    contractEndDate: input.contractEndDate,
    // El día hombre no lleva datos previsionales ni sueldo mensual.
    baseSalary: dayWorker ? 0 : input.baseSalary,
    dailyRate: input.dailyRate,
    weeklyHours: input.weeklyHours,
    gratification: dayWorker ? false : input.gratification,
    afp: dayWorker ? null : input.afp || null,
    healthSystem: input.healthSystem,
    isapreName: input.healthSystem === "isapre" ? input.isapreName || null : null,
    isapreUf: input.healthSystem === "isapre" ? input.isapreUf : null,
    mealAllowance: dayWorker ? 0 : input.mealAllowance,
    transportAllowance: dayWorker ? 0 : input.transportAllowance,
    bankName: input.bankName || null,
    accountType: input.accountType || null,
    accountNumber: input.accountNumber || null,
    workId: input.workId || null,
    notes: input.notes || null,
  };
}

export function listEmployees(filter?: { status?: string; contractType?: string }) {
  return prisma.employee.findMany({
    where: {
      status: filter?.status || undefined,
      contractType: filter?.contractType || undefined,
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { work: { select: { id: true, title: true } } },
  });
}

/** Trabajadores activos, para los selectores de los formularios. */
export function listActiveEmployees() {
  return prisma.employee.findMany({
    where: { status: "activo" },
    orderBy: { name: "asc" },
  });
}

export function getEmployee(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      work: { select: { id: true, title: true } },
      payslips: { orderBy: { period: "desc" } },
      dayPayments: { orderBy: { date: "desc" }, include: { work: { select: { title: true } } } },
      settlements: { orderBy: { endDate: "desc" } },
    },
  });
}

export function rutTaken(rut: string, exceptId?: string) {
  return prisma.employee
    .findFirst({ where: { rut, NOT: exceptId ? { id: exceptId } : undefined } })
    .then(Boolean);
}

export function createEmployee(input: EmployeeInput) {
  return prisma.employee.create({ data: toData(input) });
}

export function updateEmployee(id: string, input: EmployeeInput) {
  return prisma.employee.update({ where: { id }, data: toData(input) });
}

/** ¿Tiene documentos emitidos? Entonces no se puede borrar. */
export async function employeeHasDocuments(id: string) {
  const [payslips, dayPayments, settlements] = await Promise.all([
    prisma.payslip.count({ where: { employeeId: id } }),
    prisma.dayPayment.count({ where: { employeeId: id } }),
    prisma.settlement.count({ where: { employeeId: id } }),
  ]);
  return payslips + dayPayments + settlements > 0;
}

export function deleteEmployee(id: string) {
  return prisma.employee.delete({ where: { id } });
}

/** Reincorpora a un trabajador desvinculado (p. ej. si se anuló el finiquito). */
export function reactivateEmployee(id: string) {
  return prisma.employee.update({
    where: { id },
    data: { status: "activo", terminationDate: null },
  });
}
