import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Check, Clock, MapPin, Ruler } from "lucide-react";

import {
  getPublicProject,
  listPublicProjects,
} from "@/backend/services/projects.service";
import { Container } from "@/frontend/components/ui";
import { ProjectCard } from "@/frontend/components/project-card";
import { CtaBand } from "@/frontend/sections/cta-band";

type Params = { params: Promise<{ slug: string }> };

/** Pre-genera una página estática por cada obra. */
export async function generateStaticParams() {
  const projects = await listPublicProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) return { title: "Proyecto no encontrado" };

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: [project.image],
    },
  };
}

export default async function ProyectoPage({ params }: Params) {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) notFound();

  const all = await listPublicProjects();
  const related = all
    .filter((p) => p.slug !== project.slug && p.category === project.category)
    .slice(0, 3);

  const facts = [
    { icon: MapPin, label: "Ubicación", value: project.location },
    { icon: Ruler, label: "Superficie", value: project.surface },
    { icon: Clock, label: "Duración", value: project.duration },
    { icon: CalendarDays, label: "Año", value: String(project.year) },
    { icon: Building2, label: "Mandante", value: project.client },
  ];

  return (
    <>
      <section className="bg-carbon-950 pb-12 pt-32 sm:pt-40">
        <Container>
          <Link
            href="/proyectos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-300 transition-colors hover:text-brand-500"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a proyectos
          </Link>

          <p className="eyebrow mt-8 text-brand-500">{project.category}</p>
          <h1 className="title-xl mt-3 max-w-4xl text-3xl text-white sm:text-5xl">
            {project.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-carbon-300 sm:text-lg">
            {project.summary}
          </p>
        </Container>
      </section>

      <section className="bg-carbon-950 pb-20">
        <Container>
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-carbon-900">
            <Image
              src={project.image}
              alt={`Obra ${project.title}`}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          </div>

          <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-carbon-950 p-6">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-carbon-400">
                  <fact.icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
                  {fact.label}
                </dt>
                <dd className="mt-2 font-display text-lg font-bold text-white">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <h2 className="title-xl text-2xl text-carbon-900 sm:text-3xl">
              Alcance de la obra
            </h2>
            <ul className="space-y-4">
              {project.scope.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border-b border-carbon-100 pb-4 text-base text-carbon-700"
                >
                  <Check
                    className="mt-1 h-5 w-5 shrink-0 text-brand-600"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="bg-carbon-50 py-20">
          <Container>
            <h2 className="title-xl text-2xl text-carbon-900 sm:text-3xl">
              Otros proyectos de {project.category.toLowerCase()}
            </h2>
            <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProjectCard key={item.slug} project={item} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaBand />
    </>
  );
}
