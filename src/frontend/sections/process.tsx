import { processSteps } from "@/backend/data/company";
import { Container, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";

export function Process() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20">
          <Reveal>
            <div className="lg:sticky lg:top-32">
              <SectionHeading
                eyebrow="Cómo trabajamos"
                title="Cuatro etapas, cero improvisación"
                description="Un método claro para que sepas siempre en qué punto está tu proyecto y cuánto falta."
              />
            </div>
          </Reveal>

          {/* Línea de tiempo vertical */}
          <ol className="relative space-y-12 border-l border-carbon-200 pl-10 sm:pl-14">
            {processSteps.map((item, index) => (
              <Reveal as="li" key={item.step} delay={index * 90} className="relative">
                {/* Nodo sobre la línea */}
                <span
                  aria-hidden="true"
                  className="absolute -left-10 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center sm:-left-14"
                >
                  <span className="h-4 w-4 rounded-full border-2 border-brand-500 bg-white" />
                </span>

                <span
                  aria-hidden="true"
                  className="font-display block select-none text-[4rem] font-extrabold leading-[0.85] tracking-tight text-carbon-100"
                >
                  {item.step}
                </span>
                <h3 className="font-display -mt-5 text-xl font-bold text-carbon-900">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-carbon-600 sm:text-base">
                  {item.description}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
