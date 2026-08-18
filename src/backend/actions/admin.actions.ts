"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/backend/auth/session";
import {
  clientSchema,
  deliverySchema,
  projectSchema,
  signerSchema,
  slugify,
  toFieldErrors,
  workSchema,
  QUOTE_STATUSES,
  type MaterialItem,
  type QuoteStatus,
} from "@/backend/schemas/admin.schema";
import * as clients from "@/backend/services/clients.service";
import * as deliveries from "@/backend/services/deliveries.service";
import * as projects from "@/backend/services/projects.service";
import * as quotes from "@/backend/services/quotes.service";
import * as signers from "@/backend/services/signers.service";
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

/* ── Firmantes de la empresa ───────────────────────────────── */

export async function saveSignerAction(
  signerId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = signerSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    signature: formData.get("signature") ?? "",
    isDefault: formData.get("isDefault") === "on",
  });

  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // Al crear, la firma es obligatoria; al editar puede conservarse.
  if (!signerId && !parsed.data.signature) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: { signature: "Sube o dibuja la firma" },
    };
  }

  const signer = signerId
    ? await signers.updateSigner(signerId, parsed.data)
    : await signers.createSigner(parsed.data);

  revalidatePath("/admin", "layout");
  redirect(`/admin/firmantes?guardado=${signer.id}`);
}

export async function deleteSignerAction(signerId: string) {
  await requireAdmin();
  await signers.deleteSigner(signerId);
  revalidatePath("/admin", "layout");
  redirect("/admin/firmantes");
}

/* ── Proyectos ─────────────────────────────────────────────── */

const MAX_IMAGE_BYTES = 4_000_000; // 4 MB
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function saveProjectAction(
  projectId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  // El alcance se escribe como una línea por hito.
  const scope = String(formData.get("scope") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    location: formData.get("location"),
    year: formData.get("year"),
    surface: formData.get("surface"),
    duration: formData.get("duration"),
    client: formData.get("client"),
    summary: formData.get("summary"),
    scope,
  });

  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // Si no se escribió un slug, se genera desde el título.
  const slug = parsed.data.slug
    ? slugify(parsed.data.slug)
    : slugify(parsed.data.title);

  if (!slug) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: { slug: "No se pudo generar la dirección web" },
    };
  }

  if (await projects.slugTaken(slug, projectId ?? undefined)) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: { slug: "Ya existe otro proyecto con esa dirección web" },
    };
  }

  // Foto (opcional): al editar, sin archivo nuevo se conserva la actual.
  let image: { data: Uint8Array<ArrayBuffer>; mime: string } | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!IMAGE_MIMES.includes(file.type)) {
      return {
        error: "Revisa los campos marcados.",
        fieldErrors: { image: "Formato no admitido: usa JPG, PNG, WebP o AVIF" },
      };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        error: "Revisa los campos marcados.",
        fieldErrors: { image: "La imagen supera los 4 MB" },
      };
    }
    image = {
      data: new Uint8Array(await file.arrayBuffer()),
      mime: file.type,
    };
  }

  if (!projectId && !image) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: { image: "Sube una foto de la obra" },
    };
  }

  const input = { ...parsed.data, slug };
  const project = projectId
    ? await projects.updateProject(projectId, input, image)
    : await projects.createProject(input, image);

  // Las páginas públicas también muestran proyectos.
  revalidatePath("/", "layout");
  redirect(`/admin/proyectos/${project.id}`);
}

export async function deleteProjectAction(projectId: string) {
  await requireAdmin();
  await projects.deleteProject(projectId);
  revalidatePath("/", "layout");
  redirect("/admin/proyectos");
}

/* ── Cotizaciones ──────────────────────────────────────────── */

export async function setQuoteStatusAction(
  quoteId: string,
  status: string,
) {
  await requireAdmin();
  if (!(status in QUOTE_STATUSES)) return;
  await quotes.updateQuoteStatus(quoteId, status as QuoteStatus);
  revalidatePath("/admin", "layout");
}

export async function deleteQuoteAction(quoteId: string) {
  await requireAdmin();
  await quotes.deleteQuote(quoteId);
  revalidatePath("/admin", "layout");
  redirect("/admin/cotizaciones");
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
          ? "El envío de correos no está configurado (faltan las variables SMTP en el archivo .env)."
          : "El proveedor de correo rechazó el envío. Intenta de nuevo en unos minutos.";
    return { ok: false, message };
  }

  await deliveries.markDeliveryEmailed(deliveryId);
  revalidatePath(`/admin/entregas/${deliveryId}`);
  return { ok: true, message: "Acta enviada al correo del cliente." };
}
