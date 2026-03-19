# NovaCrate v2 Architecture Transition Plan

## Status Overview

The editor is migrating from a monolithic `CrateDataProvider` / `CrateServiceAdapter` architecture to a layered core + persistence architecture. The UI still runs entirely on the legacy layer.

| Work Package | Status   | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| WP1          | **Done** | Fill missing capabilities in persistence/core layers |
| WP2          | **Done** | Build the editor state sync bridge                   |
| WP3          | **Done** | Build the operation/UI state layer                   |
| WP4          | **Done** | Build crate ID management / localStorage persistence |
| WP5          | Pending  | Migrate consumers from CrateDataContext to new hooks |
| WP6          | Pending  | Remove legacy code                                   |
| WP7          | Pending  | Validation system adaptation (folded into WP5)       |

---

## WP1: Fill missing capabilities (DONE)

### What was done

**Interface changes (`IRepositoryService`):**

- `createCrateFromZip` now returns `Promise<string>` (the new crate ID) instead of `Promise<void>`
- Added `createCrateFromMetadata(metadata: string): Promise<string>` — creates a crate folder and writes the metadata string as `ro-crate-metadata.json`. Metadata-agnostic: no parsing or validation at the repository level.

**Implementation (`BrowserRepositoryService`):**

- `createCrateFromZip` returns the crate ID from the OPFS worker
- `createCrateFromMetadata` generates a UUID, writes metadata via worker, emits events

**New: `CrateFactory` (`lib/core/impl/CrateFactory.ts`):**
All RO-Crate metadata knowledge lives here. The repository stays metadata-agnostic.

- `createEmptyCrate(name, description)` — builds v1.2 template, writes via `repo.createCrateFromMetadata`
- `createCrateFromFile(file)` — auto-detects zip vs JSON by MIME type
- `createCrateFromMetadataFile(file)` — validates JSON structure (Zod), writes via `repo.createCrateFromMetadata`
- `createCrateFromFiles(name, desc, files, progress?)` — creates empty crate, opens via `persistence.createCrateServiceFor(id)`, uploads files, adds entities
- `duplicateCrate(crateId, newName?)` — exports as zip, modifies root entity name with JSZip, reimports

**New: Utilities (`lib/core/util.ts`):**

- `getFileAsURL(fileService, path)` — wraps `getFile` + `URL.createObjectURL`
- `downloadBlob(blob, fileName)` — triggers browser download via `js-file-download`
- `downloadCrateAs(repo, crateId, format, fileName)` — exports + downloads

**Bug fix: `MetadataServiceImpl` root entity lookup:**

- `addToHasPart` and `removeFromHasPart` now use `getRootEntityID()` instead of hardcoded `"./"`, supporting non-standard root entity IDs

---

## WP2: Build the editor state sync bridge (DONE)

### What was done

**New: `useCoreSync` hook (`lib/use-core-sync.ts`):**

Event-driven sync bridge that replaces the `CrateDataProvider`'s SWR-based polling. Called inside `CoreProvider`.

- On mount: reads initial entities from `IMetadataService.getEntities()` and raw context from `IContextService.getRaw()`, populates both `entities`/`initialEntities` and `crateContext`/`initialCrateContext` in the Zustand `editorState`.
- Subscribes to `IMetadataService.events["graph-changed"]`:
    - Always updates `initialEntities` (the remote baseline).
    - On first load (or when `lastGraph` is empty): hard-replaces `entities`.
    - On subsequent events: applies a three-way merge via `applyGraphDifferences` to preserve local edits the user has made while incorporating server-side changes.
- Subscribes to `IContextService.events["context-changed"]`:
    - Always overwrites both `crateContext` and `initialCrateContext` (no local context divergence supported).
- Cleanup removes all event listeners on unmount or when `core` changes.

**Interface changes (`IContextService`):**

- `"context-changed"` event signature changed from `() => void` to `(newContext: CrateContextType) => void` — the event now carries the raw `@context` value.
- Added `getRaw(): CrateContextType | undefined` — returns the raw `@context` value as last loaded from the crate metadata.

**Implementation changes (`ContextServiceImpl`):**

- Implemented `getRaw()` returning `structuredClone(this.raw)`.
- All three `emit("context-changed")` call sites now pass `this.raw!` as the argument.
- `addCustomContextPair` and `removeCustomContextPair` update `this.raw` before emitting.

**New: `applyGraphDifferences` (`lib/ensure-sync.ts`):**

- Added `applyGraphDifferences(newGraph: IEntity[], lastGraph: IEntity[], newEntities: Draft<Map<string, IEntity>>)` — works directly with `IEntity[]` arrays instead of `ICrate` objects.
- The existing `applyServerDifferences` (used by the legacy `CrateDataProvider`) is preserved for backward compatibility.

