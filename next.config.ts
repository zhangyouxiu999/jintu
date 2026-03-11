import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    // 忽略构建时的 TypeScript 错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 也忽略 ESLint 错误（如果需要）
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
