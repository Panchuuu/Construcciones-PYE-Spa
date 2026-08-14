import type { Metadata } from "next";

import { requireAdmin } from "@/backend/auth/session";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ClientForm } from "@/frontend/admin/client-form";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default async function NuevoClientePage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader
        title="Nuevo cliente"
        description="Los datos de contacto permiten enviarle las actas por correo o WhatsApp."
      />
      <AdminCard>
        <ClientForm clientId={null} />
      </AdminCard>
    </div>
  );
}
