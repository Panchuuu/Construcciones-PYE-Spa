import { getSession } from "@/backend/auth/session";
import { getDelivery } from "@/backend/services/deliveries.service";
import {
  deliveryPdfFilename,
  generateDeliveryPdf,
} from "@/backend/services/delivery-pdf.service";

/**
 * Descarga el acta de entrega como PDF.
 * GET /admin/entregas/<id>/pdf — solo con sesión de administrador.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await params;
  const delivery = await getDelivery(id);
  if (!delivery) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const pdf = await generateDeliveryPdf(delivery);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${deliveryPdfFilename(delivery)}"`,
    },
  });
}
