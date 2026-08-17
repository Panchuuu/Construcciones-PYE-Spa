/**
 * Utilidades de RUT chileno, compartidas entre validación (Zod) y
 * formularios. Formato canónico: "12.345.678-5" (dígito verificador
 * en mayúscula, puede ser K).
 */

/** Deja solo dígitos y K/k: "12.345.678-k" → "12345678K". */
export function cleanRut(value: string): string {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

/** Dígito verificador según módulo 11: "12345678" → "5", "K" o "0". */
export function computeDv(body: string): string {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "K";
  return String(rest);
}

/** ¿Es un RUT real? Verifica largo y dígito verificador. */
export function isValidRut(value: string): boolean {
  const clean = cleanRut(value);
  if (clean.length < 7 || clean.length > 9) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return computeDv(body) === dv;
}

/** Aplica el formato canónico: "12345678K" → "12.345.678-K". */
export function formatRut(value: string): string {
  const clean = cleanRut(value);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}

/**
 * Formateo progresivo para escribir en un campo de texto:
 * agrega puntos y guion a medida que se escribe, sin validar todavía.
 */
export function formatRutWhileTyping(value: string): string {
  const clean = cleanRut(value);
  if (clean.length <= 1) return clean;
  return formatRut(clean);
}
