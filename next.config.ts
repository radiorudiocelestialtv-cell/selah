import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/acceso", permanent: false }];
  },
};

export default nextConfig;