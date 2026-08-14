import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/backend/auth/session";
import { Logo } from "@/frontend/components/logo";
import { LoginForm } from "@/frontend/admin/login-form";

export const metadata: Metadata = {
  title: "Acceso administradores",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // Si ya hay sesión, directo al panel
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-carbon-950 px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo variant="light" />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-carbon-900 p-7 shadow-lift">
          <h1 className="font-display text-xl font-extrabold text-white">
            Panel de administración
          </h1>
          <p className="mt-1.5 text-sm text-carbon-300">
            Acceso exclusivo para el equipo de la empresa.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-carbon-500">
          ¿Problemas para entrar? Contacta a quien administra el sitio.
        </p>
      </div>
    </div>
  );
}
