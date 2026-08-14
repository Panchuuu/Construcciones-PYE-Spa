import "server-only";

import { prisma } from "@/backend/db/prisma";

/** Cifras y actividad reciente para el resumen del panel. */
export async function getDashboard() {
  const [clients, worksInProgress, worksDone, deliveries, recentDeliveries] =
    await Promise.all([
      prisma.client.count(),
      prisma.work.count({ where: { status: "en_progreso" } }),
      prisma.work.count({ where: { status: "entregado" } }),
      prisma.delivery.count(),
      prisma.delivery.findMany({
        take: 6,
        orderBy: { folio: "desc" },
        include: {
          work: { include: { client: { select: { name: true } } } },
        },
      }),
    ]);

  return { clients, worksInProgress, worksDone, deliveries, recentDeliveries };
}
