"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/backend/auth/session";
import {
  clientSchema,
  deliverySchema,
  toFieldErrors,
  workSchema,
  type MaterialItem,
} from "@/backend/schemas/admin.schema";
import * as clients from "@/backend/services/clients.service";
import * as deliveries from "@/backend/services/deliveries.service";
import * as works from "@/backend/services/works.service";
import {
  sendDeliveryEmail,
} from "@/backend/services/delivery-notify.service";

export type ActionState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

/* ── Clientes ──────────────────────────────────────────────── */

export async function saveClientAction(
  clientId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const client = clientId
    ? await clients.updateClient(clientId, parsed.data)
    : await clients.createClient(parsed.data);

  revalidatePath("/admin", "layout");
  redirect(`/admin/clientes/${client.id}`);
}

export async function deleteClientAction(clientId: string) {
  await requireAdmin();
  await clients.deleteClient(clientId);
  revalidatePath("/admin", "layout");
  redirect("/admin/clientes");
}

/* ── Trabajos ──────────────────────────────────────────────── */

export async function saveWorkAction(
  workId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = workSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const work = workId
    ? await works.updateWork(workId, parsed.data)
    : await works.createWork(parsed.data);

  revalidatePath("/admin", "layout");
  redirect(`/admin/trabajos/${work.id}`);
}

export async function deleteWorkAction(workId: string) {
  await requireAdmin();
  await works.deleteWork(workId);
  revalidatePath("/admin", "layout");
  redirect("/admin/trabajos");
}

/* ── Entregas ──────────────────────────────────────────────── */

export async function createDeliveryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  // Los materiales llegan como JSON serializado desde el formulario
  let items: MaterialItem[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    items = [];
  }

  const parsed = deliverySchema.safeParse({
    workId: formData.get("workId"),
    type: formData.get("type"),
    notes: formData.get("notes"),
    items,
    companySignerName: formData.get("companySignerName"),
    clientSignerName: formData.get("clientSignerName"),
    clientSignerRut: formData.get("clientSignerRut"),
    companySignature: formData.get("companySignature"),
    clientSignature: formData.get("clientSignature"),
    receivedOk: formData.get("receivedOk") === "on",
  });

  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const delivery = await deliveries.createDelivery(parsed.data);

  revalidatePath("/admin", "layout");
  redirect(`/admin/entregas/${delivery.id}`);
}

export async function deleteDeliveryAction(deliveryId: string) {
  await requireAdmin();
  await deliveries.deleteDelivery(deliveryId);
  revalidatePath("/admin", "layout");
  redirect("/admin/entregas");
}

export type SendEmailState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | undefined;

export async function sendDeliveryEmailAction(
  deliveryId: string,
): Promise<SendEmailState> {
  await requireAdmin();

  const delivery = await deliveries.getDelivery(deliveryId);
  if (!delivery) return { ok: false, message: "El acta ya no existe." };

  const result = await sendDeliveryEmail(delivery);

  if (!result.delivered) {
    const message =
      result.reason === "no-email"
        ? "Este cliente no tiene correo registrado. Agrégalo en su ficha y reintenta."
        : result.reason === "not-configured"
          ? "El envío de correos no está configurado (falta RESEND_API_KEY en .env.local)."
          : "El proveedor de correo rechazó el envío. Intenta de nuevo en unos minutos.";
    return { ok: false, message };
  }

  await deliveries.markDeliveryEmailed(deliveryId);
  revalidatePath(`/admin/entregas/${deliveryId}`);
  return { ok: true, message: "Acta enviada al correo del cliente." };
}
