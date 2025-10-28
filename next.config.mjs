/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer"

const basePath = process.env.BASE_PATH ?? undefined
const nextConfig = {
    basePath: basePath,
    output: process.env.OUTPUT ?? "export",
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath
    }
}

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === "true"
})

export default withBundleAnalyzer(nextConfig)