**Provider wiring (`components/providers/core-provider.tsx`):**

- `CoreProvider` now calls `useCoreSync(core)` to activate the sync bridge when the core service is available.

**Unit tests (`tests/unit/lib/use-core-sync.test.ts`):**

- 13 tests using `@jest-environment jsdom` and `renderHook` from `@testing-library/react`.
- Covers: initial population, three-way merge (5 scenarios), context forwarding, null core, cleanup on unmount, re-subscription on core change.

### Merge/conflict strategy (resolved)

The three-way merge from `applyServerDifferences` (now `applyGraphDifferences`) is retained. `initialEntities` always reflects the core layer state. `entities` is the user's working copy. When the core layer emits a `graph-changed` event, the diff between the previous and new remote graph is applied to the working copy, preserving locally-modified properties that the server did not change. If the server changed the same property, the server's value wins.

### Coexistence with legacy provider

The sync hook runs alongside the legacy `CrateDataProvider` — both populate `editorState`. This is intentional staging: once all consumers are migrated (WP5), the legacy provider is removed (WP6).

---

## WP3: Build the operation/UI state layer (DONE)

### What was done

**New: `operationState` Zustand store (`lib/state/operation-state.ts`):**

Dedicated store for operation-level UI state, replacing the `isSaving`, `saveError`, `clearSaveError`, and `healthTestError` fields from the legacy `CrateDataProvider`. Uses Immer + `enableMapSet` + `ssrSafe` middleware, matching `editorState` patterns.

- `isSaving: boolean` / `setIsSaving(value)` — simple boolean, same semantics as the legacy provider. Set by mutation consumers (WP5a) around core service calls.
- `saveErrors: Map<string, unknown>` / `addSaveError(entityId, error)` / `clearSaveError(id?)` — per-entity error map. `clearSaveError()` without an argument clears all errors; with an `id`, clears just that entity. Matches the legacy `saveError` / `clearSaveError` API exactly.
- `healthStatus: "healthy" | "unhealthy" | "unknown"` / `healthError: unknown` / `setHealthStatus(status, error?)` — ternary health state. `"unknown"` is the initial state before the first check runs; transitions to `"healthy"` or `"unhealthy"` once polling begins.
- Accessed via `useOperationState(selector)` hook.

**Interface changes (`IPersistenceService`):**

- Added `healthCheck(): Promise<void>` — resolves if the persistence layer is healthy, throws if not. Same contract as the legacy `CrateServiceAdapter.healthCheck()`.

**Implementation (`BrowserPersistenceService`):**

- `healthCheck()` delegates to `this.worker.healthTest()`. Throws `"OPFS worker not healthy"` if the worker is unresponsive.

**New: `useHealthCheck` hook (`lib/use-health-check.ts`):**

Polls `persistence.healthCheck()` every 10 seconds and updates `operationState`. Called inside `PersistenceProvider` so health monitoring runs even when no crate is open.

- Calls `healthCheck()` immediately on mount.
- On success: sets `healthStatus = "healthy"`, clears `healthError`.
- On failure: sets `healthStatus = "unhealthy"`, stores the error.
- Toast notifications (via `sonner`) fire only on state transitions — matching the legacy provider's behavior: `toast.error` on healthy/unknown → unhealthy, `toast.info` on unhealthy → healthy.

**Provider wiring (`components/providers/persistence-provider.tsx`):**

- `PersistenceProvider` now calls `useHealthCheck(persistence)` to start health polling.

**Unit tests:**

- `tests/unit/lib/state/operation-state.test.ts` — 14 tests (isSaving toggle, saveErrors CRUD, healthStatus transitions).
- `tests/unit/lib/use-health-check.test.ts` — 9 tests (immediate check, polling interval, toast transitions, unmount cleanup).

### Design decisions

- **`isSaving` is a simple boolean** (not a counter). The legacy provider used the same model. Consumers set it true at the start of a mutation and false when done.
- **The store does not wrap core service mutations.** The actual try/catch wrappers that manage `isSaving` and `saveErrors` will be built in WP5a when the mutation consumers are migrated — keeping WP3 as pure infrastructure.
- **Health check uses `IPersistenceService.healthCheck()`** rather than internal monitoring. The persistence service is the authority on its own health; the UI layer (via `useHealthCheck`) polls and updates the store.

---

## WP4: Build crate ID management / localStorage persistence (DONE)

### What was done

**New: `useCrateIdPersistence` hook (`lib/use-crate-id-persistence.ts`):**

