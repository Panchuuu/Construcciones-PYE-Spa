import type { Metadata } from "next";

import {
  listCategories,
  listPublicProjects,
} from "@/backend/services/projects.service";
import { Container, PageHero } from "@/frontend/components/ui";
import { ProjectsGrid } from "@/frontend/components/projects-grid";
import { CtaBand } from "@/frontend/sections/cta-band";

export const metadata: Metadata = {
  title: "Proyectos",
  description:
    "Obras de edificación, vivienda, industria y remodelación ejecutadas por Construcciones PYE en Chile.",
};

export default async function ProyectosPage() {
  const [projects, projectCategories] = await Promise.all([
    listPublicProjects(),
    listCategories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Proyectos"
        title="Obras entregadas"
        description="Cada obra tiene su propia historia de plazos, terreno y desafíos. Estas son algunas de las que hemos ejecutado."
      />

      <section className="bg-carbon-50 py-16 sm:py-20">
        <Container>
          <ProjectsGrid projects={projects} categories={projectCategories} />
        </Container>
      </section>

      <CtaBand
        title="¿Quieres que tu obra sea la próxima?"
        description="Agenda una visita técnica gratuita y conversemos sobre tu proyecto."
      />
    </>
  );
}
