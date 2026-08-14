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
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
          <Reveal>
            <SectionHeading
              eyebrow="Por qué elegirnos"
              title="La diferencia está en cómo se administra la obra"
              description="Muchos pueden levantar un muro. Lo difícil es entregar a tiempo, al precio acordado y sin sorpresas."
              tone="light"
            />

            <div className="mt-10 flex items-start gap-4 rounded-2xl border border-brand-500/25 bg-brand-500/10 p-6">
              <ShieldCheck
                className="h-8 w-8 shrink-0 text-brand-500"
                aria-hidden="true"
              />
              <div>
                <p className="font-display font-bold text-white">
                  Cobertura en {site.coverage.length} regiones
                </p>
                <p className="mt-1.5 text-sm text-carbon-300">
                  {site.coverage.join(", ")}.
                </p>
              </div>
            </div>
          </Reveal>

          <ul className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {values.map((value, index) => (
              <Reveal
                as="li"
                key={value.title}
                delay={index * 80}
                className="bg-carbon-900 p-7"
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
        </div>
      </Container>
    </section>
  );
}
