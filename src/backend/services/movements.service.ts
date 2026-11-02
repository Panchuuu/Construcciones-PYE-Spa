import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { MovementInput } from "@/backend/schemas/finanzas.schema";

export type MovementFilter = {
  /** "2026-11"; vacío = todos los meses. */
  period?: string;
  type?: string;
  workId?: string;
  category?: string;
};

export type Attachment = { data: Uint8Array<ArrayBuffer>; mime: string; name: string };

function periodRange(period: string) {
  const [y, m] = period.split("-").map(Number);
  return { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
}

function toWhere(filter: MovementFilter): Prisma.MovementWhereInput {
  return {
    date: filter.period ? periodRange(filter.period) : undefined,
    type: filter.type || undefined,
    workId: filter.workId || undefined,
    category: filter.category || undefined,
  };
}

/** Sin el respaldo (bytes): para listados. */
const listSelect = {
  id: true,
  type: true,
  date: true,
  amount: true,
  category: true,
  description: true,
  docType: true,
  docNumber: true,
  counterparty: true,
  attachmentName: true,
  payslipId: true,
  settlementId: true,
  dayPaymentId: true,
  work: { select: { id: true, title: true } },
} satisfies Prisma.MovementSelect;

export function listMovements(filter: MovementFilter) {
  return prisma.movement.findMany({
    where: toWhere(filter),
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: listSelect,
  });
}

/** Totales de ingresos, gastos y saldo con el filtro dado. */
export async function movementTotals(filter: MovementFilter) {
  const groups = await prisma.movement.groupBy({
    by: ["type"],
    where: toWhere({ ...filter, type: undefined }),
    _sum: { amount: true },
  });
  const income = groups.find((g) => g.type === "ingreso")?._sum.amount ?? 0;
  const expense = groups.find((g) => g.type === "gasto")?._sum.amount ?? 0;
  return { income, expense, balance: income - expense };
}

/** Gastos (o ingresos) agrupados por categoría, de mayor a menor. */
export async function totalsByCategory(filter: MovementFilter, type: "ingreso" | "gasto") {
  const groups = await prisma.movement.groupBy({
    by: ["category"],
    where: toWhere({ ...filter, type }),
    _sum: { amount: true },
  });
  return groups
    .map((g) => ({ category: g.category, amount: g._sum.amount ?? 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Ingresos, gastos y margen de cada obra. */
export async function totalsByWork(filter: Omit<MovementFilter, "workId">) {
  const groups = await prisma.movement.groupBy({
    by: ["workId", "type"],
    where: { ...toWhere(filter), workId: { not: null } },
    _sum: { amount: true },
  });
  const works = await prisma.work.findMany({
    where: { id: { in: [...new Set(groups.map((g) => g.workId!))] } },
    select: { id: true, title: true, client: { select: { name: true } } },
  });
  return works
    .map((work) => {
      const income = groups.find((g) => g.workId === work.id && g.type === "ingreso")?._sum.amount ?? 0;
      const expense = groups.find((g) => g.workId === work.id && g.type === "gasto")?._sum.amount ?? 0;
      return { ...work, income, expense, balance: income - expense };
    })
    .sort((a, b) => b.expense + b.income - (a.expense + a.income));
}

/** Resumen financiero de una obra (para su ficha). */
export async function workFinance(workId: string) {
  const [totals, expenses, recent] = await Promise.all([
    movementTotals({ workId }),
    totalsByCategory({ workId }, "gasto"),
    prisma.movement.findMany({
      where: { workId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: listSelect,
    }),
  ]);
  return { totals, expenses, recent };
}

/** Meses (YYYY-MM) que tienen movimientos, del más reciente al más antiguo. */
export async function movementPeriods() {
  const rows = await prisma.movement.findMany({ select: { date: true }, orderBy: { date: "desc" } });
  return [...new Set(rows.map((r) => r.date.toISOString().slice(0, 7)))];
}

export function getMovement(id: string) {
  return prisma.movement.findUnique({
    where: { id },
    omit: { attachmentData: true },
    include: {
      work: { select: { id: true, title: true } },
      payslip: { select: { id: true } },
      settlement: { select: { id: true } },
      dayPayment: { select: { id: true } },
    },
  });
}

export function getMovementAttachment(id: string) {
  return prisma.movement.findUnique({
    where: { id },
    select: { attachmentData: true, attachmentMime: true, attachmentName: true },
  });
}

function toData(input: MovementInput) {
  return {
    type: input.type,
    date: input.date,
    amount: input.amount,
    category: input.category,
    description: input.description,
    workId: input.workId || null,
    docType: input.docType || null,
    docNumber: input.docNumber || null,
    counterparty: input.counterparty || null,
    counterpartyRut: input.counterpartyRut || null,
    paymentMethod: input.paymentMethod || null,
    notes: input.notes || null,
  };
}

function attachmentData(attachment: Attachment | null, removeAttachment: boolean) {
  if (attachment) {
    return {
      attachmentData: attachment.data,
      attachmentMime: attachment.mime,
      attachmentName: attachment.name,
    };
  }
  if (removeAttachment) {
    return { attachmentData: null, attachmentMime: null, attachmentName: null };
  }
  return {};
}

export function createMovement(input: MovementInput, attachment: Attachment | null) {
  return prisma.movement.create({
    data: { ...toData(input), ...attachmentData(attachment, false) },
  });
}

export function updateMovement(
  id: string,
  input: MovementInput,
  attachment: Attachment | null,
  removeAttachment: boolean,
) {
  return prisma.movement.update({
    where: { id },
    data: { ...toData(input), ...attachmentData(attachment, removeAttachment) },
  });
}

export function deleteMovement(id: string) {
  return prisma.movement.delete({ where: { id } });
}

/** Los movimientos automáticos se administran desde su documento de origen. */
export function isAutomatic(movement: {
  payslipId: string | null;
  settlementId: string | null;
  dayPaymentId: string | null;
}) {
  return Boolean(movement.payslipId || movement.settlementId || movement.dayPaymentId);
}

export function automaticSourceHref(movement: {
  payslipId: string | null;
  settlementId: string | null;
  dayPaymentId: string | null;
}) {
  if (movement.payslipId) return `/admin/personal/liquidaciones/${movement.payslipId}`;
  if (movement.settlementId) return `/admin/personal/finiquitos/${movement.settlementId}`;
  if (movement.dayPaymentId) return `/admin/personal/dia-hombre/${movement.dayPaymentId}`;
  return null;
}