Bridges `IPersistenceService` and `localStorage` for crate ID persistence across page reloads.

- On mount: if `persistence.canSetCrateId()` is `true`, reads `localStorage["crate-id"]` and calls `persistence.setCrateId(savedId)` to restore the last open crate.
- Subscribes to `persistence.events["crate-id-changed"]`: writes the new crate ID to `localStorage`, or removes it when the crate is closed (`null`).
- Respects `canSetCrateId()`: if `false`, skips the localStorage restore (the persistence implementation controls the crate ID).
- Uses the same localStorage key `"crate-id"` for backward compatibility with the legacy `CrateDataProvider` during the coexistence period.

**Provider mounting (`app/editor/layout.tsx` and `app/editor/full/layout.tsx`):**

Both new providers are now mounted in the app tree alongside the legacy layer:

- `PersistenceProvider` wraps the legacy `CrateDataProvider` in `app/editor/layout.tsx`. Available to both the landing page and the editor.
- `CoreProvider` wraps the editor content in `app/editor/full/layout.tsx`. Creates the core service when a crate is open, redirects to `/editor` when no crate is selected.
- `CrateIdPersistence` (render-null component) calls `useCrateIdPersistence(persistence)` inside the editor layout. Only runs for `/editor/full/*` routes — not on the landing page — so navigating to the main menu does not auto-open a crate.

**Unit tests (`tests/unit/lib/use-crate-id-persistence.test.ts`):**

- 7 tests covering: restore from localStorage, empty localStorage, canSetCrateId=false, persist on crate-id-changed, remove on null, successive changes, cleanup on unmount.

### Coexistence with legacy provider

Both crate ID systems run simultaneously:

1. **Legacy path** (unchanged): Landing page calls `setCrateId(id)` on `CrateDataContext` → writes to localStorage → triggers SWR fetch.
2. **New path** (WP4): `CrateIdPersistence` reads localStorage on mount → calls `persistence.setCrateId(id)` → `CoreProvider` creates the core service → `useCoreSync` populates `editorState`.

Both paths write to `editorState` via their respective sync mechanisms. The three-way merge in `useCoreSync` handles any ordering differences. Navigating to the landing page unmounts `CrateIdPersistence` and the legacy provider's `unsetCrateId()` clears localStorage.

---

## WP5: Migrate consumers from CrateDataContext to new hooks

**Goal**: Replace all `useContext(CrateDataContext)` usages (~30 unique consumer files). Subdivided by category and executed in the order below.

**Prerequisites**: WP2 (sync bridge), WP3 (operation state), and WP4 (crate ID management) provide all the infrastructure needed.

### Legacy-to-new API mapping

