# Construcciones PYE SpA — Sitio web corporativo

Sitio web de **Construcciones PYE SpA**, empresa constructora chilena.
Desarrollado por **Panchuuu**.

---

## Stack

| Capa          | Tecnología                                     |
| ------------- | ---------------------------------------------- |
| Framework     | Next.js 16 (App Router) + React 19             |
| Lenguaje      | TypeScript (modo estricto)                     |
| Estilos       | Tailwind CSS 4 (tema propio con tokens)        |
| Íconos        | lucide-react                                   |
| Validación    | Zod (compartida entre cliente y servidor)      |
| Correo        | Resend                                         |
| Base de datos | SQLite + Prisma 7 (panel de administración)    |
| Sesiones      | JWT firmado (jose) + bcryptjs                  |

---

## Estructura del proyecto

El código está separado en dos capas claras: **frontend** (todo lo visual) y
**backend** (datos, validación, servicios y lógica de servidor). La carpeta
`app/` solo contiene rutas, que delegan en una u otra capa.

```
src/
├── app/                          # RUTAS (Next.js App Router)
│   ├── layout.tsx                # Layout raíz: fuentes, SEO, header/footer
│   ├── page.tsx                  # Inicio
│   ├── servicios/page.tsx
│   ├── proyectos/page.tsx
│   ├── proyectos/[slug]/page.tsx # Detalle de cada obra (estático)
│   ├── nosotros/page.tsx
│   ├── contacto/page.tsx
│   ├── api/contacto/route.ts     # Solo delega en el handler del backend
│   ├── sitemap.ts · robots.ts    # SEO técnico
│   ├── icon.svg · not-found.tsx
│
├── frontend/                     # CAPA DE PRESENTACIÓN
│   ├── components/               # Piezas reutilizables
│   │   ├── ui.tsx                # Container, botones, encabezados
│   │   ├── site-header.tsx       # Navegación + menú móvil
│   │   ├── site-footer.tsx
│   │   ├── logo.tsx
│   │   ├── service-card.tsx · project-card.tsx
│   │   ├── projects-grid.tsx     # Filtro de proyectos por categoría
│   │   ├── contact-form.tsx      # Formulario con validación en vivo
│   │   ├── whatsapp-button.tsx   # Botón flotante
│   │   └── reveal.tsx            # Animación de entrada al hacer scroll
│   ├── sections/                 # Bloques grandes de página
│   │   ├── hero.tsx · services-preview.tsx · why-us.tsx
│   │   ├── featured-projects.tsx · process.tsx · faq.tsx · cta-band.tsx
│   ├── lib/                      # Utilidades de UI (cn, mapa de íconos)
│   └── styles/globals.css        # Tema Tailwind: colores, tipografías
│
└── backend/                      # CAPA DE SERVIDOR Y DATOS
    ├── api/contact.handler.ts    # Orquesta la petición del formulario
    ├── services/
    │   ├── quote.service.ts      # Arma el correo de cotización
    │   ├── mailer.service.ts     # Envío vía Resend
    │   └── rate-limit.service.ts # Anti-spam por IP
    ├── schemas/contact.schema.ts # Contrato de datos (Zod)
    ├── data/                     # Contenido editable del sitio
    │   ├── services.ts · projects.ts · company.ts
    └── config/
        ├── site.ts               # ← DATOS DE LA EMPRESA
        └── env.ts                # Variables de entorno
```

---

## Puesta en marcha

```bash
npm install          # instalar dependencias
npm run dev          # entorno de desarrollo → http://localhost:3000
npm run build        # compilado de producción
npm start            # servir el compilado
npm run lint         # revisar estilo de código
```

---

## Qué editar para actualizar el sitio

| Quiero cambiar…                          | Archivo                              |
| ---------------------------------------- | ------------------------------------ |
| Teléfono, correo, dirección, redes, RUT  | `src/backend/config/site.ts`         |
| Cifras del inicio (años, m², proyectos)  | `src/backend/config/site.ts` → `stats` |
| Servicios que ofrece la empresa          | `src/backend/data/services.ts`       |
| Obras del portafolio                     | `src/backend/data/projects.ts`       |
| Proceso, valores, historia, preguntas    | `src/backend/data/company.ts`        |
| Colores y tipografías                    | `src/frontend/styles/globals.css`    |
| Logo                                     | `src/frontend/components/logo.tsx`   |

> Los valores provisorios están marcados en el código con `⚠️ REEMPLAZAR`.

### Fotos de las obras

Las imágenes actuales son ilustraciones provisorias en
`public/images/proyectos/`. Para usar fotos reales:

1. Sube los archivos (`.jpg` o `.webp`, idealmente 1600×1200 px) a esa carpeta.
2. Cambia la ruta del campo `image` en `src/backend/data/projects.ts`.

---

## Formulario de contacto

El formulario valida en el navegador y **otra vez en el servidor** (nunca se
confía en el cliente). Incluye campo trampa anti-bots y límite de 5 envíos por
IP cada 10 minutos.

Para que los correos se envíen de verdad:

