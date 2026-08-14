import { ArrowRight, MessageCircle } from "lucide-react";

import { site, whatsappUrl } from "@/backend/config/site";
import { ButtonLink, Container } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";

export function CtaBand({
  title = "¿Tienes un proyecto en mente?",
  description = "Cuéntanos qué necesitas construir. Visitamos el terreno, evaluamos y te entregamos un presupuesto detallado sin costo.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-brand-500">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #0d1220 0 2px, transparent 2px 22px)",
        }}
      />

      <Container className="relative py-16 sm:py-20">
        <Reveal className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="title-xl text-3xl text-carbon-950 sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-carbon-950 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <ButtonLink href="/contacto" variant="dark" className="text-base">
              Solicitar presupuesto
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink
              href={whatsappUrl}
              external
              variant="outline"
              className="border-carbon-950/20 text-base hover:border-carbon-950"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp {site.contact.phoneDisplay}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
