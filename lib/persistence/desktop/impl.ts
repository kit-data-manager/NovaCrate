/**
 * The real desktop persistence implementation.
 *
 * Selected at build time: the persistence provider imports
 * `@/lib/persistence/desktop/impl`, which `next.config.mjs` aliases to this
 * file when `NEXT_PUBLIC_PERSISTENCE_BACKEND=desktop`, and to
 * `impl-browser-stub.ts` otherwise.
 */
export { DesktopPersistenceService } from "./DesktopPersistenceService"
