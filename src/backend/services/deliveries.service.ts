import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { DeliveryInput, MaterialItem } from "@/backend/schemas/admin.schema";

export function listDeliveries() {
  return prisma.delivery.findMany({
    orderBy: { folio: "desc" },
    include: {
      work: { include: { client: { select: { id: true, name: true } } } },
    },
  });
}

export function getDelivery(id: string) {
  return prisma.delivery.findUnique({
    where: { id },
    include: { work: { include: { client: true } } },
  });
}

/**
 * Crea el acta con un folio correlativo (001, 002, …).
 * El folio se calcula dentro de una transacción para que dos actas
 * creadas al mismo tiempo nunca reciban el mismo número.
 */
export function createDelivery(input: DeliveryInput) {
  return prisma.$transaction(async (tx) => {
    const last = await tx.delivery.aggregate({ _max: { folio: true } });
    const folio = (last._max.folio ?? 0) + 1;

    return tx.delivery.create({
      data: {
        folio,
        workId: input.workId,
        type: input.type,
        notes: input.notes || null,
        itemsJson:
          input.type === "materiales" ? JSON.stringify(input.items) : null,
        companySignerName: input.companySignerName,
        clientSignerName: input.clientSignerName,
        clientSignerRut: input.clientSignerRut || null,
        companySignature: input.companySignature,
        clientSignature: input.clientSignature,
        receivedOk: input.receivedOk,
      },
    });
  });
}

export function deleteDelivery(id: string) {
  return prisma.delivery.delete({ where: { id } });
}

export function markDeliveryEmailed(id: string) {
  return prisma.delivery.update({
    where: { id },
    data: { emailSentAt: new Date() },
  });
}

/** Materiales del acta, ya deserializados. */
export function parseItems(itemsJson: string | null): MaterialItem[] {
  if (!itemsJson) return [];
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Folio con formato de acta: N° 007 */
export function formatFolio(folio: number) {
  return `N° ${String(folio).padStart(3, "0")}`;
}
