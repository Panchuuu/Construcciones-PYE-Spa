import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { WorkInput } from "@/backend/schemas/admin.schema";

function toData(input: WorkInput) {
  return {
    clientId: input.clientId,
    title: input.title,
    description: input.description || null,
    location: input.location || null,
    status: input.status,
  };
}

export function listWorks(status?: string) {
  return prisma.work.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { deliveries: true } },
    },
  });
}

export function getWork(id: string) {
  return prisma.work.findUnique({
    where: { id },
    include: {
      client: true,
      deliveries: { orderBy: { createdAt: "desc" } },
    },
  });
}

export function createWork(input: WorkInput) {
  return prisma.work.create({ data: toData(input) });
}

export function updateWork(id: string, input: WorkInput) {
  return prisma.work.update({ where: { id }, data: toData(input) });
}

/** Borra el trabajo y, en cascada, sus entregas. */
export function deleteWork(id: string) {
  return prisma.work.delete({ where: { id } });
}
