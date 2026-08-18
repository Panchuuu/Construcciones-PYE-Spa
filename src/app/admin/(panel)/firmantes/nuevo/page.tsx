import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { SignerForm } from "@/frontend/admin/signer-form";

export const metadata: Metadata = { title: "Nuevo firmante" };

export default async function NuevoFirmantePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/firmantes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a firmantes
      </Link>

      <AdminPageHeader
        title="Nuevo firmante"
        description="Guarda la firma una vez y reutilízala en todas las actas."
      />

      <AdminCard>
        <SignerForm signerId={null} />
      </AdminCard>
    </div>
  );
}
