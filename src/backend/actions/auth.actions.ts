"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { verifyCredentials } from "@/backend/auth/auth.service";
import { clearSessionCookie, setSessionCookie } from "@/backend/auth/session";
import { checkRateLimit } from "@/backend/services/rate-limit.service";

export type LoginState = { error?: string } | undefined;

const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresa tu correo").email("Correo no válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos incompletos." };
  }

  // Frena intentos de fuerza bruta por IP
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "local";
  const limit = checkRateLimit(`login:${ip}`);
  if (!limit.allowed) {
    return {
      error: `Demasiados intentos. Espera ${Math.ceil(limit.retryAfterSeconds / 60)} minutos.`,
    };
  }

  const admin = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!admin) {
    return { error: "Correo o contraseña incorrectos." };
  }

  await setSessionCookie({
    adminId: admin.id,
    name: admin.name,
    email: admin.email,
  });

  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
