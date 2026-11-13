import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:5000",
    "localhost:3000",
    "localhost",
    "192.168.1.102:5000",
    "192.168.1.102:3000",
    "192.168.1.102",
  ],
};

export default nextConfig;
