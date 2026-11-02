"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { chipClass } from "@/frontend/admin/personal-ui";
import { ScrollStrip } from "@/frontend/admin/scroll-strip";

const tabs = [
  { href: "/admin/personal/liquidaciones", label: "Liquidaciones" },
  { href: "/admin/personal/dia-hombre", label: "Día hombre" },
  { href: "/admin/personal/finiquitos", label: "Finiquitos" },
  { href: "/admin/personal/parametros", label: "Parámetros" },
];

/** Pestañas internas del módulo de personal. */
export function PersonalSubnav() {
  const pathname = usePathname();
  const inTab = tabs.some((tab) => pathname.startsWith(tab.href));
  const items = [
    { href: "/admin/personal", label: "Trabajadores", active: !inTab },
    ...tabs.map((tab) => ({ ...tab, active: pathname.startsWith(tab.href) })),
  ];

  return (
    <nav aria-label="Secciones de personal" className="print:hidden">
      {/* key: al cambiar de pestaña la franja vuelve a centrar la activa */}
      <ScrollStrip key={pathname} label="Secciones de personal">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={chipClass(item.active)}
          >
            {item.label}
          </Link>
        ))}
      </ScrollStrip>
    </nav>
  );
}
