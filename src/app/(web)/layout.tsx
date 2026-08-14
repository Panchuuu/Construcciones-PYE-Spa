import { SiteHeader } from "@/frontend/components/site-header";
import { SiteFooter } from "@/frontend/components/site-footer";
import { WhatsAppButton } from "@/frontend/components/whatsapp-button";
import { site } from "@/backend/config/site";

/** Datos estructurados para que Google entienda de qué empresa se trata */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  name: site.legalName,
  description: site.description,
  url: site.url,
  telephone: site.contact.phone,
  email: site.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.contact.address,
    addressLocality: site.contact.city,
    addressRegion: site.contact.region,
    addressCountry: "CL",
  },
  areaServed: site.coverage,
  foundingDate: String(site.foundedYear),
  sameAs: Object.values(site.social).filter(Boolean),
};

/** Layout del sitio público: header, footer y botón de WhatsApp. */
export default function WebLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-carbon-950"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppButton />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
