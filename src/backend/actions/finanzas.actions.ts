"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import { toFieldErrors } from "@/backend/schemas/admin.schema";
import { movementSchema } from "@/backend/schemas/finanzas.schema";
import * as movements from "@/backend/services/movements.service";

const MAX_ATTACHMENT_BYTES = 5_000_000; // 5 MB
const ATTACHMENT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function saveMovementAction(
  movementId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  if (movementId) {
    const current = await movements.getMovement(movementId);
    if (!current) return { error: "El movimiento ya no existe." };
    if (movements.isAutomatic(current)) {
      return { error: "Este movimiento se generó solo: corrígelo desde su documento de origen." };
    }
  }

  const parsed = movementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: toFieldErrors(parsed.error) };
  }

  // Respaldo opcional: al editar, sin archivo nuevo se conserva el actual.
  let attachment: movements.Attachment | null = null;
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    if (!ATTACHMENT_MIMES.includes(file.type)) {
      return {
        error: "Revisa los campos marcados.",
        fieldErrors: { attachment: "Formato no admitido: usa JPG, PNG, WebP o PDF" },
      };
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return {
        error: "Revisa los campos marcados.",
        fieldErrors: { attachment: "El archivo supera los 5 MB" },
      };
    }
    attachment = {
      data: new Uint8Array(await file.arrayBuffer()),
      mime: file.type,
      name: file.name.slice(0, 120),
    };
  }
  const removeAttachment = formData.get("removeAttachment") === "on";

  const movement = movementId
    ? await movements.updateMovement(movementId, parsed.data, attachment, removeAttachment)
    : await movements.createMovement(parsed.data, attachment);

  revalidatePath("/admin", "layout");
  redirect(`/admin/finanzas/${movement.id}`);
}

export async function deleteMovementAction(movementId: string): Promise<void> {
  await requireAdmin();
  const current = await movements.getMovement(movementId);
  if (current && movements.isAutomatic(current)) {
    redirect(`/admin/finanzas/${movementId}`);
  }
  await movements.deleteMovement(movementId);
  revalidatePath("/admin", "layout");
  redirect("/admin/finanzas");
}
