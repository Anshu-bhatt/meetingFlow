import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const backendOrigin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: rootDir,
  turbopack: {
    root: rootDir,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig