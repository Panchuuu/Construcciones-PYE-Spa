import { getSession } from "@/backend/auth/session";
import { getMovementAttachment } from "@/backend/services/movements.service";

/**
 * Muestra el respaldo (foto o PDF) de un movimiento.
 * GET /admin/finanzas/<id>/respaldo — solo con sesión de administrador.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const { id } = await params;
  const file = await getMovementAttachment(id);
  if (!file?.attachmentData || !file.attachmentMime) {
    return new Response("Respaldo no encontrado", { status: 404 });
  }

  // Nombre seguro para la cabecera (sin comillas ni saltos de línea).
  const filename = (file.attachmentName ?? "respaldo").replace(/["\r\n]/g, "");

  return new Response(Buffer.from(file.attachmentData), {
    headers: {
      "Content-Type": file.attachmentMime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