| Legacy (`CrateDataContext`)                     | New API                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `saveEntity(entity)`                            | `useCore().getMetadataService().updateEntity(entity)` or `.addEntity(entity)` + `operationState` |
| `deleteEntity(id)`                              | `useCore().deleteEntity(id)` + `operationState` for errors                                       |
| `changeEntityId(oldId, newId)`                  | `useCore().changeEntityIdentifier(oldId, newId)` + `operationState` for errors                   |
| `createFileEntity(file, entity)`                | `useCore().addFileEntity(file, entity)` + `operationState` for isSaving/errors                   |
| `createFolderEntity(entity, files?)`            | `useCore().addFolderEntity(entity)` + looped `addFileEntity` for files                           |
| `saveAllEntities(entities)`                     | Loop `updateEntity` / `addEntity` calls on `IMetadataService` (batch method TBD)                 |
| `isSaving`                                      | `useOperationState(s => s.isSaving)`                                                             |
| `saveError`                                     | `useOperationState(s => s.saveErrors)`                                                           |
| `clearSaveError(id?)`                           | `useOperationState(s => s.clearSaveError)` (same signature)                                      |
| `healthTestError`                               | `useOperationState(s => s.healthError)`                                                          |
| `error` (SWR fetch error)                       | `useOperationState(s => s.loadError)`                                                            |
| `crateDataIsLoading`                            | Dropped — entities are populated synchronously by `useCoreSync` on `CoreProvider` mount          |
| `crateData`                                     | `useEditorState(s => s.entities)` or read from persistence for raw metadata                      |
| `reload()`                                      | Dropped — event-driven sync makes manual reload redundant                                        |
| `serviceProvider.getCrateFilesList()`           | `usePersistence().getCrateService()?.getFileService()?.getContentList()`                         |
| `serviceProvider.downloadFile()`                | `getFile()` + `downloadBlob()` from `lib/core/util.ts`                                           |
| `serviceProvider.getCrateFileURL()`             | `getFileAsURL()` from `lib/core/util.ts`                                                         |
| `serviceProvider.getCrateFileInfo()`            | `usePersistence().getCrateService()?.getFileService()?.getInfo(path)`                            |
| `serviceProvider.renameFile()`                  | `usePersistence().getCrateService()?.getFileService()?.move(src, dest)`                          |
| `serviceProvider.getCrate()`                    | `usePersistence().getCrateService()?.getMetadata()` (raw JSON) or `editorState.entities`         |
| `serviceProvider.getCrateRaw()`                 | `usePersistence().getCrateService()?.getMetadata()`                                              |
| `serviceProvider.getCrateAs()`                  | `downloadCrateAs()` from `lib/core/util.ts`                                                      |
| `serviceProvider.downloadCrateZip()`            | `downloadCrateAs(repo, crateId, "zip", fileName)` from `lib/core/util.ts`                        |
| `serviceProvider.downloadCrateEln()`            | `downloadCrateAs(repo, crateId, "eln", fileName)` from `lib/core/util.ts`                        |
| `serviceProvider.downloadRoCrateMetadataJSON()` | `downloadCrateAs(repo, crateId, "standalone-json", fileName)`                                    |
| `serviceProvider.getStorageInfo()`              | Direct OPFS quota API or `IFileService` quota events                                             |
| `serviceProvider.createCrate()`                 | `new CrateFactory(persistence).createEmptyCrate(name, description)`                              |
| `serviceProvider.createCrateFromFile()`         | `new CrateFactory(persistence).createCrateFromFile(file)`                                        |
| `serviceProvider.createCrateFromFiles()`        | `new CrateFactory(persistence).createCrateFromFiles(name, desc, files, progress?)`               |
| `serviceProvider.createCrateFromCrateZip()`     | `persistence.getRepositoryService()?.createCrateFromZip(zip)`                                    |
| `serviceProvider.duplicateCrate()`              | `new CrateFactory(persistence).duplicateCrate(crateId, newName?)`                                |
| `serviceProvider.deleteCrate()`                 | `persistence.getRepositoryService()?.deleteCrate(crateId)`                                       |
| `serviceProvider.getStoredCrateIds()`           | `persistence.getRepositoryService()?.getCratesList()`                                            |
| `serviceProvider.healthCheck()`                 | `persistence.healthCheck()` (already handled by `useHealthCheck`)                                |
| `saveRoCrateMetadataJSON(json)`                 | `usePersistence().getCrateService()?.setMetadata(json)`                                          |
| `addCustomContextPair(p, u)`                    | `useCore().getContextService().addCustomContextPair(p, u)`                                       |
| `removeCustomContextPair(p)`                    | `useCore().getContextService().removeCustomContextPair(p)`                                       |
| `crateId`                                       | `usePersistence().getCrateId()`                                                                  |
| `setCrateId(id)` / `unsetCrateId()`             | `usePersistence().setCrateId(id)` / `usePersistence().setCrateId(null)`                          |

### Execution order

Phases are ordered from smallest/most self-contained to largest/most interleaved. Many files appear in multiple categories but are migrated once, covering all their legacy usages.

### Design decisions (resolved)

- **`crateData` reconstruction**: When a full `ICrate` object is needed (e.g. `generateCratePreview` in `default-actions.tsx`), read raw metadata from `persistence.getCrateService()?.getMetadata()` and parse it. This is more correct than reconstructing from `editorState` since it preserves the exact serialized form.
- **`reload()` action (Cmd+R)**: Dropped. The event-driven sync in the new architecture makes manual reload redundant. Can be re-added later if needed.
- **`error` field (SWR fetch error)**: Add `loadError: unknown` / `setLoadError(error?)` to `operationState`. Set by `useCoreSync` if metadata loading fails on mount. Components that displayed the legacy `error` read `useOperationState(s => s.loadError)`.

### Pre-requisite: Add `loadError` to `operationState`

Before migrating consumers, add `loadError` and `setLoadError` to the `operationState` Zustand store. This replaces the legacy SWR `error` field (a data-fetching error distinct from per-entity `saveErrors` and worker `healthError`).

**Files**: `lib/state/operation-state.ts`, `tests/unit/lib/state/operation-state.test.ts`

---

### Phase 1: WP5d — Context consumers (1 file) ✓

| File                                  | Legacy fields                                                           | New API                                            |
| ------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| `components/context/custom-pairs.tsx` | `addCustomContextPair`, `removeCustomContextPair`, `crateDataIsLoading` | `useCore().getContextService()`, drop loading flag |

Trivial swap — remove `useContext(CrateDataContext)`, add `useCore()`.

---

