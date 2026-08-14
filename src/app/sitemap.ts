import type { MetadataRoute } from "next";

import { site } from "@/backend/config/site";
import { projects } from "@/backend/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/servicios", priority: 0.9 },
    { path: "/proyectos", priority: 0.9 },
    { path: "/nosotros", priority: 0.7 },
    { path: "/contacto", priority: 0.8 },
  ].map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: route.priority,
  }));

  const projectRoutes = projects.map((project) => ({
    url: `${site.url}/proyectos/${project.slug}`,
    lastModified,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes];
}
