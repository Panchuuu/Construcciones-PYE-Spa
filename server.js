/**
 * Archivo de arranque para hosting con Passenger (DirectAdmin/cPanel
 * → "Setup Node.js App"). En ese panel, indicar este archivo como
 * "Application startup file".
 *
 * En desarrollo local NO se usa (ahí basta `npm run dev`).
 */
const http = require("http");
const next = require("next");

const app = next({ dev: false });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  http
    .createServer((req, res) => handle(req, res))
    .listen(port, () => {
      console.log(`Sitio listo en el puerto ${port}`);
    });
});
