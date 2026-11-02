import { getSession } from "@/backend/auth/session";
import { getPayslip } from "@/backend/services/payroll.service";
import {
  payslipPdfFilename,
  generatePayslipPdf,
} from "@/backend/services/personal-pdf.service";

/**
 * Descarga la liquidación como PDF — solo con sesión de administrador.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const row = await getPayslip(id);
  if (!row) return new Response("Documento no encontrado", { status: 404 });

  const pdf = await generatePayslipPdf(row);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${payslipPdfFilename(row)}"`,
    },
  });
}
