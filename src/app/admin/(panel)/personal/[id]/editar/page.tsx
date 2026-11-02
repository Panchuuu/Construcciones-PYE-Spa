import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { getEmployee } from "@/backend/services/employees.service";
import { listWorks } from "@/backend/services/works.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { EmployeeForm } from "@/frontend/admin/employee-form";
import { toDateInput } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Editar trabajador" };

export default async function EditarTrabajadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [employee, works] = await Promise.all([getEmployee(id), listWorks()]);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/personal/${employee.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a la ficha
      </Link>

      <AdminPageHeader
        title={`Editar: ${employee.name}`}
        description="Los cambios aplican a los documentos nuevos; los ya emitidos conservan sus datos."
      />

      <AdminCard className="max-w-3xl">
        <EmployeeForm
          employeeId={employee.id}
          works={works.map((w) => ({ id: w.id, title: w.title }))}
          initial={{
            rut: employee.rut,
            name: employee.name,
            birthDate: toDateInput(employee.birthDate),
            nationality: employee.nationality ?? "",
            address: employee.address ?? "",
            phone: employee.phone ?? "",
            email: employee.email ?? "",
            position: employee.position,
            contractType: employee.contractType,
            startDate: toDateInput(employee.startDate),
            contractEndDate: toDateInput(employee.contractEndDate),
            baseSalary: employee.baseSalary,
            dailyRate: employee.dailyRate,
            weeklyHours: employee.weeklyHours,
            gratification: employee.gratification,
            afp: employee.afp ?? "",
            healthSystem: employee.healthSystem,
            isapreName: employee.isapreName ?? "",
            isapreUf: employee.isapreUf,
            mealAllowance: employee.mealAllowance,
            transportAllowance: employee.transportAllowance,
            bankName: employee.bankName ?? "",
            accountType: employee.accountType ?? "",
            accountNumber: employee.accountNumber ?? "",
            workId: employee.workId ?? "",
            notes: employee.notes ?? "",
          }}
        />
      </AdminCard>
    </div>
  );
}
