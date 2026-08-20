import { getSession } from "@/backend/auth/session";
import { getBudget } from "@/backend/services/budgets.service";
import {
  budgetPdfFilename,
  generateBudgetPdf,
} from "@/backend/services/budget-pdf.service";

/**
 * Descarga el presupuesto como PDF.
 * GET /admin/presupuestos/<id>/pdf — solo con sesión de administrador.
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
  const budget = await getBudget(id);
  if (!budget) {
    return new Response("Presupuesto no encontrado", { status: 404 });
  }

  const pdf = await generateBudgetPdf(budget);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${budgetPdfFilename(budget)}"`,
    },
  });
}
