import "server-only";

import { env } from "@/backend/config/env";

/**
 * Aviso instantáneo al teléfono cuando entra una cotización.
 *
 * El correo siempre se envía; esto es un extra para no depender de
 * revisar la bandeja. Hay dos canales, ambos opcionales y gratuitos:
 *
 *  - WhatsApp vía CallMeBot (WHATSAPP_ALERT_PHONE + WHATSAPP_ALERT_APIKEY)
 *  - Telegram vía bot propio (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
 *
 * Importante: por estos canales viaja solo lo mínimo (nombre de pila,
 * servicio y enlace al panel). Los datos de contacto del cliente van
 * únicamente en el correo, que es un canal propio de la empresa.
 */

const TIEMPO_LIMITE_MS = 6000;

async function fetchConTiempoLimite(url: string) {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);
  try {
    return await fetch(url, { signal: control.signal });
  } finally {
    clearTimeout(temporizador);
  }
}

async function enviarWhatsApp(mensaje: string) {
  const url =
    "https://api.callmebot.com/whatsapp.php" +
    `?phone=${encodeURIComponent(env.whatsappAlertPhone)}` +
    `&apikey=${encodeURIComponent(env.whatsappAlertApiKey)}` +
    `&text=${encodeURIComponent(mensaje)}`;

  const respuesta = await fetchConTiempoLimite(url);
  if (!respuesta.ok) {
    throw new Error(`CallMeBot respondió ${respuesta.status}`);
  }
}

async function enviarTelegram(mensaje: string) {
  const url =
    `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage` +
    `?chat_id=${encodeURIComponent(env.telegramChatId)}` +
    `&text=${encodeURIComponent(mensaje)}` +
    "&disable_web_page_preview=true";

  const respuesta = await fetchConTiempoLimite(url);
  if (!respuesta.ok) {
    throw new Error(`Telegram respondió ${respuesta.status}`);
  }
}

/**
 * Envía el aviso por los canales configurados.
 * Nunca lanza: un fallo aquí no debe romper el envío del formulario.
 */
export async function sendPushAlert(mensaje: string): Promise<void> {
  const envios: Array<Promise<void>> = [];

  if (env.whatsappAlertPhone && env.whatsappAlertApiKey) {
    envios.push(
      enviarWhatsApp(mensaje).catch((error) =>
        console.error("[aviso] WhatsApp falló:", error),
      ),
    );
  }

  if (env.telegramBotToken && env.telegramChatId) {
    envios.push(
      enviarTelegram(mensaje).catch((error) =>
        console.error("[aviso] Telegram falló:", error),
      ),
    );
  }

  await Promise.all(envios);
}
