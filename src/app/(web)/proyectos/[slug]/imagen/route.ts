import { getProjectImage } from "@/backend/services/projects.service";

/**
 * Sirve la foto de una obra guardada en la base de datos.
 * GET /proyectos/<slug>/imagen
 *
 * La URL es estable (sin ?v=…, que next/image no admite sin configurar
 * localPatterns): el control de versión se hace con ETag, así el
 * navegador revalida con un 304 barato y ve el cambio al reemplazar la foto.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await getProjectImage(slug);

  if (!project?.imageData || !project.imageMime) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  const etag = `"${project.updatedAt.getTime()}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "public, must-revalidate" },
    });
  }

  return new Response(Buffer.from(project.imageData), {
    headers: {
      "Content-Type": project.imageMime,
      ETag: etag,
      "Cache-Control": "public, must-revalidate",
    },
  });
}
