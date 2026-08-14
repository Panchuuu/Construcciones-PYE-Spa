import "server-only";

import { compare, hash } from "bcryptjs";

import { prisma } from "@/backend/db/prisma";

const BCRYPT_ROUNDS = 12;

/**
 * Verifica correo y contraseña.
 * Devuelve el admin si son correctos, o null si no
 * (sin distinguir entre "no existe" y "contraseña mala").
 */
export async function verifyCredentials(email: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!admin) {
    // Igualamos el tiempo de respuesta para no revelar qué correos existen.
    await compare(password, "$2a$12$invalidinvalidinvalidinvaliduFake0hashFake0hashFake0ha");
    return null;
  }

  const ok = await compare(password, admin.passwordHash);
  return ok ? admin : null;
}

export async function hashPassword(password: string) {
  return hash(password, BCRYPT_ROUNDS);
}
