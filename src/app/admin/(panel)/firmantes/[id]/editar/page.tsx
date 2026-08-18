import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { deleteSignerAction } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import { getSigner } from "@/backend/services/signers.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { SignerForm } from "@/frontend/admin/signer-form";

export const metadata: Metadata = { title: "Editar firmante" };

export default async function EditarFirmantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const signer = await getSigner(id);
  if (!signer) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/firmantes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a firmantes
      </Link>

      <AdminPageHeader title="Editar firmante" description={signer.name} />

      <AdminCard>
        <SignerForm
          signerId={signer.id}
          initial={{
            name: signer.name,
            role: signer.role,
            signature: signer.signature,
            isDefault: signer.isDefault,
          }}
        />
      </AdminCard>

      <div className="border-t border-carbon-200 pt-6">
        <ConfirmDeleteButton
          action={deleteSignerAction.bind(null, signer.id)}
          label="Eliminar firmante"
          confirmMessage={`¿Eliminar la firma guardada de ${signer.name}? Las actas ya emitidas no se modifican.`}
        />
      </div>
    </div>
  );
}
