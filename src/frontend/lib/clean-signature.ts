/**
 * Limpieza de firmas escaneadas o fotografiadas.
 *
 * Una firma en papel llega con fondo (blanco grisáceo, textura, sombras).
 * Si se guardara así, en el acta y en el PDF aparecería un recuadro gris
 * en vez de solo el trazo. Aquí se hace, en el navegador:
 *   1. el fondo claro se vuelve transparente,
 *   2. el trazo se normaliza a tinta oscura conservando el suavizado,
 *   3. se recorta el sobrante alrededor de la firma,
 *   4. se reduce el tamaño para que no pese de más.
 */

/** Umbral de luminancia: sobre esto se considera papel, no tinta. */
const UMBRAL_PAPEL = 0.72;
/** Bajo esto es tinta plena; entre ambos, transición suavizada. */
const UMBRAL_TINTA = 0.42;
const ANCHO_MAXIMO = 700;
const MARGEN = 8;

export type CleanResult = {
  /** PNG con fondo transparente, listo para guardar y para el PDF. */
  dataUrl: string;
  width: number;
  height: number;
};

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null;

/**
 * Núcleo del proceso, sin depender del navegador: modifica los píxeles
 * en el sitio (papel → transparente, trazo → tinta) y devuelve los
 * límites de la firma, o null si no se encontró trazo alguno.
 */
export function cleanPixels(
  px: Uint8ClampedArray,
  ancho: number,
): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;

  for (let i = 0; i < px.length; i += 4) {
    const lum =
      (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;

    let alfa: number;
    if (lum >= UMBRAL_PAPEL) {
      alfa = 0;
    } else if (lum <= UMBRAL_TINTA) {
      alfa = 255;
    } else {
      // Zona intermedia: opacidad proporcional, así el borde no queda dentado.
      alfa = Math.round(
        ((UMBRAL_PAPEL - lum) / (UMBRAL_PAPEL - UMBRAL_TINTA)) * 255,
      );
    }

    if (alfa === 0) {
      px[i + 3] = 0;
      continue;
    }

    // Tinta azul oscura, igual que la firma dibujada en pantalla.
    px[i] = 26;
    px[i + 1] = 32;
    px[i + 2] = 50;
    px[i + 3] = alfa;

    const p = i / 4;
    const x = p % ancho;
    const y = (p - x) / ancho;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

function leerImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

export async function cleanSignatureImage(file: File): Promise<CleanResult> {
  const img = await leerImagen(file);

  // Trabajamos a tamaño acotado: una firma no necesita más resolución.
  const escala = Math.min(1, (ANCHO_MAXIMO * 2) / img.width);
  const ancho = Math.max(1, Math.round(img.width * escala));
  const alto = Math.max(1, Math.round(img.height * escala));

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("El navegador no permite procesar la imagen");

  ctx.drawImage(img, 0, 0, ancho, alto);
  const imagen = ctx.getImageData(0, 0, ancho, alto);

  const limites = cleanPixels(imagen.data, ancho);
  if (!limites) {
    throw new Error(
      "No se detectó ninguna firma: usa una foto con más contraste o fondo más claro",
    );
  }

  ctx.putImageData(imagen, 0, 0);

  // Recorte con un pequeño margen alrededor del trazo.
  const { minX, minY, maxX, maxY } = limites;
  const rx = Math.max(0, minX - MARGEN);
  const ry = Math.max(0, minY - MARGEN);
  const rw = Math.min(ancho - rx, maxX - minX + 1 + MARGEN * 2);
  const rh = Math.min(alto - ry, maxY - minY + 1 + MARGEN * 2);

  // Escala final para que el archivo quede liviano.
  const escalaFinal = Math.min(1, ANCHO_MAXIMO / rw);
  const finalW = Math.max(1, Math.round(rw * escalaFinal));
  const finalH = Math.max(1, Math.round(rh * escalaFinal));

  const recorte = document.createElement("canvas");
  recorte.width = finalW;
  recorte.height = finalH;
  const ctx2 = recorte.getContext("2d");
  if (!ctx2) throw new Error("El navegador no permite procesar la imagen");
  ctx2.imageSmoothingQuality = "high";
  ctx2.drawImage(lienzo, rx, ry, rw, rh, 0, 0, finalW, finalH);

  return {
    dataUrl: recorte.toDataURL("image/png"),
    width: finalW,
    height: finalH,
  };
}
