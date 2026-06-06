import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "@neondatabase/serverless"],
};

export default nextConfig;
