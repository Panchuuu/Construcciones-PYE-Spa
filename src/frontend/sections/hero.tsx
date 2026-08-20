import { ArrowRight, CheckCircle2, Phone } from "lucide-react";

import { ButtonLink, BlueprintGrid, Container } from "@/frontend/components/ui";
import { site, stats } from "@/backend/config/site";

const highlights = [
  "Presupuesto sin costo",
  "Equipo y maquinaria propios",
  "Garantía escrita por contrato",
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-carbon-950">
      {/*
        ⚠️ Para usar una foto real de obra como fondo, agrega:
        <Image src="/images/hero.jpg" alt="" fill priority
               className="object-cover opacity-35" />
      */}
      <BlueprintGrid className="opacity-[0.08]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,rgba(245,168,0,0.22),transparent_55%),radial-gradient(ellipse_at_85%_20%,rgba(100,115,141,0.28),transparent_50%)]"
      />

      <Container className="relative pb-16 pt-36 sm:pb-20 sm:pt-44 lg:pb-24 lg:pt-52">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
          <div className="max-w-3xl">
            <p className="hero-enter inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              Constructora en {site.contact.city}
            </p>

            <h1 className="title-xl hero-enter mt-7 text-4xl text-white [animation-delay:100ms] sm:text-6xl lg:text-7xl">
              Construimos con{" "}
              <span className="relative whitespace-nowrap text-brand-500">
                estándar
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-brand-500/50"
                >
                  <path
                    d="M2 9c60-5 120-7 180-6s80 3 116 5"
                    pathLength={1}
                    className="hero-underline"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              ,<br className="hidden sm:block" /> plazo y palabra.
            </h1>

            <p className="hero-enter mt-7 max-w-2xl text-lg leading-relaxed text-carbon-300 [animation-delay:200ms] sm:text-xl">
              {site.description}
            </p>

            <ul className="hero-enter mt-8 flex flex-wrap gap-x-6 gap-y-3 [animation-delay:300ms]">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm font-semibold text-carbon-200"
                >
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-brand-500"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="hero-enter mt-10 flex flex-col gap-3 [animation-delay:400ms] sm:flex-row sm:items-center">
              <ButtonLink href="/contacto" className="text-base">
                Cotizar mi proyecto
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                href={`tel:${site.contact.phone}`}
                variant="ghostLight"
                external
                className="text-base"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {site.contact.phoneDisplay}
              </ButtonLink>
            </div>
          </div>

          {/* Riel de cifras: vertical en escritorio, grilla 2×2 en móvil */}
          <div className="hero-enter grid grid-cols-2 gap-x-10 gap-y-8 self-center border-white/10 [animation-delay:550ms] lg:grid-cols-1 lg:gap-y-0 lg:divide-y lg:divide-white/10 lg:border-l lg:pl-10">
            {stats.map((stat) => (
              <div key={stat.label} className="lg:py-5 lg:first:pt-0 lg:last:pb-0">
                <p className="font-display text-4xl font-extrabold tracking-tight text-brand-500 tabular-nums sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-carbon-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <div className="hazard-stripe hero-stripe h-2" aria-hidden="true" />
    </section>
  );
}
