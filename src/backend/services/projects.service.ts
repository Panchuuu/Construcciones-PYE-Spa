import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { ProjectInput } from "@/backend/schemas/admin.schema";
import type { Project } from "@/backend/types/project";
import type { Project as DbProject } from "@/generated/prisma/client";

export type { Project };

/** Alcance guardado como JSON → arreglo de strings. */
export function parseScope(scopeJson: string): string[] {
  try {
    const parsed = JSON.parse(scopeJson);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Las fotos subidas se sirven desde /proyectos/<slug>/imagen.
 * La URL no lleva query string (next/image la rechazaría sin configurar
 * images.localPatterns); el reemplazo de la foto se detecta por ETag.
 */
export function projectImageUrl(project: DbProject): string {
  if (project.imageMime) {
    return `/proyectos/${project.slug}/imagen`;
  }
  return project.imagePath ?? "/images/proyectos/edificio-corporativo.svg";
}

function toPublic(project: DbProject): Project {
  return {
    slug: project.slug,
    title: project.title,
    category: project.category,
    location: project.location,
    year: project.year,
    surface: project.surface,
    duration: project.duration,
    client: project.client,
    summary: project.summary,
    scope: parseScope(project.scopeJson),
    image: projectImageUrl(project),
  };
}

/* ── Lectura pública ───────────────────────────────────────── */

export async function listPublicProjects(): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
  return projects.map(toPublic);
}

export async function getPublicProject(slug: string): Promise<Project | null> {
  const project = await prisma.project.findUnique({ where: { slug } });
  return project ? toPublic(project) : null;
}

/** Categorías presentes, para los filtros de la grilla pública. */
export async function listCategories(): Promise<string[]> {
  const rows = await prisma.project.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return ["Todos", ...rows.map((row) => row.category)];
}

/** Solo los bytes de la foto, para la ruta que la sirve. */
export function getProjectImage(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    select: { imageData: true, imageMime: true, updatedAt: true },
  });
}

/* ── Panel de administración ───────────────────────────────── */

export function listProjects() {
  return prisma.project.findMany({
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
}

export function getProject(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

type ImageUpload = { data: Uint8Array<ArrayBuffer>; mime: string } | null;

function toRecord(input: ProjectInput) {
  return {
    slug: input.slug,
    title: input.title,
    category: input.category,
    location: input.location,
    year: input.year,
    surface: input.surface,
    duration: input.duration,
    client: input.client,
    summary: input.summary,
    scopeJson: JSON.stringify(input.scope),
  };
}

export function createProject(input: ProjectInput, image: ImageUpload) {
  return prisma.project.create({
    data: {
      ...toRecord(input),
      ...(image ? { imageData: image.data, imageMime: image.mime } : {}),
    },
  });
}

export function updateProject(
  id: string,
  input: ProjectInput,
  image: ImageUpload,
) {
  return prisma.project.update({
    where: { id },
    data: {
      ...toRecord(input),
      // Sin foto nueva se conserva la actual.
      ...(image ? { imageData: image.data, imageMime: image.mime } : {}),
    },
  });
}

export function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

/** ¿El slug ya está tomado por otro proyecto? */
export async function slugTaken(slug: string, exceptId?: string) {
  const existing = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  });
  return Boolean(existing && existing.id !== exceptId);
}
