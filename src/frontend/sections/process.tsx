import { processSteps } from "@/backend/data/company";
import { Container, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";

export function Process() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Cómo trabajamos"
            title="Cuatro etapas, cero improvisación"
            description="Un método claro para que sepas siempre en qué punto está tu proyecto y cuánto falta."
            align="center"
          />
        </Reveal>

        <ol className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((item, index) => (
            <Reveal as="li" key={item.step} delay={index * 90} className="relative">
              {/* Línea conectora entre pasos (solo en escritorio) */}
              {index < processSteps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-16 top-7 hidden h-px w-[calc(100%-3rem)] bg-gradient-to-r from-carbon-200 to-transparent lg:block"
                />
              )}

              <span className="font-display relative flex h-14 w-14 items-center justify-center rounded-2xl bg-carbon-900 text-lg font-extrabold text-brand-500">
                {item.step}
              </span>
              <h3 className="font-display mt-6 text-lg font-bold text-carbon-900">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-carbon-600">
                {item.description}
              </p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
