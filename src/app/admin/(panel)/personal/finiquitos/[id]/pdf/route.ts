import { getSession } from "@/backend/auth/session";
import { getSettlement } from "@/backend/services/payroll.service";
import {
  settlementPdfFilename,
  generateSettlementPdf,
} from "@/backend/services/personal-pdf.service";

/**
 * Descarga el finiquito como PDF — solo con sesión de administrador.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const row = await getSettlement(id);
  if (!row) return new Response("Documento no encontrado", { status: 404 });

  const pdf = await generateSettlementPdf(row);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${settlementPdfFilename(row)}"`,
    },
  });
}
