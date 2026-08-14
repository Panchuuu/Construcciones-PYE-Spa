"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine } from "lucide-react";

/**
 * Pad de firma: se dibuja con el dedo o el mouse sobre un canvas.
 * Al terminar cada trazo, la firma se exporta como PNG a un
 * input oculto con el nombre indicado, listo para enviarse en el form.
 */
export function SignaturePad({
  name,
  label,
  error,
}: {
  name: string;
  label: string;
  error?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [empty, setEmpty] = useState(true);

  // Ajusta la resolución interna del canvas al tamaño real en pantalla
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const { width, height } = canvas.getBoundingClientRect();
      // Redimensionar borra el canvas: solo lo hacemos si aún no hay firma
      if (hasInk.current) return;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1a2032";
      }
    };

    setup();
    window.addEventListener("resize", setup);
    return () => window.removeEventListener("resize", setup);
  }, []);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handleDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y } = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Un punto visible aunque solo se toque sin arrastrar
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    hasInk.current = true;
    setEmpty(false);
  }

  function handleMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handleUp() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && inputRef.current) {
      inputRef.current.value = canvas.toDataURL("image/png");
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (inputRef.current) inputRef.current.value = "";
    hasInk.current = false;
    setEmpty(true);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-carbon-800">
          <PenLine className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {label}
          <span className="text-brand-600" aria-hidden="true">
            *
          </span>
        </span>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs font-bold text-carbon-500 transition-colors hover:text-red-600"
        >
          <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
          Limpiar
        </button>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl border-2 bg-white ${
          error ? "border-red-400" : "border-dashed border-carbon-300"
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          className="block h-36 w-full touch-none cursor-crosshair"
          aria-label={`Área para dibujar la firma: ${label}`}
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-carbon-400">
            Firmar aquí con el dedo o el mouse
          </span>
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 bottom-6 border-b border-carbon-200"
        />
      </div>

      <input ref={inputRef} type="hidden" name={name} defaultValue="" />
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
