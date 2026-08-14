import type { Metadata } from "next";

import { services } from "@/backend/data/services";
import { Container, PageHero } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";
import { ServiceCard } from "@/frontend/components/service-card";
import { Process } from "@/frontend/sections/process";
import { CtaBand } from "@/frontend/sections/cta-band";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Obra gruesa, edificación, remodelaciones, montaje industrial, ingeniería y movimiento de tierra. Conoce todos los servicios de Construcciones PYE.",
};

export default function ServiciosPage() {
  return (
    <>
      <PageHero
        eyebrow="Servicios"
        title="Todo lo que podemos construir contigo"
        description="Cubrimos el ciclo completo de la obra: proyecto, ejecución y entrega. Un solo responsable de principio a fin."
      />

      <section className="bg-carbon-50 py-20 sm:py-24">
        <Container>
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.slug} delay={index * 70}>
                <ServiceCard service={service} detailed />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Process />
      <CtaBand
        title="¿No ves el servicio que necesitas?"
        description="Escríbenos igual. Evaluamos requerimientos especiales y proyectos a medida."
      />
    </>
  );
}
