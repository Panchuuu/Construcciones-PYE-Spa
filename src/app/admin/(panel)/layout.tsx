import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/backend/actions/auth.actions";
import { requireAdmin } from "@/backend/auth/session";
import { Logo } from "@/frontend/components/logo";
import { AdminNav } from "@/frontend/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel PYE" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-carbon-50">
      <header className="border-b border-carbon-200 bg-carbon-950 print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/admin" aria-label="Ir al panel">
            <Logo variant="light" className="[&_svg]:h-8" />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-carbon-300 sm:block">
              {session.name}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2 text-sm font-semibold text-carbon-200 transition-colors hover:border-brand-500 hover:text-white"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Salir
              </button>
            </form>
          </div>
        </div>

        <AdminNav />
        {/* Respiro para que el subrayado rojo de la pestaña activa no se funda con la franja */}
        <div className="hazard-stripe mt-1 h-1" aria-hidden="true" />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
        {children}
      </main>

      <footer className="border-t border-carbon-200 bg-white py-4 print:hidden">
        <p className="text-center text-xs text-carbon-500">
          Panel interno de Construcciones PYE SpA — uso exclusivo del equipo.
        </p>
      </footer>
    </div>
  );
}
