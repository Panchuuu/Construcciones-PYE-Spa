import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Wrench,
} from "lucide-react";

import { deleteQuoteAction } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import { getQuote } from "@/backend/services/quotes.service";
import {
  AdminCard,
  AdminPageHeader,
  QuoteStatusBadge,
  formatDateTime,
} from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { QuoteStatusButtons } from "@/frontend/admin/quote-status-buttons";

export const metadata: Metadata = { title: "Cotización" };

export default async function CotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  // Enlaces directos para responder al instante.
  const whatsappDigits = quote.phone.replace(/[^\d]/g, "");
  const whatsappHref = `https://wa.me/${
    whatsappDigits.startsWith("56") ? whatsappDigits : `56${whatsappDigits}`
  }?text=${encodeURIComponent(
    `Hola ${quote.name}, te contactamos de Construcciones PYE por tu solicitud de cotización (${quote.service}).`,
  )}`;
  const mailtoHref = `mailto:${quote.email}?subject=${encodeURIComponent(
    `Cotización ${quote.service} — Construcciones PYE`,
  )}`;

  const facts = [
    { icon: Wrench, label: "Servicio", value: quote.service },
    { icon: Phone, label: "Teléfono", value: quote.phone },
    { icon: Mail, label: "Correo", value: quote.email },
    { icon: MapPin, label: "Ubicación", value: quote.location ?? "No indicada" },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/cotizaciones"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a cotizaciones
      </Link>

      <AdminPageHeader
        title={quote.name}
        description={`Recibida el ${formatDateTime(quote.createdAt)}`}
        action={<QuoteStatusBadge status={quote.status} />}
      />

      {/* Responder */}
      <div className="flex flex-wrap gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Responder por WhatsApp
        </a>
        <a
          href={mailtoHref}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-5 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Responder por correo
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-carbon-500">
            Mensaje
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-carbon-800">
            {quote.message}
          </p>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-carbon-500">
            Datos de contacto
          </h2>
          <ul className="mt-4 space-y-3">
            {facts.map((fact) => (
              <li key={fact.label} className="flex items-start gap-3 text-sm">
                <fact.icon
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-carbon-500">
                    {fact.label}
                  </p>
                  <p className="text-carbon-800">{fact.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-carbon-500">
          Estado de la solicitud
        </h2>
        <div className="mt-4">
          <QuoteStatusButtons quoteId={quote.id} status={quote.status} />
        </div>
      </AdminCard>

      <div className="border-t border-carbon-200 pt-6">
        <ConfirmDeleteButton
          action={deleteQuoteAction.bind(null, quote.id)}
          label="Eliminar cotización"
          confirmMessage="¿Eliminar esta cotización? Esta acción no se puede deshacer."
        />
      </div>
    </div>
  );
}
