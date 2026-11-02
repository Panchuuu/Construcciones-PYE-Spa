# Despliegue en DirectAdmin (ServidoresPH)

Guía para publicar el sitio en el hosting propio con **Setup Node.js App**.
Requisitos ya verificados: Node ≥ 20.9 en el servidor y acceso SSH (Terminal).

---

## 1. Agregar el dominio a la cuenta

**DirectAdmin → Dominios** → verificar que `construccionespyespa.cl` esté en
la lista. Si no, agregarlo ahí (Add Domain).

## 2. Crear la aplicación Node

**DirectAdmin → Setup Node.js App → Create Application**:

| Campo                    | Valor                            |
| ------------------------ | -------------------------------- |
| Node.js version          | 22.x (LTS más alta disponible)   |
| Application mode         | Production                       |
| Application root         | `construcciones-pye`             |
| Application URL          | `construccionespyespa.cl`        |
| Application startup file | `server.js`                      |

Crear. El panel mostrará arriba un comando del estilo:

```
source /home/USUARIO/nodevenv/construcciones-pye/20/bin/activate && cd /home/USUARIO/construcciones-pye
```

**Copiarlo**: es la forma de "entrar" al entorno de la app en la terminal.
(En adelante lo llamamos *comando de activación*.)

## 3. Clonar el proyecto (Terminal)

Abrir **Terminal** y ejecutar:

```bash
cd ~/construcciones-pye
git init
git remote add origin https://github.com/Panchuuu/Construcciones-PYE-Spa.git
git pull origin main
```

## 4. Variables de entorno

Crear el archivo `.env` dentro de `~/construcciones-pye`:

```bash
echo 'DATABASE_URL="file:./prisma/data.db"' > .env
echo 'AUTH_SECRET=PEGA_AQUI_UN_SECRETO_LARGO' >> .env
```

- `AUTH_SECRET`: cadena aleatoria larga (64 caracteres hex). Generar una con
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
  **Sin esta variable el panel /admin no arranca en producción.**
- Para activar el correo (formulario y actas) agregar también las variables
  `SMTP_*` (Gmail con contraseña de aplicación; ver `.env.example`).
- Opcional: para recibir además un aviso al celular cuando entra una
  cotización, agregar `WHATSAPP_ALERT_*` (CallMeBot) o `TELEGRAM_*`
  (bot propio). Las instrucciones paso a paso están en `.env.example`.

## 5. Instalar, migrar y compilar

Pegar el *comando de activación* (paso 2) y luego:

```bash
npm install --include=dev   # TODAS las dependencias (el modo Production
                            # omite las dev, pero el build las necesita)
npx prisma generate         # cliente Prisma (el postinstall falla en este
                            # hosting porque corre fuera del proyecto: ignorar
                            # su error y ejecutar esto a mano)
npx prisma migrate deploy   # crea/actualiza las tablas en prisma/data.db
npm run proyectos:importar  # carga los proyectos de ejemplo (solo la 1ª vez;
                            # después se administran desde /admin/proyectos)
npm run build               # compila el sitio para producción
```

> **Nota del hosting (CloudLinux):** la carpeta `node_modules` que crea el
> panel es un enlace simbólico y Turbopack no compila a través de él. Si
> `npm run build` reclama por "Symlink … filesystem root" o no encuentra
> módulos, convertirla en carpeta real:
>
> ```bash
> rm -f node_modules
> cp -a ~/nodevenv/construcciones-pye/22/lib/node_modules ./node_modules
> ```

> Si `npm run build` termina "Killed", la cuenta se quedó sin RAM durante la
> compilación. Avisar al desarrollador: hay plan B (compilar fuera y subir
> el resultado).

## 6. Crear el primer administrador

```bash
npm run admin:crear -- "Nombre Apellido" correo@ejemplo.cl "contraseña-segura"
```

## 7. Arrancar

**Setup Node.js App → Restart** sobre la aplicación.
Visitar `https://construccionespyespa.cl` (sitio) y
`https://construccionespyespa.cl/admin/login` (panel).

## 8. SSL

**DirectAdmin → Certificados SSL** → emitir Let's Encrypt para
`construccionespyespa.cl` y `www` si no está ya activo.

---

## Actualizar el sitio (cada vez que haya cambios)

Con el *comando de activación* pegado:

```bash
git pull origin main
npm install --include=dev
npx prisma generate
npx prisma migrate deploy
npm run build
```

y **Restart** en Setup Node.js App.

> **Primera vez con Personal y Finanzas:** `migrate deploy` crea las tablas
> nuevas. Los indicadores previsionales (UF, UTM, sueldo mínimo, topes,
> tasas AFP y SIS) se traen **solos desde Previred cada 2 días** cuando
> alguien usa el panel; también se pueden traer al momento en
> **Panel → Personal → Parámetros → Actualizar ahora**. Revisar ahí una vez
> la tasa de la **mutual** (0,93% básica + la adicional de la empresa), que
> no viene en Previred y se copia de mes a mes.

## Tarea programada de indicadores (recomendada)

Respaldo para que los indicadores estén al día aunque nadie entre al panel.

1. Agregar al `.env` una clave (generarla con
   `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`):
   ```bash
   echo 'CRON_SECRET=PEGA_AQUI_LA_CLAVE' >> .env
   ```
   y **Restart** en Setup Node.js App.
2. **DirectAdmin → Tareas Cron (Cron Jobs)** → nueva tarea:
   - Minuto `0`, Hora `6`, Día del mes `*/2`, Mes `*`, Día de la semana `*`
   - Comando:
     ```bash
     curl -fsS -H "Authorization: Bearer PEGA_AQUI_LA_CLAVE" https://construccionespyespa.cl/api/cron/indicadores > /dev/null
     ```
3. Probarla una vez a mano en la Terminal (debe responder `"ok":true`):
   ```bash
   curl -sS -H "Authorization: Bearer PEGA_AQUI_LA_CLAVE" https://construccionespyespa.cl/api/cron/indicadores
   ```

## Copias de seguridad

Los datos del panel viven en **`~/construcciones-pye/prisma/data.db`**
(no está en Git). Ese archivo guarda clientes, trabajos, actas,
cotizaciones, **trabajadores, liquidaciones, finiquitos, ingresos y gastos
(con sus respaldos adjuntos) y las fotos de los proyectos**, así que es el
respaldo más importante: incluirlo en las copias del hosting (JetBackup ya
respalda el home, pero conviene verificarlo).
