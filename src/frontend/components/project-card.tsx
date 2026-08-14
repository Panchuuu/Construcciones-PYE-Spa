import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Ruler } from "lucide-react";

import type { Project } from "@/backend/data/projects";

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
          <Link href={`/proyectos/${project.slug}`}>
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
