import "server-only";

import { prisma } from "@/backend/db/prisma";
import type { SignerInput } from "@/backend/schemas/admin.schema";

export function listSigners() {
  return prisma.signer.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export function getSigner(id: string) {
  return prisma.signer.findUnique({ where: { id } });
}

/** El que viene preseleccionado al crear un acta. */
export function getDefaultSigner() {
  return prisma.signer.findFirst({
    where: { isDefault: true },
    orderBy: { name: "asc" },
  });
}

/** Solo puede haber un firmante por defecto. */
async function clearOtherDefaults(exceptId?: string) {
  await prisma.signer.updateMany({
    where: exceptId ? { id: { not: exceptId } } : {},
    data: { isDefault: false },
  });
}

export async function createSigner(input: SignerInput) {
  const signer = await prisma.signer.create({
    data: {
      name: input.name,
      role: input.role || null,
      signature: input.signature,
      isDefault: input.isDefault,
    },
  });
  if (signer.isDefault) await clearOtherDefaults(signer.id);
  return signer;
}

export async function updateSigner(id: string, input: SignerInput) {
  const signer = await prisma.signer.update({
    where: { id },
    data: {
      name: input.name,
      role: input.role || null,
      // Sin firma nueva se conserva la actual.
      ...(input.signature ? { signature: input.signature } : {}),
      isDefault: input.isDefault,
    },
  });
  if (signer.isDefault) await clearOtherDefaults(signer.id);
  return signer;
}

export function deleteSigner(id: string) {
  return prisma.signer.delete({ where: { id } });
}