1. Crea una cuenta en [resend.com](https://resend.com) y genera una API key.
2. Copia `.env.example` a `.env.local` y completa las variables.
3. Reinicia el servidor de desarrollo.

Mientras no haya API key configurada, el formulario **avisa honestamente** al
visitante que el envío no está disponible y le ofrece WhatsApp como
alternativa; nunca finge haber enviado el mensaje.

---

## Panel de administración (`/admin`)

Panel interno con credenciales para que la empresa registre sus **entregas
conformes**:

- **Clientes** — datos personales y de contacto.
- **Trabajos** — obras/servicios asociados a cada cliente, con estado.
- **Actas de entrega** — de *trabajo* o de *materiales* (con lista detallada),
  **firmadas en pantalla** por el representante de la empresa y el cliente al
  momento de la entrega. Cada acta recibe un folio correlativo (N° 001, 002…).
- **Envío del detalle** — por correo (Resend) al cliente, por WhatsApp con el
  resumen precargado, o impresión/PDF del acta con las firmas.

### Personal y remuneraciones (`/admin/personal`)

- **Trabajadores** — ficha con contrato (plazo fijo, por obra o faena,
  indefinido o **día hombre**), sueldo, AFP, salud (Fonasa/Isapre en UF),
  colación, movilización, datos bancarios y obra asignada.
- **Parámetros** — UF, UTM, ingreso mínimo, topes imponibles y tasas (AFP,
  SIS, mutual, aporte de la reforma previsional) **de cada mes**. Se traen
  **solos desde Previred cada 2 días** (`indicators-sync.service.ts`): al usar
  el panel, en segundo plano, y con la tarea programada
  `GET /api/cron/indicadores` (ver `DESPLIEGUE.md`). La UF del mes en curso
  queda *provisoria* hasta que se publica la del último día. Un mes guardado
  a mano no se sobrescribe. La mutual y el aporte de la reforma no vienen en
  Previred y se copian del mes anterior.
- **Liquidaciones** — cálculo con gratificación art. 50 (tope 4,75 IMM),
  horas extra al 50%, bonos, AFP, salud, seguro de cesantía según contrato,
  impuesto único (tramos en UTM), anticipos y descuentos. Vista previa en
  vivo, PDF para firmar y costo empresa con los aportes del empleador.
- **Pagos día hombre** — días × valor del día (+ extras − descuentos),
  sin descuentos previsionales, con comprobante PDF.
- **Finiquitos** — según la causal (arts. 159, 160 y 161): indemnización por
  años de servicio (tope 11 años y 90 UF), aviso previo, 2,5 días por mes en
  contratos por obra y feriado proporcional en días corridos. Cada monto
  propuesto se puede ajustar antes de emitir el PDF (para firmar ante
  ministro de fe). Al emitirlo el trabajador queda desvinculado; anularlo lo
  reactiva.

El cálculo vive en `src/backend/lib/payroll.ts` y `settlement.ts` (funciones
puras: las usan tanto el servidor como la vista previa). Cada documento
guarda una copia de los datos y parámetros usados, así no cambia si después
se edita la ficha del trabajador.

> Los cálculos son una herramienta de apoyo: conviene que el contador revise
> las primeras liquidaciones y cualquier finiquito antes de firmarlos.

### Finanzas (`/admin/finanzas`)

Ingresos y gastos con categoría, obra, proveedor/cliente, documento
(factura, boleta, honorarios…), medio de pago y **respaldo adjunto** (foto o
PDF, hasta 5 MB). Muestra totales del mes, gastos por categoría y el
resultado de cada obra (también en la ficha de cada trabajo).
Las liquidaciones (costo empresa), finiquitos y pagos día hombre crean su
gasto **automáticamente**; se corrigen o borran desde su documento de origen.

### Crear un administrador

```bash
npm run admin:crear -- "Nombre Apellido" correo@ejemplo.cl "contraseña-segura"
```

Si el correo ya existe, se actualiza su contraseña. Luego se ingresa en
`/admin/login` (hay un enlace discreto "Acceso administradores" en el footer).

### Base de datos

Los datos viven en `prisma/data.db` (SQLite), **fuera del repositorio**.
Comandos útiles:

```bash
npm run db:migrar    # aplicar cambios del esquema (prisma migrate dev)
npm run db:estudio   # explorar los datos en el navegador (prisma studio)
```

> ⚠️ **Antes de publicar en Vercel**: SQLite guarda los datos en un archivo
> local, que en Vercel se pierde en cada deploy. Para producción hay que
> migrar a Postgres (Neon/Supabase): cambiar el `provider` del
> `prisma/schema.prisma`, la `DATABASE_URL` y el adaptador en
> `src/backend/db/prisma.ts`. El resto del código no cambia.
> Alternativa: alojar el sitio en un VPS, donde SQLite funciona bien.

### Seguridad

- Sesiones JWT en cookie `httpOnly` (12 h), firmadas con `AUTH_SECRET`.
- Contraseñas con bcrypt (12 rondas).
- Doble barrera: `src/proxy.ts` corta el acceso a `/admin/*` sin sesión, y
  cada página/acción vuelve a validar con `requireAdmin()`.
- Límite de intentos de login por IP.

---

## Despliegue

Recomendado: [Vercel](https://vercel.com) (creadores de Next.js, plan gratuito
suficiente para este sitio).

1. Sube el repositorio a GitHub.
2. En Vercel: **Add New → Project** e importa el repositorio.
3. Agrega las variables de entorno de `.env.example` en *Settings → Environment Variables*.
4. Deploy. Cada `git push` a `main` publica automáticamente.

Antes de publicar, actualiza `site.url` en `src/backend/config/site.ts` con el
dominio definitivo: de ahí salen el sitemap, el `robots.txt` y las etiquetas
Open Graph.

---

## Accesibilidad y SEO

- Marcado semántico, `lang="es-CL"` y enlace "saltar al contenido".
- Navegación operable por teclado, con foco visible y `aria-*` en el menú.
- Respeta `prefers-reduced-motion` (desactiva las animaciones).
- Metadatos por página, sitemap y `robots.txt` automáticos.
- Datos estructurados `GeneralContractor` (Schema.org) para Google.
