/**
 * Helpers for talking to the native Rust backend of the NovaCrate desktop app
 * (`novacrate-desktop`, built with Tauri).
 *
 * This module is only reachable in desktop builds: the persistence provider
 * imports `@/lib/persistence/desktop/impl`, which is aliased to
 * {@link file://./impl.ts} when `NEXT_PUBLIC_PERSISTENCE_BACKEND=desktop` and
 * to `impl-browser-stub.ts` otherwise (see `next.config.mjs`). The Tauri
 * packages are therefore statically imported without any runtime cost.
 */
import { invoke } from "@tauri-apps/api/core"
import { open, save } from "@tauri-apps/plugin-dialog"

/** Invoke a native backend command. */
export async function invokeCommand<T>(
    command: string,
    args?: Record<string, unknown>
): Promise<T> {
    return await invoke<T>(command, args)
}

/**
 * Open a native file dialog for picking a local crate zip file.
 * Returns the absolute path of the selected file, or `null` if cancelled.
 */
export async function pickCrateZipPath(): Promise<string | null> {
    const selection = await open({
        multiple: false,
        directory: false,
        filters: [{ name: "RO-Crate", extensions: ["zip"] }]
    })
    return typeof selection === "string" ? selection : null
}

/**
 * Open a native save dialog for choosing where to store a crate zip file.
 * Returns the absolute path of the chosen destination, or `null` if cancelled.
 */
export async function pickCrateSavePath(defaultName: string): Promise<string | null> {
    return await save({
        defaultPath: defaultName,
        filters: [{ name: "RO-Crate", extensions: ["zip"] }]
    })
}
