import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { services } from "@/backend/data/services";
import { serviceIcons } from "@/frontend/lib/icons";
import { ButtonLink, Container, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";

export function ServicesPreview() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Qué hacemos"
              title="Servicios de construcción de punta a cabo"
              description="Desde el movimiento de tierra hasta la última mano de pintura. Un solo interlocutor responsable de toda la obra."
            />
            <ButtonLink
              href="/servicios"
              variant="outline"
              className="shrink-0 self-start md:self-auto"
            >
              Ver todos los servicios
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </Reveal>

        {/* Filas editoriales: número, ícono, servicio y enlace */}
        <ul className="mt-14 border-t border-carbon-200">
          {services.map((service, index) => {
            const Icon = serviceIcons[service.icon];
            return (
              <Reveal as="li" key={service.slug} delay={index * 60}>
                <Link
                  href={`/servicios#${service.slug}`}
                  className="group grid grid-cols-[auto_1fr] items-start gap-x-5 border-b border-carbon-200 py-6 transition-colors hover:bg-carbon-50 sm:grid-cols-[4rem_auto_1fr_auto] sm:items-center sm:gap-x-8 sm:py-7"
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-2xl font-extrabold tracking-tight text-carbon-200 transition-colors group-hover:text-brand-500 sm:text-3xl"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="hidden h-12 w-12 items-center justify-center rounded-xl bg-carbon-900 text-brand-500 sm:flex">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="font-display block text-lg font-bold text-carbon-900 sm:text-xl">
                      {service.title}
                    </span>
                    <span className="mt-1 block max-w-2xl text-sm leading-relaxed text-carbon-600">
                      {service.summary}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="col-start-2 mt-2 h-5 w-5 text-carbon-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600 sm:col-start-auto sm:mt-0"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
