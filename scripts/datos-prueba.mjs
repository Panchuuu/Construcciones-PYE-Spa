/**
 * Inserta datos de prueba (cliente + trabajo + acta con firmas) para
 * probar el panel en desarrollo. NO usar en producción.
 *
 * Uso: node scripts/datos-prueba.mjs
 */
import Database from "better-sqlite3";

const db = new Database("prisma/data.db");
const now = Date.now();

// Firma de ejemplo: PNG diminuto válido (un trazo no es necesario para probar).
const firma =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

db.prepare(
  `INSERT OR IGNORE INTO Client (id, name, rut, company, email, phone, address, notes, createdAt, updatedAt)
   VALUES ('cliente-prueba', 'Cliente de Prueba', '11.111.111-1', NULL, 'cliente@prueba.cl', '+56911111111', 'Calle Falsa 123, Santiago', NULL, ?, ?)`,
).run(now, now);

db.prepare(
  `INSERT OR IGNORE INTO Work (id, clientId, title, description, location, status, createdAt, updatedAt)
   VALUES ('trabajo-prueba', 'cliente-prueba', 'Techumbre casa prueba', 'Cambio de techumbre completa', 'El Bosque, Santiago', 'en_progreso', ?, ?)`,
).run(now, now);

const maxFolio =
  db.prepare("SELECT MAX(folio) AS f FROM Delivery").get().f ?? 0;

db.prepare(
  `INSERT OR IGNORE INTO Delivery (id, folio, workId, type, date, notes, itemsJson,
     companySignerName, clientSignerName, clientSignerRut,
     companySignature, clientSignature, receivedOk, emailSentAt, createdAt)
   VALUES ('acta-prueba', ?, 'trabajo-prueba', 'materiales', ?, 'Entrega parcial de materiales para la primera etapa.',
     '[{"descripcion":"Planchas de zinc acanalado 0.35mm","cantidad":"24","unidad":"unidades"},{"descripcion":"Costaneras de acero galvanizado","cantidad":"12","unidad":"tiras"}]',
     'Patricio Parra', 'Cliente de Prueba', '11.111.111-1', ?, ?, 1, NULL, ?)`,
).run(maxFolio + 1, now, firma, firma, now);

console.log("Datos de prueba listos: acta 'acta-prueba' con folio", maxFolio + 1);