### Phase 2: WP5e — JSON editor (1 file) ✓

| File                                   | Legacy fields                                                                                  | New API                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `app/editor/full/json-editor/page.tsx` | `saveRoCrateMetadataJSON`, `serviceProvider.getCrateRaw()`, `crateData`, `isSaving`, `crateId` | `usePersistence().getCrateService()?.getMetadata()` / `.setMetadata()`, `useOperationState()`, subscribe to `metadata-changed` events |

The JSON editor fetches raw metadata via SWR and displays it in Monaco. Migration: read raw metadata from `ICrateService.getMetadata()`, write via `setMetadata()`. The SWR polling can be replaced by subscribing to `metadata-changed` events on `ICrateService`.

---

### Phase 3: WP5f — Crate ID consumers (2 primary files + cross-cutting) ✓

| File                                          | Legacy fields                                                                                                                       | New API                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `app/editor/page.tsx` (landing page)          | `setCrateId`, `unsetCrateId`, `serviceProvider.getStoredCrateIds()`, `serviceProvider.createCrateFromCrateZip()`, `healthTestError` | `usePersistence().setCrateId()`, `.getRepositoryService()`, `useOperationState(s => s.healthError)` |
| `app/editor/full/layout.tsx` (`RecentlyUsed`) | `crateId`                                                                                                                           | `usePersistence().getCrateId()`                                                                     |

The landing page doesn't have `CoreProvider` but does have `PersistenceProvider`. All service calls route through `usePersistence()`. `CrateFactory` must be instantiated manually with the persistence service for crate creation workflows.

11 other files use `crateId` as a guard or SWR key — these are migrated as part of their primary WP5 category (a/b/c) by replacing `crateId` with `usePersistence().getCrateId()` or dropping it entirely (since services are already scoped to the current crate).

---

### Phase 4: WP5a — Mutation consumers (11 files) ✓

**New: `useCrateMutations()` hook (`lib/use-crate-mutations.ts`):**

A custom hook that composes `useCore()` + `operationState` internally and returns pre-wrapped mutation methods. Drop-in replacement for the legacy `CrateDataContext` mutation API. Each method handles `isSaving`, `saveErrors`, and toast notifications internally, and returns `boolean` (`true` = success, `false` = failure) without ever throwing.

```ts
const {
    saveEntity,
    deleteEntity,
    changeEntityId,
    createFileEntity,
    createFolderEntity,
    saveAllEntities
} = useCrateMutations()
```

| Method                                         | `isSaving`             | Error tracking                  | Toast             | Notes                                                                   |
| ---------------------------------------------- | ---------------------- | ------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `saveEntity(entity)`                           | yes                    | `addSaveError`/`clearSaveError` | success + failure | Auto-detects create vs update via `editorState.initialEntities.has(id)` |
| `deleteEntity(entity, deleteData)`             | no                     | `addSaveError` on catch         | no                | Matches legacy behavior                                                 |
| `changeEntityId(entity, newId)`                | no                     | `addSaveError` on catch         | no                | Matches legacy behavior                                                 |
| `createFileEntity(entity, file, overwrite?)`   | yes                    | `addSaveError` on catch         | no                | Uses `core.addFileEntity()`                                             |
| `createFolderEntity(entity, files, progress?)` | yes                    | `addSaveError` on catch         | no                | Uses `core.addFolderEntity()` + looped `core.addFileEntity()`           |
| `saveAllEntities(entities)`                    | yes (once around loop) | per-entity errors               | no                | Auto-detects per entity                                                 |

`saveEntity` auto-detect logic: checks `editorState.initialEntities.has(entity["@id"])`. If the entity exists in the remote baseline, calls `updateEntity()`; otherwise calls `addEntity()`. This matches the legacy `lastCrateData.current` check.

Components that need custom behavior beyond the hook (e.g. `delete-entity-modal` with its own `isDeleting` state, or `create-entity-modal` with progress tracking) can still use `useCore()` directly alongside `useCrateMutations()`.

**One-line fix:** `CoreServiceImpl.addFileEntity` — add `overwrite?: boolean` parameter and pass through to `IMetadataService.addEntity`. Also update `ICoreService` interface.

**Migration pattern**: Replace `useContext(CrateDataContext)` with `useCrateMutations()` (and `usePersistence()` / `useCore()` where `serviceProvider` direct access is also needed).

