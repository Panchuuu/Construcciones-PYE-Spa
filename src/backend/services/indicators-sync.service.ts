import "server-only";

import { prisma } from "@/backend/db/prisma";
import { AFPS, REFERENCE_PARAMS, currentPeriod } from "@/backend/lib/payroll";
import { toParamsData } from "@/backend/services/payroll.service";

/**
 * Sincronización automática de los indicadores previsionales.
 *
 * Fuentes (públicas, sin clave):
 * - api.gael.cloud/general/public/previred/MMAAAA → copia de los
 *   indicadores de Previred de cada mes (UF, UTM, sueldo mínimo, topes,
 *   tasas AFP, SIS).
 * - mindicador.cl/api/uf/DD-MM-AAAA → UF exacta del último día del mes,
 *   que se publica unos días después de comenzado el mes.
 *
 * La mutual y el aporte de la reforma previsional dependen de la empresa
 * y no vienen en Previred: se mantienen los del mes anterior.
 *
 * Un mes guardado a mano (source = "manual") nunca se sobrescribe, salvo
 * que se pida explícitamente desde el panel.
 */

const PREVIRED_URL = "https://api.gael.cloud/general/public/previred";
const UF_URL = "https://mindicador.cl/api/uf";
const TIMEOUT_MS = 15_000;

/** Cada cuánto se vuelve a consultar (y más seguido si la UF es provisoria). */
const STALE_MS = 48 * 60 * 60 * 1000;
const STALE_PROVISIONAL_MS = 12 * 60 * 60 * 1000;
/** Pausa mínima entre intentos automáticos en un mismo proceso. */
const RETRY_GAP_MS = 60 * 60 * 1000;

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Nombre del campo de tasa de cada AFP en la respuesta de Previred. */
const AFP_FIELDS: Record<keyof typeof AFPS, string> = {
  capital: "AFPCapitalTasaDepTrab",
  cuprum: "AFPCuprumTasaDepTrab",
  habitat: "AFPHabitatTasaDepTrab",
  modelo: "AFPModeloTasaDepTrab",
  planvital: "AFPPlanVitalTasaDepTrab",
  provida: "AFPProVidaTasaDepTrab",
  uno: "AFPUnoTasaDepTrab",
};

export type SyncResult = {
  period: string;
  status: "creado" | "actualizado" | "sin cambios" | "manual" | "no publicado" | "error";
  ufProvisional?: boolean;
  message?: string;
};

/** "41.247,63" / "41247,63" / "90" → número. */
function num(value: unknown) {
  if (typeof value === "number") return value;
  const text = String(value ?? "").trim();
  const n = Number(text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text);
  return Number.isFinite(n) ? n : NaN;
}

async function getJson(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Record<string, unknown>;
}

/** Último día del mes "2026-11" → { day: 30, month: 11, year: 2026 }. */
function lastDay(period: string) {
  const [year, month] = period.split("-").map(Number);
  return { year, month, day: new Date(Date.UTC(year, month, 0)).getUTCDate() };
}

