/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer"

const basePath = process.env.BASE_PATH ?? undefined
const iframeTargetOrigins = process.env.IFRAME_TARGET_ORIGINS ?? undefined
const nextConfig = {
    basePath: basePath,
    output: process.env.OUTPUT ?? undefined,
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_IFRAME_TARGET_ORIGINS: iframeTargetOrigins
    },
    images: { unoptimized: true }
}

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === "true"
})

export default withBundleAnalyzer(nextConfig)
