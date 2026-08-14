import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
/* eslint-disable @next/next/no-img-element -- las firmas son data URLs locales */
import {
  ArrowLeft,
  CheckCircle2,
  FileDown,
  MessageCircle,
  XCircle,
} from "lucide-react";

import { deleteDeliveryAction } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import { site } from "@/backend/config/site";
import {
  DELIVERY_TYPES,
  type DeliveryType,
} from "@/backend/schemas/admin.schema";
import {
  formatFolio,
  getDelivery,
  parseItems,
} from "@/backend/services/deliveries.service";
import { buildDeliveryWhatsAppUrl } from "@/backend/services/delivery-notify.service";
import {
  AdminPageHeader,
  DeliveryTypeBadge,
  formatDateTime,
} from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { DeliveryActions } from "@/frontend/admin/delivery-actions";
import { Logo } from "@/frontend/components/logo";

export const metadata: Metadata = { title: "Acta de entrega" };

export default async function EntregaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const delivery = await getDelivery(id);
  if (!delivery) notFound();

  const items = parseItems(delivery.itemsJson);
  const folio = formatFolio(delivery.folio);
  const whatsappUrl = buildDeliveryWhatsAppUrl(delivery);
  const client = delivery.work.client;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          href="/admin/entregas"
          className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a entregas
        </Link>
      </div>

      <div className="print:hidden">
        <AdminPageHeader
          title={`Acta de entrega ${folio}`}
          description={
            delivery.emailSentAt
              ? `Enviada por correo el ${formatDateTime(delivery.emailSentAt)}.`
              : "Aún no se envía por correo."
          }
          action={
            <ConfirmDeleteButton
              action={deleteDeliveryAction.bind(null, delivery.id)}
              label="Eliminar acta"
              confirmMessage={`¿Eliminar el acta ${folio}? Esta acción no se puede deshacer.`}
            />
          }
        />
      </div>

      {/* Acciones de envío */}
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <DeliveryActions
          deliveryId={delivery.id}
          hasClientEmail={Boolean(client.email)}
        />
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/entregas/${delivery.id}/pdf`}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Descargar PDF
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1fb457]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Enviar por WhatsApp
          </a>
        </div>
      </div>

      {/* ── El acta (también es la vista de impresión) ─────────── */}
      <article className="overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-brand-600 bg-carbon-950 px-7 py-5 print:bg-white print:px-0">
          <div className="print:hidden">
            <Logo variant="light" />
          </div>
          <div className="hidden print:block">
            <Logo variant="dark" />
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-extrabold text-white print:text-carbon-950">
              ACTA DE ENTREGA {folio}
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 print:text-brand-700">
              {DELIVERY_TYPES[delivery.type as DeliveryType] ?? delivery.type}
            </p>
          </div>
        </header>

        <div className="space-y-6 px-7 py-6 print:px-0">
          {/* Datos generales */}
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-carbon-500">
                Fecha y hora
              </dt>
              <dd className="mt-0.5 font-semibold text-carbon-900">
                {formatDateTime(delivery.date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-carbon-500">
                Tipo de entrega
              </dt>
              <dd className="mt-1">
                <DeliveryTypeBadge type={delivery.type} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-carbon-500">
                Cliente
              </dt>
              <dd className="mt-0.5 font-semibold text-carbon-900">
                {client.name}
                {client.rut && (
                  <span className="font-normal text-carbon-600">
                    {" "}
                    · RUT {client.rut}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-carbon-500">
                Trabajo
              </dt>
              <dd className="mt-0.5 font-semibold text-carbon-900">
                {delivery.work.title}
                {delivery.work.location && (
                  <span className="font-normal text-carbon-600">
                    {" "}
                    · {delivery.work.location}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {/* Materiales */}
          {items.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-carbon-500">
                Materiales entregados
              </h2>
              <table className="mt-2 w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-carbon-200 text-xs font-bold uppercase text-carbon-600">
                    <th className="py-2 pr-4">Descripción</th>
                    <th className="w-24 py-2 pr-4">Cantidad</th>
                    <th className="w-24 py-2">Unidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-100">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2.5 pr-4 text-carbon-900">
                        {item.descripcion}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-carbon-900">
                        {item.cantidad}
                      </td>
                      <td className="py-2.5 text-carbon-700">
                        {item.unidad || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Observaciones */}
          {delivery.notes && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-carbon-500">
                Observaciones
              </h2>
              <p className="mt-1.5 whitespace-pre-wrap rounded-xl border-l-4 border-brand-600 bg-carbon-50 p-4 text-sm text-carbon-800 print:bg-white print:pl-4">
                {delivery.notes}
              </p>
            </div>
          )}

          {/* Conformidad */}
          <p
            className={
              delivery.receivedOk
                ? "flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-800 print:bg-white print:px-0"
                : "flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 print:bg-white print:px-0"
            }
          >
            {delivery.receivedOk ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            {delivery.receivedOk
              ? "Recibido conforme: la entrega se encuentra completa y en buen estado."
              : "Recibido con observaciones (ver detalle más arriba)."}
          </p>

          {/* Firmas */}
          <div className="grid gap-8 pt-2 sm:grid-cols-2">
            {[
              {
                signature: delivery.companySignature,
                name: delivery.companySignerName,
                role: `Entrega — ${site.name}`,
                rut: null as string | null,
              },
              {
                signature: delivery.clientSignature,
                name: delivery.clientSignerName,
                role: "Recibe — Cliente",
                rut: delivery.clientSignerRut,
              },
            ].map((signer) => (
              <figure key={signer.role} className="text-center">
                <div className="flex h-32 items-end justify-center rounded-xl border border-carbon-200 bg-white p-2">
                  <img
                    src={signer.signature}
                    alt={`Firma de ${signer.name}`}
                    className="max-h-full"
                  />
                </div>
                <figcaption className="mt-2 border-t-2 border-carbon-900 pt-2">
                  <p className="font-bold text-carbon-900">{signer.name}</p>
                  {signer.rut && (
                    <p className="text-xs text-carbon-600">RUT {signer.rut}</p>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-wide text-carbon-500">
                    {signer.role}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="border-t border-carbon-100 pt-4 text-center text-xs text-carbon-500">
            {site.legalName} · RUT {site.rut} · {site.contact.address},{" "}
            {site.contact.city} · {site.contact.phoneDisplay} ·{" "}
            {site.contact.email}
          </p>
        </div>
      </article>
    </div>
  );
}
