import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { ClientInput } from "@/backend/schemas/admin.schema";

/** Normaliza los opcionales vacíos a null para la base de datos. */
function toData(input: ClientInput) {
  return {
    name: input.name,
    rut: input.rut || null,
    company: input.company || null,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    notes: input.notes || null,
  };
}

export function listClients(search?: string) {
  return prisma.client.findMany({
    where: search
      ? { OR: [{ name: { contains: search } }, { rut: { contains: search } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { works: true } } },
  });
}

export function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      works: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { deliveries: true } } },
      },
    },
  });
}

export function createClient(input: ClientInput) {
  return prisma.client.create({ data: toData(input) });
}

export function updateClient(id: string, input: ClientInput) {
  return prisma.client.update({ where: { id }, data: toData(input) });
}

/** Borra el cliente y, en cascada, sus trabajos y entregas. */
export function deleteClient(id: string) {
  return prisma.client.delete({ where: { id } });
}
