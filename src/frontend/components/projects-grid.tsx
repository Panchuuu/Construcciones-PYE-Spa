"use client";

import { useMemo, useState } from "react";

import type { Project } from "@/backend/data/projects";
import { ProjectCard } from "@/frontend/components/project-card";
import { cn } from "@/frontend/lib/utils";

export function ProjectsGrid({
  projects,
  categories,
}: {
  projects: Project[];
  categories: string[];
}) {
  const [active, setActive] = useState("Todos");

  const visible = useMemo(
    () =>
      active === "Todos"
        ? projects
        : projects.filter((project) => project.category === active),
    [active, projects],
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filtrar proyectos por categoría"
        className="flex flex-wrap gap-2.5"
      >
        {categories.map((category) => {
          const selected = category === active;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(category)}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-semibold transition-all",
                selected
                  ? "border-brand-500 bg-brand-500 text-carbon-950"
                  : "border-carbon-200 bg-white text-carbon-700 hover:border-carbon-900",
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-carbon-300 p-10 text-center text-sm text-carbon-500">
          Aún no publicamos proyectos en esta categoría.
        </p>
      )}
    </div>
  );
}
