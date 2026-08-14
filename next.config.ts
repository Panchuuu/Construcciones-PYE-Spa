import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Orígenes externos autorizados para acceder al servidor de DESARROLLO
   * (por ejemplo, túneles de VS Code Dev Tunnels para probar desde el
   * celular). No afecta a producción.
   */
  allowedDevOrigins: ["*.devtunnels.ms"],
};

export default nextConfig;
