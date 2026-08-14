import Link from "next/link";
import { cn } from "@/frontend/lib/utils";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonStyles = {
  primary: cn(
    buttonBase,
    "bg-brand-500 text-carbon-950 hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/25",
  ),
  dark: cn(
    buttonBase,
    "bg-carbon-900 text-white hover:bg-carbon-800 hover:shadow-lg hover:shadow-carbon-900/20",
  ),
  outline: cn(
    buttonBase,
    "border-2 border-carbon-200 bg-white text-carbon-900 hover:border-carbon-900",
  ),
  ghostLight: cn(
    buttonBase,
    "border-2 border-white/25 text-white hover:border-white hover:bg-white/10",
  ),
};

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  external,
}: {
  href: string;
  variant?: keyof typeof buttonStyles;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const classes = cn(buttonStyles[variant], className);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  /** "dark" = texto oscuro sobre fondo claro; "light" = al revés */
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "eyebrow flex items-center gap-3",
            align === "center" && "justify-center",
            tone === "light" ? "text-brand-500" : "text-brand-600",
          )}
        >
          <span
            className="h-px w-8 bg-current opacity-60"
            aria-hidden="true"
          />
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "title-xl mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]",
          tone === "light" ? "text-white" : "text-carbon-900",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed sm:text-lg",
            tone === "light" ? "text-carbon-300" : "text-carbon-600",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** Encabezado oscuro reutilizable para las páginas internas. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-carbon-950 pb-16 pt-36 sm:pb-20 sm:pt-44">
      <BlueprintGrid />
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl"
      />
      <Container className="relative">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          tone="light"
        />
        {children}
      </Container>
    </section>
  );
}

/** Trama de plano técnico usada como textura de fondo. */
export function BlueprintGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.07]",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse at 50% 0%, black 40%, transparent 78%)",
      }}
    />
  );
}
