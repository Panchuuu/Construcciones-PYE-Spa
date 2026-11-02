import { getSession } from "@/backend/auth/session";
import { getDayPayment } from "@/backend/services/payroll.service";
import {
  dayPaymentPdfFilename,
  generateDayPaymentPdf,
} from "@/backend/services/personal-pdf.service";

/**
 * Descarga el comprobante de pago día hombre como PDF — solo con sesión de administrador.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const row = await getDayPayment(id);
  if (!row) return new Response("Documento no encontrado", { status: 404 });

  const pdf = await generateDayPaymentPdf(row);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dayPaymentPdfFilename(row)}"`,
    },
  });
}
