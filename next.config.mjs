/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer"

const basePath = process.env.BASE_PATH ?? undefined
const iframeTargetOrigin = process.env.IFRAME_TARGET_ORIGIN ?? undefined
const aiAssistantEnabled = process.env.AI_ASSISTANT_ENABLED ?? undefined
const nextConfig = {
    basePath: basePath,
    output: process.env.OUTPUT ?? undefined,
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_IFRAME_TARGET_ORIGIN: iframeTargetOrigin,
        NEXT_PUBLIC_AI_ASSISTANT_ENABLED: aiAssistantEnabled
    },
    images: { unoptimized: true },
    pageExtensions:
        process.env.ENABLE_TESTS === "yes" ? ["tsx", "test.tsx", "ts", "test.ts"] : ["tsx", "ts"]
}

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === "true"
})

export default withBundleAnalyzer(nextConfig)
