"use client";

import { startTransition } from "react";

/**
 * En React 19, un <form action={…}> se vacía al terminar la acción,
 * incluso si el servidor devolvió errores de validación. En formularios
 * largos eso obliga a reescribir todo; enviando desde onSubmit dentro de
 * una transición el formulario conserva lo escrito.
 */
export function keepValuesOnSubmit(formAction: (formData: FormData) => void) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };
}
