import "server-only";

import { NextResponse } from "next/server";

import {
  contactSchema,
  type ContactResponse,
} from "@/backend/schemas/contact.schema";
import { submitQuoteRequest } from "@/backend/services/quote.service";
import { saveQuoteRequest } from "@/backend/services/quotes.service";
import {
  checkRateLimit,
  getClientId,
} from "@/backend/services/rate-limit.service";

function json(body: ContactResponse, status: number) {
  return NextResponse.json(body, { status });
}

/**
 * Handler del formulario de cotización.
 * La ruta (src/app/api/contacto/route.ts) solo delega aquí, de modo que
 * la lógica del backend queda fuera de la carpeta de rutas.
 */
export async function handleContactRequest(request: Request) {
  const limit = checkRateLimit(getClientId(request));
  if (!limit.allowed) {
    return json(
      {
        ok: false,
        message: `Recibimos varias solicitudes desde tu conexión. Intenta nuevamente en ${Math.ceil(
          limit.retryAfterSeconds / 60,
        )} minutos o escríbenos por WhatsApp.`,
      },
      429,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "La solicitud no es válida." }, 400);
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return json(
      {
        ok: false,
        message: "Revisa los datos marcados e inténtalo otra vez.",
        fieldErrors,
      },
      422,
    );
  }

  // Campo trampa: si viene con contenido, es un bot.
  // Respondemos "ok" para no darle pistas, pero no enviamos nada.
  if (parsed.data.website) {
    return json({ ok: true, message: "Solicitud recibida." }, 200);
  }

  // La cotización se guarda SIEMPRE en la base de datos (aparece en el
  // panel de administración), incluso si después el correo falla.
  let quoteId: string | undefined;
  try {
    const saved = await saveQuoteRequest(parsed.data);
    quoteId = saved.id;
  } catch (error) {
    console.error("[contacto] No se pudo guardar la cotización:", error);
  }

  // Avisa a la empresa (correo siempre; WhatsApp/Telegram si están configurados).
  const result = await submitQuoteRequest(parsed.data, quoteId);

  // Solo si NO quedó registrada en ninguna parte pedimos reintentar.
  if (!result.delivered && !quoteId) {
    const message =
      result.reason === "not-configured"
        ? "El envío de correos aún no está configurado en el servidor. Escríbenos por WhatsApp y te respondemos de inmediato."
        : "No pudimos enviar tu solicitud en este momento. Escríbenos por WhatsApp o llámanos y te atendemos al tiro.";

    return json({ ok: false, message }, 503);
  }

  return json(
    {
      ok: true,
      message:
        "¡Solicitud enviada! Te contactaremos dentro de las próximas 24 horas hábiles.",
    },
    200,
  );
}
