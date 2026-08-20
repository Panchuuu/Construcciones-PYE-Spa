"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, LogIn } from "lucide-react";

import { loginAction } from "@/backend/actions/auth.actions";

const fieldClass =
  "w-full rounded-xl border border-white/15 bg-carbon-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-carbon-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-semibold text-carbon-200"
        >
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="tu@correo.cl"
          className={fieldClass}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-semibold text-carbon-200"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={fieldClass}
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="anim-rise flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Ingresando…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Ingresar
          </>
        )}
      </button>
    </form>
  );
}
