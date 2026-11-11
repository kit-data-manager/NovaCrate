/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer"

/**
 * Persistence backend selection. `"browser"` (default) bundles the OPFS-based
 * backend, `"desktop"` bundles the Tauri-based backend. The persistence
 * provider imports `@/lib/persistence/desktop/impl`, which is aliased below so
 * that the unused implementation is completely excluded from the bundle.
 */
const persistenceBackend =
    process.env.PERSISTENCE_BACKEND ?? process.env.NEXT_PUBLIC_PERSISTENCE_BACKEND ?? "browser"
const desktopImplFile =
    persistenceBackend === "desktop"
        ? "./lib/persistence/desktop/impl.ts"
        : "./lib/persistence/desktop/impl-browser-stub.ts"

const DESKTOP_IMPL_SPECIFIER = "@/lib/persistence/desktop/impl"

const basePath = process.env.BASE_PATH ?? undefined
const iframeTargetOrigin = process.env.IFRAME_TARGET_ORIGIN ?? undefined
const aiAssistantEnabled = process.env.AI_ASSISTANT_ENABLED ?? undefined
const nextConfig = {
    basePath: basePath,
    output: persistenceBackend === "desktop" ? "export" : "standalone",
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_IFRAME_TARGET_ORIGIN: iframeTargetOrigin,
        NEXT_PUBLIC_AI_ASSISTANT_ENABLED: aiAssistantEnabled,
        NEXT_PUBLIC_PERSISTENCE_BACKEND: persistenceBackend
    },
    images: { unoptimized: true },
    pageExtensions:
        process.env.ENABLE_TESTS === "yes" ? ["tsx", "test.tsx", "ts", "test.ts"] : ["tsx", "ts"],
    // Exact-match alias ($ suffix) placed before the tsconfig path aliases so
    // that "@/lib/persistence/desktop/impl" resolves to the backend-specific
    // implementation instead of through "@/...".
    webpack: (config) => {
        config.resolve.alias = Array.isArray(config.resolve.alias)
            ? [
                  { name: `${DESKTOP_IMPL_SPECIFIER}$`, alias: desktopImplFile },
                  ...config.resolve.alias
              ]
            : {
                  [`${DESKTOP_IMPL_SPECIFIER}$`]: desktopImplFile,
                  ...config.resolve.alias
              }
        return config
    },
    turbopack: {
        resolveAlias: {
            [DESKTOP_IMPL_SPECIFIER]: desktopImplFile
        }
    }
}

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === "true"
})

export default withBundleAnalyzer(nextConfig)
