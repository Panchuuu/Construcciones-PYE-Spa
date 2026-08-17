/**
 * Carga en la base de datos los proyectos de ejemplo que antes vivían
 * en el código (src/backend/data/projects.ts). Se ejecuta una sola vez
 * al desplegar la administración de proyectos; si ya hay obras
 * registradas, no hace nada.
 *
 * Uso:  npm run proyectos:importar
 */
import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";
import { seedProjects } from "../src/backend/data/projects";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/data.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.project.count();
  if (existing > 0) {
    console.log(
      `Ya hay ${existing} proyecto(s) en la base de datos. No se importó nada.`,
    );
    return;
  }

  for (const project of seedProjects) {
    const { scope, image, ...rest } = project;
    await prisma.project.create({
      data: {
        ...rest,
        scopeJson: JSON.stringify(scope),
        imagePath: image,
      },
    });
  }

  console.log(`✓ Importados ${seedProjects.length} proyectos de ejemplo.`);
  console.log("  Edítalos o reemplázalos desde /admin/proyectos");
}

main()
  .catch((error) => {
    console.error("No se pudieron importar los proyectos:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
