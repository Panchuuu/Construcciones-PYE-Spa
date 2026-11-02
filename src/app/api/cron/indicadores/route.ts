import { timingSafeEqual } from "node:crypto";

import { env } from "@/backend/config/env";
import { syncPayrollParams } from "@/backend/services/indicators-sync.service";

/**
 * Tarea programada: actualiza los indicadores previsionales desde Previred.
 * GET /api/cron/indicadores con la cabecera
 *   Authorization: Bearer <CRON_SECRET>
 * Pensada para un cron del hosting cada 2 días (ver DESPLIEGUE.md).
 */
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  if (!env.cronSecret) return false;
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(env.cronSecret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!env.cronSecret) {
    return Response.json({ error: "Falta CRON_SECRET en el servidor." }, { status: 503 });
  }
  if (!authorized(request)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const results = await syncPayrollParams();
  const failed = results.some((r) => r.status === "error");
  return Response.json({ ok: !failed, results }, { status: failed ? 502 : 200 });
}
