import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "@/frontend/styles/globals.css";

import { SiteHeader } from "@/frontend/components/site-header";
import { SiteFooter } from "@/frontend/components/site-footer";
import { WhatsAppButton } from "@/frontend/components/whatsapp-button";
import { site } from "@/backend/config/site";

const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Empresa constructora en ${site.contact.city}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "constructora",
    "empresa constructora",
    "obra gruesa",
    "remodelación",
    "montaje industrial",
    site.contact.city,
    "Chile",
  ],
  authors: [{ name: site.legalName }],
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: site.url,
    siteName: site.legalName,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0e1116",
};

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
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
      </body>
    </html>
  );
}
