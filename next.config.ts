import type { NextConfig } from "next";
import { existsSync, lstatSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * En hosting tipo DirectAdmin/CloudLinux ("Setup Node.js App"), la carpeta
 * node_modules NO es real: es un enlace simbólico que apunta fuera del
 * proyecto (~/nodevenv/<app>/<version>/lib/node_modules). Turbopack no
 * resuelve módulos fuera de la raíz del proyecto, así que la compilación
 * falla con: "Symlink [project]/node_modules is invalid, it points out of
 * the filesystem root". Cuando detectamos ese enlace, ampliamos la raíz de
 * Turbopack al directorio padre (que contiene tanto el proyecto como el
 * node_modules enlazado). En local, donde node_modules es una carpeta
 * normal, esto no se aplica y no cambia nada.
 */
const nodeModules = join(process.cwd(), "node_modules");
const nodeModulesEsEnlace =
  existsSync(nodeModules) && lstatSync(nodeModules).isSymbolicLink();

const nextConfig: NextConfig = {
  /**
   * Orígenes externos autorizados para acceder al servidor de DESARROLLO
   * (por ejemplo, túneles de VS Code Dev Tunnels para probar desde el
   * celular). No afecta a producción.
   */
  allowedDevOrigins: ["*.devtunnels.ms", "**.devtunnels.ms"],

  ...(nodeModulesEsEnlace
    ? { turbopack: { root: dirname(process.cwd()) } }
    : {}),

  experimental: {
    serverActions: {
      /**
       * Permite enviar formularios (Server Actions: login, actas, etc.)
       * cuando el sitio se visita a través de un túnel o proxy.
       * Nota: "*" calza UN nivel de subdominio; "**" calza varios
       * (los túneles usan <id>-<puerto>.<región>.devtunnels.ms).
       */
      allowedOrigins: ["**.devtunnels.ms"],
      /**
       * Las actas de entrega incluyen dos firmas como imagen PNG,
       * por eso subimos el límite por defecto de 1 MB.
       */
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
