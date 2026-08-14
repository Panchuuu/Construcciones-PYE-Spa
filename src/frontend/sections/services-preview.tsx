import { ArrowRight } from "lucide-react";

import { services } from "@/backend/data/services";
import { ButtonLink, Container, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";
import { ServiceCard } from "@/frontend/components/service-card";

export function ServicesPreview() {
  return (
    <section className="bg-carbon-50 py-20 sm:py-28">
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

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.slug} delay={index * 70}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
