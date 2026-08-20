"use client";

/** Botón que abre el diálogo de impresión del navegador. */
export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
    >
      {children}
    </button>
  );
}
