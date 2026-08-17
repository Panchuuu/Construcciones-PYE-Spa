/**
 * Forma de una obra tal como la consumen las páginas públicas.
 * Vive fuera de los servicios (que son "server-only") porque también
 * la usan componentes de cliente, como la grilla con filtros.
 */
export type Project = {
  slug: string;
  title: string;
  category: string;
  location: string;
  year: number;
  surface: string;
  duration: string;
  client: string;
  summary: string;
  scope: string[];
  /** URL de la imagen: la subida desde el panel o la estática. */
  image: string;
};
