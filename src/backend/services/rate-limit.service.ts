import "server-only";

/**
 * Limitador de peticiones muy simple, en memoria.
 * Suficiente para frenar el spam de un formulario público.
 *
 * Nota: al vivir en memoria, se reinicia con cada despliegue y no se
 * comparte entre instancias. Si el sitio crece, migrar a Upstash/Redis.
 */
const hits = new Map<string, number[]>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const MAX_REQUESTS = 5;

export function checkRateLimit(identifier: string) {
  const now = Date.now();
  const previous = hits.get(identifier) ?? [];
  const recent = previous.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - recent[0]);
    return { allowed: false as const, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  recent.push(now);
  hits.set(identifier, recent);

  // Limpieza oportunista para que el Map no crezca sin control
  if (hits.size > 500) {
    for (const [key, timestamps] of hits) {
      if (timestamps.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return { allowed: true as const };
}

/** Obtiene una IP aproximada desde las cabeceras del proxy. */
export function getClientId(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconocido";
}
