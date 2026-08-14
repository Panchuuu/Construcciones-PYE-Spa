/**
 * Crea (o actualiza) un usuario administrador del panel.
 *
 * Uso:
 *   npm run admin:crear -- "Nombre Apellido" correo@ejemplo.cl "contraseña-segura"
 *
 * Si el correo ya existe, actualiza su nombre y contraseña.
 */
import "dotenv/config";

import { hashSync } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error(
    'Faltan datos.\n\nUso:\n  npm run admin:crear -- "Nombre Apellido" correo@ejemplo.cl "contraseña"\n',
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/data.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = hashSync(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email: normalizedEmail },
    create: { name, email: normalizedEmail, passwordHash },
    update: { name, passwordHash },
  });

  console.log(`✓ Administrador listo: ${admin.name} <${admin.email}>`);
  console.log("  Ya puede ingresar en /admin/login");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("No se pudo crear el administrador:", error);
  process.exit(1);
});
