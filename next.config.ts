import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Orígenes externos autorizados para acceder al servidor de DESARROLLO
   * (por ejemplo, túneles de VS Code Dev Tunnels para probar desde el
   * celular). No afecta a producción.
   */
  allowedDevOrigins: ["*.devtunnels.ms", "**.devtunnels.ms"],

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
