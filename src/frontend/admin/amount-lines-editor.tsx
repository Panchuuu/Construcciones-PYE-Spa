"use client";

import { Plus, Trash2 } from "lucide-react";

import { fieldClass } from "@/frontend/admin/ui";
import { cn } from "@/frontend/lib/utils";

/** Línea en edición: el monto se escribe como texto ("150.000"). */
export type LineDraft = { name: string; amount: string };

/** "150.000" → 150000. */
export function parseMoney(value: string) {
  const n = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Líneas con nombre, listas para enviar o calcular. */
export function cleanLines(lines: LineDraft[]) {
  return lines
    .filter((line) => line.name.trim() !== "" && parseMoney(line.amount) > 0)
    .map((line) => ({ name: line.name.trim(), amount: parseMoney(line.amount) }));
}

export function toDrafts(lines: { name: string; amount: number }[] | undefined) {
  return (lines ?? []).map((line) => ({ name: line.name, amount: String(line.amount) }));
}

/**
 * Lista editable de conceptos con monto (bonos, descuentos…).
 * Viaja al servidor como JSON en un campo oculto con el nombre dado.
 */
export function AmountLinesEditor({
  name,
  label,
  hint,
  lines,
  onChange,
  placeholder,
  suggestions = [],
  error,
}: {
  name: string;
  label: string;
  hint?: string;
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
  placeholder: string;
  suggestions?: string[];
  error?: string;
}) {
  const listId = `${name}-sugerencias`;

  function update(index: number, patch: Partial<LineDraft>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-carbon-800">{label}</p>
      {hint && <p className="-mt-1 mb-2 text-xs text-carbon-500">{hint}</p>}
      <input type="hidden" name={name} value={JSON.stringify(cleanLines(lines))} />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}

      <ul className="space-y-2">
        {lines.map((line, index) => (
          <li key={index} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl max-sm:bg-carbon-50 max-sm:p-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_auto]">
            <input
              type="text"
              aria-label="Concepto"
              list={suggestions.length ? listId : undefined}
              value={line.name}
              onChange={(e) => update(index, { name: e.target.value })}
              placeholder={placeholder}
              maxLength={80}
              className={cn(fieldClass, "max-sm:col-span-2")}
            />
            <input
              type="text"
              inputMode="numeric"
              aria-label="Monto"
              value={line.amount}
              onChange={(e) => update(index, { amount: e.target.value })}
              placeholder="$0"
              className={cn(fieldClass, "text-right tabular-nums")}
            />
            <button
              type="button"
              onClick={() => onChange(lines.filter((_, i) => i !== index))}
              aria-label="Quitar línea"
              className="grid min-w-11 place-items-center rounded-xl border border-carbon-200 bg-white px-3 text-carbon-500 transition-colors hover:border-red-300 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...lines, { name: "", amount: "" }])}
        className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50 active:bg-brand-50 pointer-coarse:min-h-11"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar
      </button>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
