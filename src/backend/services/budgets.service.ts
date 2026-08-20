import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { BudgetInput, BudgetItem } from "@/backend/schemas/admin.schema";

export function listBudgets() {
  return prisma.budget.findMany({
    orderBy: { folio: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });
}

export function getBudget(id: string) {
  return prisma.budget.findUnique({
    where: { id },
    include: { client: true },
  });
}

function toData(input: BudgetInput) {
  return {
    clientId: input.clientId || null,
    clientName: input.clientName || null,
    clientRut: input.clientRut || null,
    clientPhone: input.clientPhone || null,
    clientEmail: input.clientEmail || null,
    workAddress: input.workAddress || null,
    workPlace: input.workPlace || null,
    workTitle: input.workTitle,
    date: input.date,
    validityDays: input.validityDays,
    itemsJson: JSON.stringify(input.items),
    conditions: input.conditions || null,
  };
}

/**
 * Crea el presupuesto con folio correlativo (1, 2, 3, …).
 * El folio se calcula en una transacción para que dos presupuestos
 * creados al mismo tiempo nunca reciban el mismo número.
 */
export function createBudget(input: BudgetInput) {
  return prisma.$transaction(async (tx) => {
    const last = await tx.budget.aggregate({ _max: { folio: true } });
    const folio = (last._max.folio ?? 0) + 1;
    return tx.budget.create({ data: { folio, ...toData(input) } });
  });
}

export function updateBudget(id: string, input: BudgetInput) {
  return prisma.budget.update({ where: { id }, data: toData(input) });
}

export function deleteBudget(id: string) {
  return prisma.budget.delete({ where: { id } });
}

/** Partidas del presupuesto, ya deserializadas. */
export function parseBudgetItems(itemsJson: string): BudgetItem[] {
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Neto, IVA 19% y total, redondeados al peso. */
export function budgetTotals(items: BudgetItem[]) {
  const neto = items.reduce(
    (sum, item) => sum + Math.round(item.cantidad * item.precio),
    0,
  );
  const iva = Math.round(neto * 0.19);
  return { neto, iva, total: neto + iva };
}

/** Total de una partida, redondeado al peso. */
export function itemTotal(item: BudgetItem) {
  return Math.round(item.cantidad * item.precio);
}

/** Pesos chilenos: 1269200 → "$1.269.200". */
export function formatCLP(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

/** Cantidad con coma decimal: 13 → "13", 13.5 → "13,5". */
export function formatQuantity(value: number) {
  return value.toLocaleString("es-CL", { maximumFractionDigits: 2 });
}

/** Folio del documento: "N° 806". */
export function formatBudgetFolio(folio: number) {
  return `N° ${folio}`;
}

/** Condiciones comerciales como lista (una por línea del texto guardado). */
export function parseConditions(conditions: string | null): string[] {
  if (!conditions) return [];
  return conditions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
