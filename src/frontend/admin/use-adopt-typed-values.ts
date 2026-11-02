"use client";

import { useEffect, type RefObject } from "react";

/**
 * Si alguien escribe en el formulario antes de que React termine de
 * cargar (teléfono lento), el campo conserva lo escrito pero el estado
 * de React no se entera: la vista previa calcularía con un valor y el
 * servidor guardaría otro. Al montar, copiamos al estado lo que ya
 * esté escrito en esos campos.
 */
export function useAdoptTypedValues(
  formRef: RefObject<HTMLFormElement | null>,
  setters: Record<string, (value: string) => void>,
) {
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    for (const [name, set] of Object.entries(setters)) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
        set(field.value);
      }
    }
    // Solo al montar: después, los onChange mantienen el estado al día.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
