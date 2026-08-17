import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "@/frontend/styles/globals.css";

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
    "hojalatería",
    "techumbres",
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
    title: `${site.name} | Empresa constructora en ${site.contact.city}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | Empresa constructora en ${site.contact.city}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0d1220",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
