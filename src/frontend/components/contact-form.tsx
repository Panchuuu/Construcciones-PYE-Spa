"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";

import {
  contactSchema,
  type ContactResponse,
} from "@/backend/schemas/contact.schema";
import { whatsappUrl } from "@/backend/config/site";
import { buttonStyles } from "@/frontend/components/ui";
import { cn } from "@/frontend/lib/utils";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

const fieldBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-carbon-900 outline-none transition-colors placeholder:text-carbon-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

export function ContactForm({ services }: { services: string[] }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    // Primera validación en el navegador: feedback inmediato, sin ir al servidor
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus({
        state: "error",
        message: "Revisa los campos marcados en rojo.",
      });
      return;
    }

    setErrors({});
    setStatus({ state: "sending" });

    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data: ContactResponse = await response.json();

      if (!data.ok) {
        setErrors(data.fieldErrors ?? {});
        setStatus({ state: "error", message: data.message });
        return;
      }

      form.reset();
      setStatus({ state: "success", message: data.message });
    } catch {
      setStatus({
        state: "error",
        message:
          "Hubo un problema de conexión. Revisa tu internet o escríbenos por WhatsApp.",
      });
    }
  }

  if (status.state === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2
          className="mx-auto h-12 w-12 text-green-600"
          aria-hidden="true"
        />
        <h3 className="font-display mt-4 text-xl font-bold text-carbon-900">
          ¡Mensaje enviado!
        </h3>
        <p className="mt-2 text-sm text-carbon-600">{status.message}</p>
        <button
          type="button"
          onClick={() => setStatus({ state: "idle" })}
          className="mt-6 text-sm font-bold text-brand-700 underline underline-offset-4 hover:text-brand-600"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const sending = status.state === "sending";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre completo" name="name" error={errors.name} required>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Juan Pérez"
            className={cn(fieldBase, borderFor(errors.name))}
          />
        </Field>

        <Field label="Teléfono" name="phone" error={errors.phone} required>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+56 9 1234 5678"
            className={cn(fieldBase, borderFor(errors.phone))}
          />
        </Field>
      </div>

      <Field label="Correo electrónico" name="email" error={errors.email} required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.cl"
          className={cn(fieldBase, borderFor(errors.email))}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Servicio de interés"
          name="service"
          error={errors.service}
          required
        >
          <select
            id="service"
            name="service"
            defaultValue=""
            className={cn(fieldBase, borderFor(errors.service))}
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
            <option value="Otro">Otro / No estoy seguro</option>
          </select>
        </Field>

        <Field label="Comuna o ubicación" name="location" error={errors.location}>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="Ej: Maipú, Santiago"
            className={cn(fieldBase, borderFor(errors.location))}
          />
        </Field>
      </div>

      <Field
        label="Cuéntanos del proyecto"
        name="message"
        error={errors.message}
        required
      >
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Metros cuadrados aproximados, plazo estimado, si tienes planos, etc."
          className={cn(fieldBase, "resize-y", borderFor(errors.message))}
        />
      </Field>

      {/* Campo trampa para bots: invisible y fuera del orden de tabulación */}
      <div aria-hidden="true" className="absolute left-[-9999px] opacity-0">
        <label htmlFor="website">No completar</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status.state === "error" && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p>{status.message}</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-bold underline underline-offset-4"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className={cn(buttonStyles.primary, "w-full text-base")}
      >
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            Enviar solicitud
          </>
        )}
      </button>

      <p className="text-center text-xs text-carbon-500">
        Respondemos dentro de 24 horas hábiles. Tus datos se usan solo para
        contactarte por este requerimiento.
      </p>
    </form>
  );
}

function borderFor(error?: string) {
  return error ? "border-red-400" : "border-carbon-200";
}

function Field({
  label,
  name,
  error,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-carbon-800"
      >
        {label}
        {required && (
          <span className="ml-1 text-brand-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
