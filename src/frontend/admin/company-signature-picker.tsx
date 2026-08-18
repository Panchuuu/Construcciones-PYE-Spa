"use client";

import { useState } from "react";
/* eslint-disable @next/next/no-img-element -- las firmas son data URLs */
import { Check, PenLine, Stamp } from "lucide-react";

import { SignaturePad } from "@/frontend/admin/signature-pad";
import { cn } from "@/frontend/lib/utils";

export type SavedSigner = {
  id: string;
  name: string;
  role: string | null;
  signature: string;
};

/**
 * Firma de la empresa en un acta: se elige una de las guardadas
 * (lo habitual) o se dibuja en el momento, para alguien sin firma
 * registrada. El nombre del firmante se completa solo al elegir.
 */
export function CompanySignaturePicker({
  signers,
  defaultSignerId,
  nameFieldId,
  signatureError,
}: {
  signers: SavedSigner[];
  defaultSignerId?: string;
  /** id del input con el nombre del representante, para completarlo. */
  nameFieldId: string;
  signatureError?: string;
}) {
  const [selected, setSelected] = useState<string | null>(
    defaultSignerId ?? signers[0]?.id ?? null,
  );

  function elegir(signer: SavedSigner) {
    setSelected(signer.id);
    // Completa el nombre del representante con el del firmante elegido.
    const field = document.getElementById(nameFieldId);
    if (field instanceof HTMLInputElement) field.value = signer.name;
  }

  const firmaElegida = signers.find((s) => s.id === selected);

  if (signers.length === 0) {
    // Sin firmas guardadas, se dibuja como antes.
    return (
      <SignaturePad
        name="companySignature"
        label="Firma representante empresa"
        error={signatureError}
      />
    );
  }

  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-carbon-800">
        <Stamp className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Firma representante empresa
        <span className="text-brand-600" aria-hidden="true">
          *
        </span>
      </span>

      <div className="space-y-2">
        {signers.map((signer) => {
          const activo = signer.id === selected;
          return (
            <button
              key={signer.id}
              type="button"
              onClick={() => elegir(signer)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border-2 p-3 text-left transition-colors",
                activo
                  ? "border-brand-500 bg-brand-50/50"
                  : "border-carbon-200 bg-white hover:border-carbon-400",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  activo
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-carbon-300",
                )}
                aria-hidden="true"
              >
                {activo && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-carbon-900">
                  {signer.name}
                </span>
                {signer.role && (
                  <span className="block text-xs text-carbon-600">
                    {signer.role}
                  </span>
                )}
              </span>
              <img
                src={signer.signature}
                alt=""
                aria-hidden="true"
                className="h-12 w-auto max-w-[7rem] object-contain"
              />
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setSelected(null)}
          className={cn(
            "flex w-full items-center gap-4 rounded-xl border-2 border-dashed p-3 text-left transition-colors",
            selected === null
              ? "border-brand-500 bg-brand-50/50"
              : "border-carbon-300 bg-white hover:border-carbon-400",
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              selected === null
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-carbon-300",
            )}
            aria-hidden="true"
          >
            {selected === null && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          <span className="flex items-center gap-2 text-sm font-bold text-carbon-800">
            <PenLine className="h-4 w-4 text-carbon-500" aria-hidden="true" />
            Firmar ahora en pantalla
          </span>
        </button>
      </div>

      {selected === null ? (
        <div className="mt-3">
          <SignaturePad
            name="companySignature"
            label="Dibuja la firma"
            error={signatureError}
          />
        </div>
      ) : (
        <>
          <input
            type="hidden"
            name="companySignature"
            value={firmaElegida?.signature ?? ""}
            readOnly
          />
          {signatureError && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {signatureError}
            </p>
          )}
        </>
      )}
    </div>
  );
}
