"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";

import { Logo } from "@/frontend/components/logo";
import { navigation, site } from "@/backend/config/site";
import { cn } from "@/frontend/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Evita el scroll del fondo con el menú abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /** El menú móvil se cierra al navegar a otra página. */
  const closeMenu = () => setOpen(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "bg-carbon-950/95 shadow-lg shadow-carbon-950/20 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Ir al inicio" className="shrink-0">
          <Logo variant="light" />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "text-brand-500"
                        : "text-carbon-100 hover:text-white",
                    )}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-brand-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={`tel:${site.contact.phone}`}
            className="flex items-center gap-2 text-sm font-semibold text-carbon-100 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4 text-brand-500" aria-hidden="true" />
            {site.contact.phoneDisplay}
          </a>
          <Link
            href="/contacto"
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-all hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/25"
          >
            Cotizar proyecto
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
        >
          {open ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Menú móvil */}
      <div
        id="menu-movil"
        hidden={!open}
        className="border-t border-white/10 bg-carbon-950 lg:hidden"
      >
        <nav aria-label="Principal móvil" className="px-5 py-4 sm:px-8">
          <ul className="flex flex-col gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-carbon-100 transition-colors hover:bg-white/5 hover:text-brand-500"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
            <a
              href={`tel:${site.contact.phone}`}
              className="flex items-center gap-2 px-4 text-sm font-semibold text-carbon-200"
            >
              <Phone className="h-4 w-4 text-brand-500" aria-hidden="true" />
              {site.contact.phoneDisplay}
            </a>
            <Link
              href="/contacto"
              onClick={closeMenu}
              className="rounded-xl bg-brand-500 px-5 py-3 text-center text-sm font-bold text-carbon-950"
            >
              Cotizar proyecto
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
