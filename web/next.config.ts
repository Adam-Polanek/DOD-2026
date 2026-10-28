import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import path from "node:path";

// Frontend je čistě klientský. Při `next build` se z něj stanou statické
// soubory ve složce out/, které servíruje Express (server/server.js).
// Při `next dev` běží Next na vlastním portu a dotazy na /api posílá
// na Express (výchozí http://localhost:3000).
export default function config(phase: string): NextConfig {
  // web/ je samostatný projekt uvnitř repa se serverem (každý má svůj package-lock.json).
  const base: NextConfig = { turbopack: { root: path.join(__dirname) } };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    const api = process.env.API_URL || "http://localhost:3000";
    return {
      ...base,
      async rewrites() {
        return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
      },
    };
  }
  return { ...base, output: "export" };
}
