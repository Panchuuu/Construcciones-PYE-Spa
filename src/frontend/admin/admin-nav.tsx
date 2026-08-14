"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  HardHat,
  Inbox,
  LayoutDashboard,
  Users,
} from "lucide-react";

import { cn } from "@/frontend/lib/utils";

const links = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/cotizaciones", label: "Cotizaciones", icon: Inbox },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/trabajos", label: "Trabajos", icon: HardHat },
  { href: "/admin/entregas", label: "Entregas", icon: ClipboardCheck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones del panel"
      className="mx-auto max-w-7xl overflow-x-auto px-5 sm:px-8"
    >
      <ul className="flex gap-1">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
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
    </nav>
  );
}
