import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { listWorks } from "@/backend/services/works.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { EmployeeForm } from "@/frontend/admin/employee-form";
import { todayInput } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Nuevo trabajador" };

export default async function NuevoTrabajadorPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  await requireAdmin();
  const { tipo } = await searchParams;
  const works = await listWorks("en_progreso");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/personal"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a trabajadores
      </Link>

      <AdminPageHeader title="Nuevo trabajador" />

      <AdminCard className="max-w-3xl">
        <EmployeeForm
          employeeId={null}
          works={works.map((w) => ({ id: w.id, title: w.title }))}
          initial={{
            rut: "",
            name: "",
            birthDate: "",
            nationality: "Chilena",
            address: "",
            phone: "",
            email: "",
            position: "",
            contractType: tipo === "dia_hombre" ? "dia_hombre" : "obra_faena",
            startDate: todayInput(),
            contractEndDate: "",
            baseSalary: 0,
            dailyRate: 0,
            weeklyHours: 42,
            gratification: true,
            afp: "",
            healthSystem: "fonasa",
            isapreName: "",
            isapreUf: null,
            mealAllowance: 0,
            transportAllowance: 0,
            bankName: "",
            accountType: "",
            accountNumber: "",
            workId: "",
            notes: "",
          }}
        />
      </AdminCard>
    </div>
  );
}
