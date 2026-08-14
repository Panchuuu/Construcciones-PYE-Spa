import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { ContactInput } from "@/backend/schemas/contact.schema";
import type { QuoteStatus } from "@/backend/schemas/admin.schema";

/**
 * Guarda una solicitud del formulario de contacto.
 * Se llama ANTES de intentar el correo, para que la cotización quede
 * registrada en el panel aunque el envío falle.
 */
export function saveQuoteRequest(input: ContactInput) {
  return prisma.quoteRequest.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      service: input.service,
      location: input.location?.trim() || null,
      message: input.message,
    },
  });
}

export function listQuotes(status?: QuoteStatus) {
  return prisma.quoteRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export function getQuote(id: string) {
  return prisma.quoteRequest.findUnique({ where: { id } });
}

export function updateQuoteStatus(id: string, status: QuoteStatus) {
  return prisma.quoteRequest.update({ where: { id }, data: { status } });
}

export function deleteQuote(id: string) {
  return prisma.quoteRequest.delete({ where: { id } });
}
