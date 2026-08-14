import { cn } from "@/frontend/lib/utils";

/**
 * Isotipo + logotipo, dibujado a partir del logo bordado de la empresa:
 * casita de techo rojo a la izquierda, techumbre grande con chimenea
 * humeante a la derecha, y el nombre "Construcciones Hojalatería PYE".
 * ⚠️ Si más adelante tienen el logo en archivo vectorial, reemplaza el <svg>
 *    por <Image src="/logo.svg" ... />.
 */
export function Logo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const isLight = variant === "light";
  /** Trazo principal: blanco sobre fondos oscuros, azul marino sobre claros */
  const main = isLight ? "#ffffff" : "var(--color-carbon-900)";
  const accent = "var(--color-brand-600)";

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 58 42"
        aria-hidden="true"
        className="h-10 w-auto shrink-0 sm:h-11"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Casita izquierda: techo rojo y ventanas */}
        <path d="M2 27 12 17l10 10" stroke={accent} strokeWidth="2.8" />
        <rect x="8" y="29" width="3.4" height="4" fill={main} />
        <rect x="13" y="29" width="3.4" height="4" fill={main} />

        {/* Techumbre grande: trazo principal con línea roja interior */}
        <path d="M18 28 34 12l16 16" stroke={main} strokeWidth="3" />
        <path d="M23 27.5 34 16.5l4.5 4.5" stroke={accent} strokeWidth="2.2" />

        {/* Chimenea con humo sobre el faldón izquierdo */}
        <path d="M27 16.5V9h4v3.5" stroke={main} strokeWidth="2.4" />
        <path d="M29.5 6.5c1.8-.6 1.2-2.4 2.6-3" stroke={main} strokeWidth="1.6" />

        {/* Ventanas de la casa grande */}
        <rect x="31" y="30" width="3.6" height="4.4" fill={main} />
        <rect x="36.6" y="30" width="3.6" height="4.4" fill={main} />

        {/* Faldón descendente a la derecha */}
        <path d="M50 28l4-4 4 4" stroke={main} strokeWidth="2.4" />
      </svg>

      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] sm:text-[0.65rem]",
            isLight ? "text-carbon-300" : "text-carbon-600",
          )}
        >
          Construcciones
        </span>
        <span
          className={cn(
            "font-display text-[0.92rem] font-extrabold uppercase tracking-tight sm:text-base",
            isLight ? "text-white" : "text-carbon-900",
          )}
        >
          Hojalatería{" "}
          <span className={isLight ? "text-brand-500" : "text-brand-600"}>
            PYE
          </span>
        </span>
        <span
          className={cn(
            "font-display text-[0.5rem] font-semibold uppercase tracking-[0.24em] sm:text-[0.55rem]",
            isLight ? "text-carbon-400" : "text-carbon-500",
          )}
        >
          Fabricación &amp; Montaje
        </span>
      </span>
    </span>
  );
}
