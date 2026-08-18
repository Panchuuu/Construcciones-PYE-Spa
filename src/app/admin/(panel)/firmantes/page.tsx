import type { Metadata } from "next";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element -- las firmas son data URLs */
import { Pencil, Plus, Star } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { listSigners } from "@/backend/services/signers.service";
import { AdminPageHeader, EmptyState } from "@/frontend/admin/ui";

export const metadata: Metadata = { title: "Firmantes" };

export default async function FirmantesPage() {
  await requireAdmin();
  const signers = await listSigners();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Firmantes de la empresa"
        description="Firmas guardadas para no tener que dibujarlas en cada acta de entrega."
        action={
          <Link
            href="/admin/firmantes/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo firmante
          </Link>
        }
      />

      {signers.length === 0 ? (
        <EmptyState
          title="Aún no hay firmas guardadas"
          description="Guarda la firma de quienes representan a la empresa en las entregas: bastará elegirlas al crear un acta."
          actionHref="/admin/firmantes/nuevo"
          actionLabel="Guardar la primera firma"
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {signers.map((signer) => (
            <li
              key={signer.id}
              className="rounded-2xl border border-carbon-200 bg-white p-6 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-carbon-900">
                    {signer.name}
                  </h2>
                  {signer.role && (
                    <p className="text-sm text-carbon-600">{signer.role}</p>
                  )}
                  {signer.isDefault && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                      Por defecto
                    </span>
                  )}
                </div>
                <Link
                  href={`/admin/firmantes/${signer.id}/editar`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-carbon-200 px-3 py-2 text-xs font-bold text-carbon-900 transition-colors hover:border-carbon-900"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </Link>
              </div>

              <div className="mt-4 flex h-24 items-end justify-center rounded-xl border border-carbon-100 bg-carbon-50 p-3">
                <img
                  src={signer.signature}
                  alt={`Firma de ${signer.name}`}
                  className="max-h-full w-auto"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