| File                                                      | Legacy fields                                  | New API                                                                                               |
| --------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `components/providers/global-modals-provider.tsx`         | `saveEntity`                                   | `useCrateMutations().saveEntity`                                                                      |
| `components/entity/entity-context-menu.tsx`               | `saveEntity`                                   | `useCrateMutations().saveEntity`                                                                      |
| `components/actions/entity-actions.tsx`                   | `saveEntity`                                   | `useCrateMutations().saveEntity`                                                                      |
| `components/modals/save-entity-changes-modal.tsx`         | `saveEntity`                                   | `useCrateMutations().saveEntity`                                                                      |
| `components/modals/save-as-modal.tsx`                     | `saveEntity`                                   | `useCrateMutations().saveEntity`                                                                      |
| `components/modals/rename-entity-modal.tsx`               | `changeEntityId`                               | `useCrateMutations().changeEntityId`                                                                  |
| `components/modals/multi-rename-modal.tsx`                | `changeEntityId`, `serviceProvider`, `crateId` | `useCrateMutations().changeEntityId` + `usePersistence()` for file rename                             |
| `components/modals/delete-entity-modal.tsx`               | `deleteEntity`, `serviceProvider`, `crateId`   | `useCrateMutations().deleteEntity` + `usePersistence()` for fallback/impact                           |
| `components/modals/create-entity/create-entity-modal.tsx` | `createFileEntity`, `createFolderEntity`       | `useCrateMutations()`                                                                                 |
| `lib/hooks.ts` (`useSaveAllEntities`)                     | `saveAllEntities`                              | `useCrateMutations().saveAllEntities`                                                                 |
| `components/actions/default-actions.tsx`                  | `crateData`, `createFileEntity`, `reload`      | `useCrateMutations().createFileEntity`, read raw metadata from persistence for preview, drop `reload` |

**Additional changes made during Phase 4:**

- `ICoreService.addFolderEntity` also received the `overwrite?: boolean` parameter (same as `addFileEntity`), with the implementation in `CoreServiceImpl` passing it through.
- `IContextService.addCustomContextPair` and `removeCustomContextPair` return types corrected from `void` to `Promise<void>` (matching the async implementation).
- `default-actions.tsx`: The "Reload Entities" action (Cmd+R) was dropped — event-driven sync makes manual reload redundant. HTML preview generation now reads raw metadata from `persistence.getCrateService()?.getMetadata()` instead of `crateData.crateData`.
- `delete-entity-modal.tsx`: Fallback delete path (for entities not in editor state) now uses `core.deleteEntity()` directly. Impact file count uses `persistence.getCrateService()?.getFileService()?.getContentList()`.
- `multi-rename-modal.tsx`: File rename fallback uses `persistence.getCrateService()?.getFileService()?.move()`. The `crateId` guard was simplified to `persistence.getCrateId()`.
- `operationState`: `loadError` / `setLoadError` added as a pre-requisite (replaces legacy SWR `error` field).

---

### Phase 5: WP5b — Status/loading consumers (7 files) ✓

**Migration pattern**: Replace `useContext(CrateDataContext)` field reads with `useOperationState()` and `useEditorState()`.

| File                                         | Legacy fields                                                                                                             | New API                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `components/nav/nav-header.tsx`              | `isSaving`, `saveError`, `clearSaveError`, `healthTestError`, `error`, `crateDataIsLoading`, `serviceProvider`, `crateId` | `useOperationState()` for saving/errors/health/loadError, `usePersistence()` for exports, drop `crateDataIsLoading` |
| `components/editor/entity-editor.tsx`        | `isSaving`, `saveError`, `clearSaveError`                                                                                 | `useOperationState()`                                                                                               |
| `components/graph/entity-graph.tsx`          | `isSaving`, `saveError`, `clearSaveError`, `crateDataIsLoading`, `crateId`                                                | `useOperationState()`, drop loading flag                                                                            |
| `components/editor/entity-editor-tabs.tsx`   | `crateDataIsLoading`                                                                                                      | Drop — use entity existence check instead                                                                           |
| `components/crate-validation-supervisor.tsx` | `crateData`, `crateDataIsLoading`, `crateId`                                                                              | Subscribe to `editorState.entities` for change detection, drop loading flag                                         |
| `components/context/context.tsx`             | `crateDataIsLoading`, `crateId`                                                                                           | Drop loading flag, `usePersistence().getCrateId()`                                                                  |
| `components/context/custom-pairs.tsx`        | `crateDataIsLoading`                                                                                                      | Already migrated in Phase 1 (WP5d)                                                                                  |

**Additional changes made during Phase 5:**

