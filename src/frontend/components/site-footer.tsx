import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

import { Logo } from "@/frontend/components/logo";
import { SocialLinks } from "@/frontend/components/social-links";
import { navigation, site } from "@/backend/config/site";
import { services } from "@/backend/data/services";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-carbon-950 text-carbon-300">
      <div className="hazard-stripe h-1.5" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo variant="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              {site.description}
            </p>
            <SocialLinks className="mt-6" />
            <p className="mt-6 text-xs text-carbon-500">RUT {site.rut}</p>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white">
              Navegación
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-brand-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white">
              Servicios
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/servicios#${service.slug}`}
                    className="transition-colors hover:text-brand-500"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white">
              Contacto
            </h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3">
                <Phone
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                  aria-hidden="true"
                />
                <a
                  href={`tel:${site.contact.phone}`}
                  className="transition-colors hover:text-brand-500"
                >
                  {site.contact.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                  aria-hidden="true"
                />
                <a
                  href={`mailto:${site.contact.email}`}
                  className="break-all transition-colors hover:text-brand-500"
                >
                  {site.contact.email}
                </a>
              </li>
              <li className="flex gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                  aria-hidden="true"
                />
                <span>
                  {site.contact.address}
                  <br />
                  {site.contact.city}, {site.contact.country}
                </span>
              </li>
              <li className="flex gap-3">
                <Clock
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                  aria-hidden="true"
                />
                <span>{site.contact.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-carbon-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.legalName}. Todos los derechos reservados.
          </p>
          <p>
            Cobertura: {site.coverage.slice(0, 3).join(" · ")} y más regiones.
          </p>
        </div>
      </div>
    </footer>
  );
}
