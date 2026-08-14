import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { serviceTitles } from "@/backend/data/services";
import { site, whatsappUrl } from "@/backend/config/site";
import { ButtonLink, Container, PageHero } from "@/frontend/components/ui";
import { ContactForm } from "@/frontend/components/contact-form";
import { Reveal } from "@/frontend/components/reveal";
import { SocialLinks } from "@/frontend/components/social-links";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Solicita una visita técnica y presupuesto sin costo. Escríbenos a ${site.contact.email} o llámanos al ${site.contact.phoneDisplay}.`,
};

const channels = [
  {
    icon: Phone,
    label: "Teléfono",
    value: site.contact.phoneDisplay,
    href: `tel:${site.contact.phone}`,
  },
  {
    icon: Mail,
    label: "Correo",
    value: site.contact.email,
    href: `mailto:${site.contact.email}`,
  },
  {
    icon: MapPin,
    label: "Oficina",
    value: `${site.contact.address}, ${site.contact.city}`,
  },
  {
    icon: Clock,
    label: "Horario",
    value: site.contact.hours,
  },
];

export default function ContactoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Conversemos sobre tu proyecto"
        description="Completa el formulario y te respondemos dentro de 24 horas hábiles. Si prefieres algo más rápido, escríbenos por WhatsApp."
      />

      <section className="bg-carbon-50 py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
            {/* Formulario */}
            <Reveal className="rounded-2xl border border-carbon-200 bg-white p-7 shadow-card sm:p-9">
              <h2 className="font-display text-2xl font-bold text-carbon-900">
                Solicitar presupuesto
              </h2>
              <p className="mt-2 text-sm text-carbon-600">
                Los campos marcados con{" "}
                <span className="font-bold text-brand-600">*</span> son
                obligatorios.
              </p>
              <div className="mt-8">
                <ContactForm services={[...serviceTitles]} />
              </div>
            </Reveal>

            {/* Canales directos */}
            <Reveal delay={120} className="space-y-6">
              <div className="rounded-2xl bg-carbon-950 p-8">
                <h2 className="font-display text-xl font-bold text-white">
                  Contacto directo
                </h2>
                <ul className="mt-6 space-y-5">
                  {channels.map((channel) => (
                    <li key={channel.label} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-500">
                        <channel.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-carbon-400">
                          {channel.label}
                        </p>
                        {channel.href ? (
                          <a
                            href={channel.href}
                            className="break-all text-sm font-semibold text-white transition-colors hover:text-brand-500"
                          >
                            {channel.value}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-white">
                            {channel.value}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href={whatsappUrl}
                  external
                  className="mt-8 w-full"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Escribir por WhatsApp
                </ButtonLink>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-carbon-400">
                    Síguenos
                  </p>
                  <SocialLinks className="mt-3" />
                </div>
              </div>

              <div className="rounded-2xl border border-carbon-200 bg-white p-8">
                <h3 className="font-display text-lg font-bold text-carbon-900">
                  Zonas de cobertura
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {site.coverage.map((region) => (
                    <li
                      key={region}
                      className="rounded-full bg-carbon-100 px-3.5 py-1.5 text-xs font-semibold text-carbon-700"
                    >
                      {region}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm leading-relaxed text-carbon-600">
                  ¿Tu proyecto está fuera de estas zonas? Consúltanos igual:
                  evaluamos caso a caso.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/*
        ⚠️ OPCIONAL — mapa de la oficina.
        Reemplaza la URL del iframe por la de Google Maps → Compartir → Insertar un mapa.
      */}
    </>
  );
}
