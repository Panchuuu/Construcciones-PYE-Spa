import { ArrowRight } from "lucide-react";

import { projects } from "@/backend/data/projects";
import { ButtonLink, Container, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";
import { ProjectCard } from "@/frontend/components/project-card";

export function FeaturedProjects() {
  const featured = projects.slice(0, 3);

  return (
    <section className="bg-carbon-50 py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Obras ejecutadas"
              title="Proyectos que hablan por nosotros"
              description="Una muestra de las obras entregadas en los últimos años."
            />
            <ButtonLink
              href="/proyectos"
              variant="outline"
              className="shrink-0 self-start md:self-auto"
            >
              Ver todos los proyectos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, index) => (
            <Reveal key={project.slug} delay={index * 90}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
