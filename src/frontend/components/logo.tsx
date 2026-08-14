import { cn } from "@/frontend/lib/utils";
import { site } from "@/backend/config/site";

/**
 * Isotipo + logotipo de la empresa.
 * ⚠️ Si tienen un logo oficial, reemplaza el <svg> por:
 *    <Image src="/logo.svg" alt="Construcciones PYE" width={160} height={40} />
 */
export function Logo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const isLight = variant === "light";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
      >
        <rect width="40" height="40" rx="9" fill="var(--color-brand-500)" />
        <path
          d="M8 27.5 15.2 12h3.9l7.2 15.5h-4.2l-1.3-3h-7.3l-1.3 3H8Zm6.6-6.3h4.9l-2.45-5.6-2.45 5.6Z"
          fill="var(--color-carbon-950)"
        />
        <path
          d="M25.5 27.5V21l-2.1-4.4h3.6l1.4 3.2 1.4-3.2H33L30.9 21v6.5h-5.4Z"
          fill="var(--color-carbon-950)"
          opacity="0.85"
        />
      </svg>

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[0.95rem] font-extrabold uppercase tracking-tight sm:text-lg",
            isLight ? "text-white" : "text-carbon-900",
          )}
        >
          Construcciones
        </span>
        <span
          className={cn(
            "font-display text-[0.95rem] font-extrabold uppercase tracking-[0.32em] sm:text-lg",
            isLight ? "text-brand-500" : "text-brand-600",
          )}
        >
          {site.shortName}
          <span className="ml-1 text-[0.6em] tracking-normal opacity-70">
            SpA
          </span>
        </span>
      </span>
    </span>
  );
}
