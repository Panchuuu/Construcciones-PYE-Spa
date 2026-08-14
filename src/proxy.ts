import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Primera barrera del panel: toda ruta /admin (salvo el login)
 * exige una sesión válida. Cada página y acción vuelve a verificar
 * con requireAdmin(), así que esto es defensa en profundidad.
 *
 * Nota: el proxy no importa módulos de la app (recomendación de Next),
 * por eso el nombre de la cookie y el secreto se resuelven aquí mismo,
 * con los mismos valores que src/backend/auth/session.ts.
 */
const SESSION_COOKIE = "pye_admin_session";

function getSecret() {
  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "pye-dev-secret-no-usar-en-produccion"
      : "");
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, getSecret());
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
