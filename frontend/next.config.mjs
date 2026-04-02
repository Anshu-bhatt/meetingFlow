import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(rootDir, "..")

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: workspaceRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