- `nav-header.tsx`: Export callbacks now use `downloadCrateAs()` from `lib/core/util.ts` with `usePersistence().getRepositoryService()`. Removed "Reload Entities" menu item (action was dropped in Phase 4). `crateDataIsLoading` replaced with `!crateName` check. `saveError` renamed to `saveErrors`, `error` renamed to `loadError`, `healthTestError` reads from `useOperationState(s => s.healthError)`.
- `entity-graph.tsx`: `crateDataIsLoading || !crateId` visibility guards replaced with `entities.size === 0`.
- `entity-editor-tabs.tsx`: `crateDataIsLoading` guard for auto-close simplified to `entitiesSize > 0` (entities are populated synchronously by `useCoreSync`).
- `crate-validation-supervisor.tsx`: `crateData` dependency for re-validation replaced with `entities`. `crateDataIsLoading` guard dropped. `crateId` from `usePersistence().getCrateId()`.
- `context.tsx`: Loading skeleton keyed on `!contextReady` instead of `crateDataIsLoading || !crateId`. Invalid context warning simplified to `contextReady && !context.specification`.

---

### Phase 6: WP5c — serviceProvider direct-access consumers (~10 unique files remaining)

**Migration pattern**: Replace `serviceProvider.*` calls with new-architecture equivalents. Replace `crateId` parameters — new services are already scoped to the current crate.

| File                                                   | Legacy method(s)                                                  | New API                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `components/file-explorer/entry-context-menu.tsx`      | `serviceProvider.downloadFile()`, `crateId`                       | `getFile()` + `downloadBlob()` from `lib/core/util.ts`                       |
| `components/file-explorer/path-picker.tsx`             | `serviceProvider.getCrateFilesList()`, `crateId`                  | `persistence.getCrateService()?.getFileService()?.getContentList()`          |
| `components/file-explorer/explorer.tsx`                | `serviceProvider.getCrateFilesList()`, `crateId`                  | Same as path-picker                                                          |
| `components/file-explorer/preview.tsx`                 | `serviceProvider.downloadFile()`, `getCrateFileURL()`, `crateId`  | `getFileAsURL()` from `lib/core/util.ts`                                     |
| `components/landing/crate-entry.tsx`                   | `serviceProvider.getCrate()`, download/export, `duplicateCrate()` | `persistence.getRepositoryService()` + `CrateFactory` + `downloadCrateAs()`  |
| `components/landing/create-crate-modal.tsx`            | `serviceProvider.createCrate/FromFile/FromFiles()`                | `CrateFactory` methods                                                       |
| `components/landing/delete-crate-modal.tsx`            | `serviceProvider.deleteCrate()`                                   | `persistence.getRepositoryService()?.deleteCrate()`                          |
| `components/modals/settings/workers.tsx`               | `instanceof BrowserBasedCrateService`, `isWorkerHealthy()`        | `useOperationState(s => s.healthStatus)` — rethink the worker settings panel |
| `components/storage-info.tsx`                          | `serviceProvider.getStorageInfo()`                                | OPFS quota API or `IFileService` quota events                                |
| `components/editor/select-reference-modal.tsx`         | `crateData["@graph"]`, `crateDataIsLoading`                       | `useEditorState(s => s.entities)` — iterate `.values()`                      |
| `components/entity-browser/entity-browser-content.tsx` | `crate.crateData` (loading gate)                                  | Check `entities.size > 0`                                                    |

Files already migrated as part of earlier phases (WP5a/WP5b) that also use `serviceProvider`:

- `nav-header.tsx` — exports via `downloadCrateAs()` (covered in Phase 5)
- `delete-entity-modal.tsx` — file service for impact analysis (covered in Phase 4)
- `multi-rename-modal.tsx` — file service for rename (covered in Phase 4)

---

### Phase 7: WP7 — Validation system adaptation (4 files)

Folded into WP5 since it's small and tightly related. The validation system's coupling to the legacy provider is contained: only `serviceProvider.getCrateFileInfo()` and `crateData.crateId` are accessed.