/** UF exacta del último día del mes, o null si aún no está publicada. */
async function ufAtMonthEnd(period: string): Promise<number | null> {
  const { year, month, day } = lastDay(period);
  const date = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
  try {
    const data = await getJson(`${UF_URL}/${date}`);
    const serie = data.serie as { valor?: number }[] | undefined;
    const value = serie?.[0]?.valor;
    return typeof value === "number" && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Mes anterior a "2026-01" → "2025-12". */
function previousPeriod(period: string) {
  const [year, month] = period.split("-").map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** Indicadores de Previred de un mes, ya convertidos. null si no están publicados. */
async function fetchPrevired(period: string) {
  const [year, month] = period.split("-");
  let data: Record<string, unknown>;
  try {
    data = await getJson(`${PREVIRED_URL}/${month}${year}`);
  } catch (error) {
    if (error instanceof Error && /HTTP (404|500)/.test(error.message)) return null;
    throw error;
  }
  if (data.PeriodoMY !== `${month}${year}`) return null;

  const afpRates: Record<string, number> = {};
  for (const [code, field] of Object.entries(AFP_FIELDS)) {
    const rate = num(data[field]);
    if (rate > 0) afpRates[code] = rate;
  }

  const values = {
    uf: num(data.UFValPeriodo),
    ufDescription: String(data.UFDescPeriodo ?? ""),
    utm: Math.round(num(data.UTMVal)),
    minWage: Math.round(num(data.RMITrabDepeInd)),
    topeAfpUf: num(data.RTIAfpUF),
    topeAfcUf: num(data.RTISegCesUF),
    sisRate: num(data.TasaSIS),
    afpRates,
  };

  const required = [values.uf, values.utm, values.minWage, values.topeAfpUf, values.topeAfcUf, values.sisRate];
  if (required.some((v) => !(v > 0)) || Object.keys(afpRates).length !== Object.keys(AFPS).length) {
    throw new Error("Respuesta de Previred incompleta");
  }
  return values;
}

/**
 * Sincroniza un mes. `force` sobrescribe también un mes editado a mano.
 */
export async function syncPeriod(period: string, force = false): Promise<SyncResult> {
  const existing = await prisma.payrollParams.findUnique({ where: { period } });
  if (existing?.source === "manual" && !force) return { period, status: "manual" };

  let previred: Awaited<ReturnType<typeof fetchPrevired>>;
  try {
    previred = await fetchPrevired(period);
  } catch (error) {
    return { period, status: "error", message: error instanceof Error ? error.message : String(error) };
  }
  if (!previred) return { period, status: "no publicado" };

  // UF: la del último día del mes. Previred publica el mes en curso con la
  // UF del mes anterior hasta que se conoce la definitiva.
  const monthName = MONTHS[Number(period.slice(5, 7)) - 1];
  const exactUf = await ufAtMonthEnd(period);
  const previredHasMonthUf = previred.ufDescription.toLowerCase().includes(monthName);
  const uf = exactUf ?? previred.uf;
  const ufProvisional = exactUf === null && !previredHasMonthUf;

  // Mutual y aporte de la reforma: del mismo mes, del anterior o de referencia.
  const base =
    existing ??
    (await prisma.payrollParams.findUnique({ where: { period: previousPeriod(period) } })) ??
    (await prisma.payrollParams.findFirst({ orderBy: { period: "desc" } }));
  const company = base ? toParamsData(base) : REFERENCE_PARAMS;

  const data = {
    uf,
    utm: previred.utm,
    minWage: previred.minWage,
    topeAfpUf: previred.topeAfpUf,
    topeAfcUf: previred.topeAfcUf,
    afpRatesJson: JSON.stringify(previred.afpRates),
    sisRate: previred.sisRate,
    mutualRate: company.mutualRate,
    employerPensionRate: company.employerPensionRate,
    source: "previred",
    ufProvisional,
    syncedAt: new Date(),
  };

  const unchanged =
    existing &&
    existing.source === "previred" &&
    existing.uf === data.uf &&
    existing.utm === data.utm &&
    existing.minWage === data.minWage &&
    existing.topeAfpUf === data.topeAfpUf &&
    existing.topeAfcUf === data.topeAfcUf &&
    existing.afpRatesJson === data.afpRatesJson &&
    existing.sisRate === data.sisRate &&
    existing.ufProvisional === data.ufProvisional;

  await prisma.payrollParams.upsert({
    where: { period },
    create: { period, ...data },
    update: data,
  });

  return {
    period,
    status: !existing ? "creado" : unchanged ? "sin cambios" : "actualizado",
    ufProvisional,
  };
}

/** Sincroniza el mes anterior (liquidaciones que se pagan a inicio de mes) y el actual. */
export async function syncPayrollParams(options: { force?: string } = {}) {
  const current = currentPeriod();
  const periods = [previousPeriod(current), current];
  if (options.force && !periods.includes(options.force)) periods.push(options.force);
  const results: SyncResult[] = [];
  for (const period of periods) {
    results.push(await syncPeriod(period, options.force === period));
  }
  return results;
}

/* ── Sincronización perezosa (desde el panel) ──────────────── */

let lastAttempt = 0;
let running: Promise<unknown> | null = null;

/**
 * Si los indicadores están viejos (más de 2 días, o falta el mes actual,
 * o su UF sigue provisoria por más de 12 horas), los actualiza. Pensado
 * para llamarse con after() en cada visita al panel: no bloquea la página
 * y, como mucho, intenta una vez por hora.
 */
export async function syncIfStale() {
  if (running || Date.now() - lastAttempt < RETRY_GAP_MS) return;

  // Mes actual sincronizado: se mira su antigüedad. Si está editado a mano
  // o no existe, se mira la última sincronización de cualquier mes (los
  // meses a mano igual se saltan dentro de syncPayrollParams).
  const current = await prisma.payrollParams.findUnique({ where: { period: currentPeriod() } });
  const reference =
    current?.source === "previred"
      ? current
      : current
        ? await prisma.payrollParams.findFirst({
            where: { source: "previred", syncedAt: { not: null } },
            orderBy: { syncedAt: "desc" },
          })
        : null;
  if (reference?.syncedAt) {
    const age = Date.now() - reference.syncedAt.getTime();
    if (age < (reference.ufProvisional ? STALE_PROVISIONAL_MS : STALE_MS)) return;
  }

  lastAttempt = Date.now();
  running = syncPayrollParams()
    .then((results) => {
      const changed = results.filter((r) => r.status === "creado" || r.status === "actualizado");
      if (changed.length) {
        console.info(`[indicadores] ${changed.map((r) => `${r.period}: ${r.status}`).join(", ")}`);
      }
      const failed = results.filter((r) => r.status === "error");
      if (failed.length) {
        console.warn(`[indicadores] error: ${failed.map((r) => `${r.period} ${r.message}`).join(", ")}`);
      }
    })
    .catch((error) => console.warn("[indicadores] no se pudo sincronizar:", error))
    .finally(() => {
      running = null;
    });
  await running;
}
