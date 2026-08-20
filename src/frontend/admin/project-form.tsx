"use client";

import { useActionState, useState } from "react";
/* eslint-disable @next/next/no-img-element -- la vista previa es un blob local */
import { AlertTriangle, ImagePlus, Loader2, Save } from "lucide-react";

import {
  saveProjectAction,
  type ActionState,
} from "@/backend/actions/admin.actions";
import { PROJECT_CATEGORIES } from "@/backend/schemas/admin.schema";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { cn } from "@/frontend/lib/utils";

type ProjectData = {
  slug: string;
  title: string;
  category: string;
  location: string;
  year: number;
  surface: string;
  duration: string;
  client: string;
  summary: string;
  scope: string[];
  /** Imagen actual, para mostrarla al editar. */
  imageUrl: string | null;
};

export function ProjectForm({
  projectId,
  initial,
}: {
  projectId: string | null;
  initial?: ProjectData;
}) {
  const action = saveProjectAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  // Vista previa de la foto elegida antes de guardar.
  const [preview, setPreview] = useState<string | null>(
    initial?.imageUrl ?? null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <AdminField
        label="Nombre de la obra"
        name="title"
        error={errors.title}
        required
      >
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initial?.title ?? ""}
          placeholder="Techumbre condominio Los Aromos"
          className={cn(fieldClass, errors.title && fieldErrorClass)}
        />
      </AdminField>

      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField
          label="Categoría"
          name="category"
          error={errors.category}
          required
        >
          <input
            id="category"
            name="category"
            type="text"
            list="categorias-proyecto"
            defaultValue={initial?.category ?? ""}
            placeholder="Techumbres"
            className={cn(fieldClass, errors.category && fieldErrorClass)}
          />
          <datalist id="categorias-proyecto">
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </AdminField>

        <AdminField
          label="Ubicación"
          name="location"
          error={errors.location}
          required
        >
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={initial?.location ?? ""}
            placeholder="El Bosque, RM"
            className={cn(fieldClass, errors.location && fieldErrorClass)}
          />
        </AdminField>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <AdminField label="Año" name="year" error={errors.year} required>
          <input
            id="year"
            name="year"
            type="number"
            inputMode="numeric"
            defaultValue={initial?.year ?? new Date().getFullYear()}
            className={cn(fieldClass, errors.year && fieldErrorClass)}
          />
        </AdminField>

        <AdminField
          label="Superficie"
          name="surface"
          error={errors.surface}
          required
        >
          <input
            id="surface"
            name="surface"
            type="text"
            defaultValue={initial?.surface ?? ""}
            placeholder="450 m²"
            className={cn(fieldClass, errors.surface && fieldErrorClass)}
          />
        </AdminField>

        <AdminField
          label="Duración"
          name="duration"
          error={errors.duration}
          required
        >
          <input
            id="duration"
            name="duration"
            type="text"
            defaultValue={initial?.duration ?? ""}
            placeholder="3 meses"
            className={cn(fieldClass, errors.duration && fieldErrorClass)}
          />
        </AdminField>
      </div>

      <AdminField
        label="Mandante"
        name="client"
        error={errors.client}
        required
        hint="Quién encargó la obra (aparece en la ficha pública)"
      >
        <input
          id="client"
          name="client"
          type="text"
          defaultValue={initial?.client ?? ""}
          placeholder="Inmobiliaria Los Aromos"
          className={cn(fieldClass, errors.client && fieldErrorClass)}
        />
      </AdminField>

      <AdminField
        label="Descripción"
        name="summary"
        error={errors.summary}
        required
        hint="Un párrafo: qué se hizo y qué lo hizo especial"
      >
        <textarea
          id="summary"
          name="summary"
          rows={4}
          defaultValue={initial?.summary ?? ""}
          placeholder="Cambio completo de techumbre en 12 viviendas, con retiro de cubierta antigua…"
          className={cn(
            fieldClass,
            "resize-y",
            errors.summary && fieldErrorClass,
          )}
        />
      </AdminField>

      <AdminField
        label="Alcance de la obra"
        name="scope"
        error={errors.scope}
        hint="Un hito por línea; se muestran como lista en la ficha"
      >
        <textarea
          id="scope"
          name="scope"
          rows={5}
          defaultValue={initial?.scope.join("\n") ?? ""}
          placeholder={"Retiro de cubierta existente\nEstructura de madera\nInstalación de zinc acanalado"}
          className={cn(fieldClass, "resize-y", errors.scope && fieldErrorClass)}
        />
      </AdminField>

      <AdminField
        label="Foto de la obra"
        name="image"
        error={errors.image}
        required={!projectId}
        hint="JPG, PNG o WebP, hasta 4 MB. Se recorta en formato apaisado."
      >
        <div className="space-y-3">
          {preview && (
            <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl border border-carbon-200 bg-carbon-100">
              <img
                src={preview}
                alt="Vista previa de la obra"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition-colors",
              errors.image
                ? "border-red-400 text-red-700"
                : "border-carbon-300 text-carbon-700 hover:border-carbon-900",
            )}
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {preview ? "Cambiar foto" : "Seleccionar foto"}
            <input
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>
      </AdminField>

      <AdminField
        label="Dirección web"
        name="slug"
        error={errors.slug}
        hint="Opcional: se genera sola desde el nombre de la obra"
      >
        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={initial?.slug ?? ""}
          placeholder="techumbre-condominio-los-aromos"
          className={cn(fieldClass, errors.slug && fieldErrorClass)}
        />
      </AdminField>

      {state?.error && (
        <p
          role="alert"
          className="anim-rise flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        {projectId ? "Guardar cambios" : "Publicar proyecto"}
      </button>
    </form>
  );
}
