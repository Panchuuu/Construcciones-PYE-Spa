"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ClipboardCheck,
  FileText,
  HardHat,
  Images,
  Inbox,
  LayoutDashboard,
  Stamp,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

import { cn } from "@/frontend/lib/utils";

const links = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/cotizaciones", label: "Cotizaciones", icon: Inbox },
  { href: "/admin/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/trabajos", label: "Trabajos", icon: HardHat },
  { href: "/admin/entregas", label: "Entregas", icon: ClipboardCheck },
  { href: "/admin/personal", label: "Personal", icon: UsersRound },
  { href: "/admin/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/admin/proyectos", label: "Proyectos", icon: Images },
  { href: "/admin/firmantes", label: "Firmantes", icon: Stamp },
];

/**
 * Navegación del panel.
 * - Pantallas anchas: las diez secciones en una fila de pestañas.
 * - Teléfono y tablet: la sección actual y un botón que abre una hoja
 *   inferior (<dialog> nativo: foco atrapado, Esc y fondo incluidos)
 *   con todas las secciones al alcance del pulgar.
 */
export function AdminNav() {
  const pathname = usePathname();
  const sheet = useRef<HTMLDialogElement>(null);

  const isActive = (link: (typeof links)[number]) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);
  const current = links.find(isActive) ?? links[0];

  // Al navegar, la hoja se cierra sola.
  useEffect(() => {
    sheet.current?.close();
  }, [pathname]);

  return (
    <nav aria-label="Secciones del panel" className="mx-auto max-w-7xl px-5 sm:px-8">
      {/* Escritorio */}
      <ul className="hidden gap-1 xl:flex">
        {links.map((link) => {
          const active = isActive(link);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors xl:px-3.5",
                  active
                    ? "border-brand-500 text-white"
                    : "border-transparent text-carbon-400 hover:text-carbon-200",
                )}
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Teléfono y tablet */}
      <div className="pb-3 xl:hidden">
        <button
          type="button"
          onClick={() => sheet.current?.showModal()}
          aria-haspopup="dialog"
          className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-white/[0.06] px-4 text-left ring-1 ring-white/10 transition-colors active:bg-white/10"
        >
          <current.icon className="h-5 w-5 text-brand-500" aria-hidden="true" />
          <span className="flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-carbon-400">
              Sección
            </span>
            <span className="block text-base font-bold leading-tight text-white">{current.label}</span>
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-carbon-300">
            Cambiar
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>

        <dialog
          ref={sheet}
          aria-label="Secciones del panel"
          onClick={(event) => {
            // Tocar el fondo oscuro cierra la hoja.
            if (event.target === sheet.current) sheet.current.close();
          }}
          className="sheet fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-0 text-carbon-900 shadow-lift backdrop:bg-carbon-950/60 sm:mx-auto sm:max-w-lg"
        >
          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-carbon-200" aria-hidden="true" />
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg font-extrabold">Ir a…</p>
              <button
                type="button"
                onClick={() => sheet.current?.close()}
                aria-label="Cerrar"
                className="grid h-11 w-11 place-items-center rounded-full text-carbon-500 transition-colors active:bg-carbon-100"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {links.map((link) => {
                const active = isActive(link);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => sheet.current?.close()}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-2xl px-4 text-[15px] font-semibold transition-colors active:scale-[0.98]",
                        active
                          ? "bg-carbon-950 text-white"
                          : "bg-carbon-50 text-carbon-800 ring-1 ring-carbon-100 active:bg-carbon-100",
                      )}
                    >
                      <link.icon
                        className={cn("h-5 w-5 shrink-0", active ? "text-brand-500" : "text-carbon-500")}
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </dialog>
      </div>
    </nav>
  );
}
