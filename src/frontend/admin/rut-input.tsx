"use client";

import { useState } from "react";

import { formatRutWhileTyping } from "@/backend/lib/rut";
import { fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { cn } from "@/frontend/lib/utils";

/**
 * Campo de RUT que agrega puntos y guion solo mientras se escribe
 * (ej: "111111111" → "11.111.111-1"). Acepta K como dígito verificador.
 */
export function RutInput({
  name,
  defaultValue,
  hasError,
}: {
  name: string;
  defaultValue?: string | null;
  hasError?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <input
      id={name}
      name={name}
      type="text"
      inputMode="text"
      autoComplete="off"
      value={value}
      onChange={(event) => setValue(formatRutWhileTyping(event.target.value))}
      placeholder="12.345.678-K"
      maxLength={12}
      className={cn(fieldClass, hasError && fieldErrorClass)}
    />
  );
}
