import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Ruler } from "lucide-react";

import type { Project } from "@/backend/types/project";

/**
 * Versión protagonista: foto a lo ancho con la información sobre la imagen.
 * Se usa para la obra destacada en la portada.
 */
export function FeaturedProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-carbon-200 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-carbon-100 sm:aspect-[21/9]">
        <Image
          src={project.image}
          alt={`Obra ${project.title}`}
          fill
          sizes="(max-width: 1280px) 100vw, 1120px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-carbon-950/90 via-carbon-950/30 to-transparent"
        />
        <span className="absolute left-6 top-6 rounded-full bg-carbon-950/85 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-500 backdrop-blur-sm sm:left-10 sm:top-10">
          {project.category}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-carbon-300">
            {project.year}
          </p>
          <h3 className="title-xl mt-2 max-w-2xl text-2xl text-white sm:text-4xl">
            <Link
              href={`/proyectos/${project.slug}`}
              className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
            >
              {/* El span cubre toda la tarjeta para que sea clickeable */}
              <span className="absolute inset-0" aria-hidden="true" />
              {project.title}
            </Link>
          </h3>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-carbon-200">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Ubicación</dt>
              <MapPin className="h-4 w-4 text-brand-500" aria-hidden="true" />
              <dd>{project.location}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Superficie</dt>
              <Ruler className="h-4 w-4 text-brand-500" aria-hidden="true" />
              <dd>{project.surface}</dd>
            </div>
          </dl>

          <p className="mt-6 flex items-center gap-1.5 text-sm font-bold text-white transition-colors group-hover:text-brand-500">
            Ver proyecto
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </p>
        </div>
      </div>
    </article>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-carbon-100">
        <Image
          src={project.image}
          alt={`Obra ${project.title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-carbon-950/85 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-500 backdrop-blur-sm">
          {project.category}
        </span>
      </div>

      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-carbon-500">
          {project.year}
        </p>
        <h3 className="font-display mt-2 text-lg font-bold leading-snug text-carbon-900">
          <Link
            href={`/proyectos/${project.slug}`}
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
          >
            {/* El span cubre toda la tarjeta para que sea clickeable */}
            <span className="absolute inset-0" aria-hidden="true" />
            {project.title}
          </Link>
        </h3>

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-carbon-600">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Ubicación</dt>
            <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <dd>{project.location}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Superficie</dt>
            <Ruler className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <dd>{project.surface}</dd>
          </div>
        </dl>

        <p className="mt-5 flex items-center gap-1.5 text-sm font-bold text-carbon-900 transition-colors group-hover:text-brand-600">
          Ver proyecto
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </p>
      </div>
    </article>
  );
}
