"use client";

import { useRef, useState } from "react";
/* eslint-disable @next/next/no-img-element -- la firma es un data URL local */
import { Eraser, ImageUp, Loader2, PenLine } from "lucide-react";

import { cleanSignatureImage } from "@/frontend/lib/clean-signature";
import { cn } from "@/frontend/lib/utils";

type Modo = "subir" | "dibujar";

/**
 * Captura de firma para guardarla en la ficha del firmante:
 * se puede subir una foto de la firma en papel (se le quita el fondo
 * automáticamente) o dibujarla en pantalla.
 */
export function SignatureCapture({
  name,
  initial,
  error,
}: {
  name: string;
  /** Firma ya guardada, al editar. */
  initial?: string | null;
  error?: string;
}) {
  const [modo, setModo] = useState<Modo>("subir");
  const [valor, setValor] = useState(initial ?? "");
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);

  async function handleArchivo(file: File) {
    setProcesando(true);
    setAviso(null);
    try {
      const { dataUrl } = await cleanSignatureImage(file);
      setValor(dataUrl);
    } catch (e) {
      setAviso(
        e instanceof Error ? e.message : "No se pudo procesar la imagen",
      );
    } finally {
      setProcesando(false);
    }
  }

  /* ── Dibujo en pantalla ── */

  function prepararLienzo() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (canvas.width !== canvas.clientWidth * 2) {
      canvas.width = canvas.clientWidth * 2;
      canvas.height = canvas.clientHeight * 2;
      ctx.scale(2, 2);
    }
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a2032";
    return ctx;
  }

  function punto(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function abajo(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const ctx = prepararLienzo();
    if (!ctx) return;
    dibujando.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y } = punto(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  }

  function mover(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = punto(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function arriba() {
    if (!dibujando.current) return;
    dibujando.current = false;
    const canvas = canvasRef.current;
    if (canvas) setValor(canvas.toDataURL("image/png"));
  }

  function limpiar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setValor("");
    setAviso(null);
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-carbon-800">
          Firma
          <span className="ml-1 text-brand-600" aria-hidden="true">
            *
          </span>
        </span>
        <div className="flex gap-1 rounded-lg bg-carbon-100 p-1">
          {([
            { valor: "subir", label: "Subir foto", icono: ImageUp },
            { valor: "dibujar", label: "Dibujar", icono: PenLine },
          ] as const).map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setModo(opcion.valor)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors",
                modo === opcion.valor
                  ? "bg-white text-carbon-900 shadow-sm"
                  : "text-carbon-600 hover:text-carbon-900",
              )}
            >
              <opcion.icono className="h-3.5 w-3.5" aria-hidden="true" />
              {opcion.label}
            </button>
          ))}
        </div>
      </div>

      {modo === "subir" ? (
        <div className="space-y-3">
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
              error
                ? "border-red-400"
                : "border-carbon-300 hover:border-carbon-900",
            )}
          >
            {procesando ? (
              <Loader2
                className="h-6 w-6 animate-spin text-brand-600"
                aria-hidden="true"
              />
            ) : (
              <ImageUp className="h-6 w-6 text-brand-600" aria-hidden="true" />
            )}
            <span className="text-sm font-bold text-carbon-800">
              {procesando ? "Procesando…" : "Subir foto de la firma"}
            </span>
            <span className="max-w-xs text-xs text-carbon-500">
              Firma en una hoja blanca, sácale una foto y súbela. Le quitamos
              el fondo automáticamente.
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleArchivo(file);
              }}
            />
          </label>
        </div>
      ) : (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border-2 bg-white",
            error ? "border-red-400" : "border-dashed border-carbon-300",
          )}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={abajo}
            onPointerMove={mover}
            onPointerUp={arriba}
            onPointerCancel={arriba}
            className="block h-36 w-full touch-none cursor-crosshair"
            aria-label="Área para dibujar la firma"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 bottom-6 border-b border-carbon-200"
          />
        </div>
      )}

      {/* Vista previa sobre cuadrícula, para comprobar que el fondo es transparente */}
      {valor && modo === "subir" && (
        <figure className="mt-3">
          <div
            className="flex items-center justify-center rounded-xl border border-carbon-200 p-4"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#eef1f6 25%,transparent 25%,transparent 75%,#eef1f6 75%),linear-gradient(45deg,#eef1f6 25%,transparent 25%,transparent 75%,#eef1f6 75%)",
              backgroundSize: "14px 14px",
              backgroundPosition: "0 0, 7px 7px",
            }}
          >
            <img
              src={valor}
              alt="Vista previa de la firma"
              className="max-h-28 w-auto"
            />
          </div>
          <figcaption className="mt-1.5 text-xs text-carbon-500">
            Así se verá en las actas y en el PDF (el cuadriculado es solo para
            mostrar que el fondo quedó transparente).
          </figcaption>
        </figure>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {valor && (
          <button
            type="button"
            onClick={limpiar}
            className="flex items-center gap-1 text-xs font-bold text-carbon-500 transition-colors hover:text-red-600"
          >
            <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
            Quitar firma
          </button>
        )}
        {initial && !valor && (
          <span className="text-xs text-carbon-500">
            Se conservará la firma guardada si no subes otra.
          </span>
        )}
      </div>

      <input type="hidden" name={name} value={valor} readOnly />

      {aviso && (
        <p className="mt-1.5 text-xs font-medium text-amber-700">{aviso}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