| File                                               | Change                                                                                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/validation/validator.ts`                      | Change `ValidatorContext`: replace `serviceProvider?: CrateServiceAdapter` with `fileService?: IFileService`; remove `crateData: ICrateDataProvider` |
| `components/providers/validation-context.tsx`      | Replace `crateDataProvider.serviceProvider` with `persistence.getCrateService()?.getFileService()`; remove `crateData: crateDataProvider`            |
| `lib/validation/validators/rules/ro-crate-v1.1.ts` | Replace `ctx.serviceProvider.getCrateFileInfo(ctx.crateData.crateId, path)` with `ctx.fileService?.getInfo(path)`                                    |
| `lib/validation/validators/rules/ro-crate-v1.2.ts` | Same as v1.1                                                                                                                                         |

### Summary: file count by phase

| Phase     | Sub-package                | Unique files   | Notes                               |
| --------- | -------------------------- | -------------- | ----------------------------------- |
| Pre-req   | `operationState` loadError | 2              | Modify existing store + tests       |
| 1         | WP5d (context)             | 1              | Trivial                             |
| 2         | WP5e (JSON editor)         | 1              | Moderate — SWR → event subscription |
| 3         | WP5f (crateId)             | 2              | Landing page is the tricky one      |
| 4         | WP5a (mutations)           | 11             | Largest batch — establish patterns  |
| 5         | WP5b (status/loading)      | 6              | Many overlap with Phase 4           |
| 6         | WP5c (serviceProvider)     | ~10            | Many overlap with Phase 4/5         |
| 7         | WP7 (validation)           | 4              | Clean, contained                    |
| **Total** |                            | **~30 unique** | Heavy overlap reduces actual work   |

---

## WP6: Remove legacy code

**Tasks**:

1. Delete `CrateDataProvider`, `CrateDataContext`, `ICrateDataProvider` from `crate-data-provider.tsx`
2. Delete `CrateServiceAdapter.d.ts`, `CrateServiceBase.ts`, `BrowserBasedCrateService.ts` from `lib/backend/`
3. Remove the legacy `applyServerDifferences` function from `lib/ensure-sync.ts` (keep `applyGraphDifferences` which is used by `useCoreSync`)
4. Remove `serviceProvider` prop and the legacy `BrowserBasedCrateService` instantiation from `app/editor/layout.tsx`
5. Remove the `CrateDataProvider` wrapper from `app/editor/layout.tsx` (`PersistenceProvider` and `CoreProvider` are already mounted since WP4)
6. Remove the legacy health check polling from `CrateDataProvider` (now handled by `useHealthCheck` in `PersistenceProvider`)
7. Remove the legacy `useInterval`-based SWR sync (now handled by `useCoreSync` in `CoreProvider`)
8. Clean up remaining imports

---

## WP7: Validation system adaptation

**Note**: Folded into WP5 Phase 7 (see above). The validation system's coupling to the legacy provider is light — only `serviceProvider.getCrateFileInfo()` and `crateData.crateId` are used by two validator rule files. The migration replaces `ValidatorContext.serviceProvider` with `IFileService` and removes the `crateData` dependency entirely.

**Tasks** (executed as WP5 Phase 7):

1. Update `ValidatorContext` in `lib/validation/validator.ts`: replace `serviceProvider?: CrateServiceAdapter` with `fileService?: IFileService`, remove `crateData: ICrateDataProvider`.
2. Update `ValidationContextProvider` to pass `persistence.getCrateService()?.getFileService()` instead of `crateDataProvider.serviceProvider`.
3. Update validator rules (`ro-crate-v1.1.ts`, `ro-crate-v1.2.ts`) to use `ctx.fileService?.getInfo(path)` instead of `ctx.serviceProvider.getCrateFileInfo(ctx.crateData.crateId, path)`.
4. Run existing validation tests.

---

## Open concerns (post-migration)

### `canSetCrateId()` enforcement

`IPersistenceService.canSetCrateId()` exists so that persistence implementations can forbid external crate ID changes (e.g. a server-driven implementation where the backend controls which crate is open). Currently:

- `BrowserPersistenceService.canSetCrateId()` always returns `true` — no issue.
- `useCrateIdPersistence` respects `canSetCrateId()` — skips localStorage restore if `false`.
- `BrowserPersistenceService.setCrateId()` does **not** check `canSetCrateId()` internally — it always accepts the call.
- The landing page (`app/editor/page.tsx`) calls `persistence.setCrateId()` unconditionally when opening/closing crates.

If a future persistence implementation returns `canSetCrateId() === false`, callers need to be guarded. Options to resolve:

1. **Guard at the call site**: landing page and other callers check `canSetCrateId()` before calling `setCrateId()`. Show a UI message if the crate cannot be changed.
2. **Guard in the implementation**: `setCrateId()` becomes a no-op (or throws) when `canSetCrateId()` is `false`. This is safer but may silently swallow calls.
3. **Both**: implementation throws/no-ops, callers also check to provide good UX.

This is not blocking since the only implementation always allows setting. Revisit when a second persistence implementation is introduced.

### Toast notifications for all crate mutations

Currently only `saveEntity` shows toast notifications (success + failure). The legacy provider did not show toasts for `deleteEntity`, `changeEntityId`, `createFileEntity`, or `createFolderEntity`. Consider adding consistent toast feedback for all mutation types in `useCrateMutations()` — e.g. "Entity deleted", "Entity renamed", "File uploaded". This would improve UX consistency but should be designed holistically (what message, what icon, success-only vs success+failure) rather than added piecemeal.
