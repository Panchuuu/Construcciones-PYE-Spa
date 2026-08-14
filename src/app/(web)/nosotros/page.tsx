import type { Metadata } from "next";
import { Target, Eye } from "lucide-react";

import { milestones, values } from "@/backend/data/company";
import { site, stats, yearsOfExperience } from "@/backend/config/site";
import { Container, PageHero, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";
import { CtaBand } from "@/frontend/sections/cta-band";

export const metadata: Metadata = {
  title: "Nosotros",
  description: `Conoce a ${site.legalName}: equipo, valores e historia de una constructora chilena con ${yearsOfExperience} años de trayectoria.`,
};

export default function NosotrosPage() {
  return (
    <>
      <PageHero
        eyebrow="Nosotros"
        title={`${yearsOfExperience} años construyendo con la misma exigencia`}
        description={`${site.legalName} nació en ${site.foundedYear} con una idea simple: entregar obras bien hechas, en el plazo comprometido y sin letra chica.`}
      />

      {/* Misión y visión */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="grid gap-7 md:grid-cols-2">
            <Reveal className="rounded-2xl border border-carbon-200 bg-carbon-50 p-8">
              <Target className="h-9 w-9 text-brand-600" aria-hidden="true" />
              <h2 className="font-display mt-5 text-xl font-bold text-carbon-900">
                Nuestra misión
              </h2>
              <p className="mt-3 leading-relaxed text-carbon-600">
                Ejecutar proyectos de construcción con estándares técnicos
                rigurosos, cuidando el presupuesto y el plazo de cada cliente,
                y velando por la seguridad de todos quienes trabajan en obra.
              </p>
            </Reveal>

            <Reveal delay={100} className="rounded-2xl border border-carbon-200 bg-carbon-50 p-8">
              <Eye className="h-9 w-9 text-brand-600" aria-hidden="true" />
              <h2 className="font-display mt-5 text-xl font-bold text-carbon-900">
                Nuestra visión
              </h2>
              <p className="mt-3 leading-relaxed text-carbon-600">
                Ser la constructora de referencia en las regiones donde
                operamos, reconocida por cumplir lo que promete y por construir
                relaciones de largo plazo con sus mandantes.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Cifras */}
      <section className="bg-carbon-900 py-16">
        <Container>
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 80}>
                <dd className="font-display text-4xl font-extrabold text-brand-500 sm:text-5xl">
                  {stat.value}
                </dd>
                <dt className="mt-2 text-sm text-carbon-300">{stat.label}</dt>
              </Reveal>
            ))}
          </dl>
        </Container>
      </section>

      {/* Valores */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Nuestros valores"
              title="En qué no transamos"
              align="center"
            />
          </Reveal>
          <div className="mt-14 grid gap-7 sm:grid-cols-2">
            {values.map((value, index) => (
              <Reveal
                key={value.title}
                delay={index * 80}
                className="border-l-4 border-brand-500 pl-6"
              >
                <h3 className="font-display text-lg font-bold text-carbon-900">
                  {value.title}
                </h3>
                <p className="mt-2 leading-relaxed text-carbon-600">
                  {value.description}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Historia */}
      <section className="bg-carbon-50 py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Trayectoria"
              title="Nuestra historia"
              align="center"
            />
          </Reveal>

          <ol className="mx-auto mt-14 max-w-3xl">
            {milestones.map((milestone, index) => (
              <Reveal as="li" key={milestone.year} delay={index * 90}>
                <div className="relative grid grid-cols-[auto_1fr] gap-6 pb-10">
                  <div className="flex flex-col items-center">
                    <span className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-extrabold text-carbon-950">
                      {milestone.year}
                    </span>
                    {index < milestones.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="mt-2 w-px flex-1 bg-carbon-300"
                      />
                    )}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-display text-lg font-bold text-carbon-900">
                      {milestone.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-carbon-600">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
