import { ShieldCheck } from "lucide-react";

import { values } from "@/backend/data/company";
import { site } from "@/backend/config/site";
import { BlueprintGrid, Container, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";

export function WhyUs() {
  return (
    <section className="relative overflow-hidden bg-carbon-900 py-20 sm:py-28">
      <BlueprintGrid className="opacity-[0.06]" />

      <Container className="relative">
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Por qué elegirnos"
            title="La diferencia está en cómo se administra la obra"
            description="Muchos pueden levantar un muro. Lo difícil es entregar a tiempo, al precio acordado y sin sorpresas."
            tone="light"
          />

          <p className="flex shrink-0 items-center gap-3 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-5 py-4">
            <ShieldCheck
              className="h-6 w-6 shrink-0 text-brand-500"
              aria-hidden="true"
            />
            <span>
              <span className="font-display block font-bold text-white">
                Cobertura en {site.coverage.length} regiones
              </span>
              <span className="mt-0.5 block text-xs text-carbon-300">
                {site.coverage.join(" · ")}
              </span>
            </span>
          </p>
        </Reveal>

        {/* Franja de valores: columnas divididas, tick rojo arriba */}
        <ul className="mt-14 grid gap-y-10 border-t border-white/10 pt-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:divide-x lg:divide-white/10 lg:gap-x-0">
          {values.map((value, index) => (
            <Reveal
              as="li"
              key={value.title}
              delay={index * 80}
              className="lg:px-8 lg:first:pl-0 lg:last:pr-0"
            >
              <span
                aria-hidden="true"
                className="block h-1 w-10 rounded-full bg-brand-500"
              />
              <h3 className="font-display mt-5 text-lg font-bold text-white">
                {value.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-carbon-300">
                {value.description}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
