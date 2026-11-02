"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/frontend/lib/utils";

/**
 * Fila horizontal que se desliza con el dedo cuando no cabe (pestañas,
 * filtros). El borde se difumina solo hacia el lado donde hay más
 * opciones, así se nota que se puede deslizar, y la opción activa
 * (aria-current o aria-pressed) se centra al cargar.
 */
export function ScrollStrip({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({
        start: el.scrollLeft > 4,
        end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    const active = el.querySelector<HTMLElement>('[aria-current="page"], [aria-current="true"]');
    if (active && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2;
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const mask =
    edges.start || edges.end
      ? `linear-gradient(to right, ${edges.start ? "transparent, black 2.5rem" : "black"}, ${edges.end ? "black calc(100% - 2.5rem), transparent" : "black"})`
      : undefined;

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cn("scroll-strip -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0", className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <div className="flex w-max gap-1.5">{children}</div>
    </div>
  );
}

