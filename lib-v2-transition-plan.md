# NovaCrate v2 Architecture Transition Plan

## Status Overview

The editor is migrating from a monolithic `CrateDataProvider` / `CrateServiceAdapter` architecture to a layered core + persistence architecture. The UI still runs entirely on the legacy layer.

| Work Package | Status   | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| WP1          | **Done** | Fill missing capabilities in persistence/core layers |
| WP2          | **Done** | Build the editor state sync bridge                   |
| WP3          | **Done** | Build the operation/UI state layer                   |
| WP4          | Pending  | Build crate ID management / localStorage persistence |
| WP5          | Pending  | Migrate consumers from CrateDataContext to new hooks |
| WP6          | Pending  | Remove legacy code                                   |
| WP7          | Pending  | Validation system adaptation                         |

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

## WP4: Build crate ID management / localStorage persistence

**Goal**: Replace `CrateDataProvider`'s localStorage-based crate ID persistence.

**Tasks**:

1. Move crate ID localStorage persistence into `PersistenceProvider`.
2. On mount, restore from localStorage → `setCrateId`.
3. Route main menu's `setCrateId`/`unsetCrateId` to `persistence.setCrateId()`.

---

## WP5: Migrate consumers from CrateDataContext to new hooks

**Goal**: Replace all `useContext(CrateDataContext)` usages. Subdivided by category.

**Prerequisites**: WP2 (sync bridge), WP3 (operation state), and WP4 (crate ID management) provide all the infrastructure needed. The mapping from legacy to new APIs is:

| Legacy (`CrateDataContext`)          | New API                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `saveEntity(entity)`                 | `useCore().getMetadataService().updateEntity(id, entity)` + `operationState` for isSaving/errors |
| `deleteEntity(id)`                   | `useCore().deleteEntity(id)` + `operationState` for errors                                       |
| `changeEntityId(oldId, newId)`       | `useCore().changeEntityIdentifier(oldId, newId)` + `operationState` for errors                   |
| `createFileEntity(file, entity)`     | `useCore().addFileEntity(file, entity)` + `operationState` for isSaving/errors                   |
| `createFolderEntity(entity, files?)` | `useCore().addFolderEntity(entity)` + looped `addFileEntity` for files                           |
| `saveAllEntities(entities)`          | Loop `updateEntity` / `addEntity` calls on `IMetadataService` (batch method TBD)                 |
| `isSaving`                           | `useOperationState(s => s.isSaving)`                                                             |
| `saveError`                          | `useOperationState(s => s.saveErrors)`                                                           |
| `clearSaveError(id?)`                | `useOperationState(s => s.clearSaveError)` (same signature)                                      |
| `healthTestError`                    | `useOperationState(s => s.healthError)`                                                          |
| `crateDataIsLoading`                 | Replaced by `useCoreSync` initial population — entities are available once `CoreProvider` mounts |
| `serviceProvider.getFiles()`         | `usePersistence().getCrateService()?.getFileService()`                                           |
| `serviceProvider.getCrateAs()`       | `downloadCrateAs()` from `lib/core/util.ts`                                                      |
| `serviceProvider.getStorageInfo()`   | Direct OPFS quota API or `IFileService` events                                                   |
| `addCustomContextPair(p, u)`         | `useCore().getContextService().addCustomContextPair(p, u)`                                       |
| `removeCustomContextPair(p)`         | `useCore().getContextService().removeCustomContextPair(p)`                                       |
| `getCrateRaw()`                      | `usePersistence().getCrateService()?.getMetadata()`                                              |
| `saveRoCrateMetadataJSON(json)`      | `usePersistence().getCrateService()?.setMetadata(json)`                                          |
| `crateId`                            | `usePersistence().getCrateId()` (after WP4 wires localStorage)                                   |
| `setCrateId(id)` / `unsetCrateId()`  | `usePersistence().setCrateId(id)` / `usePersistence().setCrateId(null)`                          |

### WP5a: Mutation consumers (saveEntity, deleteEntity, changeEntityId, createFileEntity, etc.)

~10 components including: `global-modals-provider`, `entity-context-menu`, `entity-actions`, `save-entity-changes-modal`, `save-as-modal`, `delete-entity-modal`, `rename-entity-modal`, `multi-rename-modal`, `create-entity-modal`, `default-actions`, `hooks.ts`

**Migration pattern** for each mutation consumer:

1. Replace `useContext(CrateDataContext)` with `useCore()` + `useOperationState()`.
2. Wrap core service calls in try/catch that manages `setIsSaving(true/false)` and `addSaveError(id, e)` / `clearSaveError(id)`.
3. On success, clear the entity's save error (if any).

**Open items to discuss during WP5a:**

- `CoreServiceImpl.addFileEntity` does not pass an `overwrite` parameter through to `IMetadataService.addEntity`. The underlying method supports it — this is a one-line fix.
- Adding a folder with files + progress to an already-open crate (`createFolderEntity` multi-file variant) has no single convenience method. It is composable from `addFolderEntity` + looped `addFileEntity`, but the progress callback and error aggregation must be built by the caller. Consider adding a convenience method to `ICoreService`.
- `saveAllEntities` has no single-call batch equivalent. It can be composed by looping `updateEntity`/`addEntity`, but each call triggers a separate metadata write. Consider a batch method on `IMetadataService` if performance is an issue.

### WP5b: Status/loading consumers (crateDataIsLoading, isSaving, saveError, etc.)

~7 components including: `nav-header`, `entity-editor`, `entity-graph`, `entity-editor-tabs`, `entity-browser-content`, `context`, `crate-validation-supervisor`

**Migration pattern**: Replace `useContext(CrateDataContext).isSaving` with `useOperationState(s => s.isSaving)`, `saveError` with `saveErrors`, `clearSaveError` with `clearSaveError` (same signature), `healthTestError` with `healthError`. The `crateDataIsLoading` flag is no longer needed — entities are populated synchronously by `useCoreSync` on `CoreProvider` mount.

### WP5c: serviceProvider direct-access consumers

~14 components accessing file operations, crate CRUD, exports, storage info, health checks.

**Migration pattern**: Replace `useContext(CrateDataContext).serviceProvider` with `usePersistence()` and `useCore()`. File operations go through `usePersistence().getCrateService()?.getFileService()`. Crate CRUD and exports use `CrateFactory` and `downloadCrateAs()` from `lib/core/util.ts`.

### WP5d: Context consumers (addCustomContextPair, removeCustomContextPair)

`custom-pairs.tsx` → `useCore().getContextService()`

### WP5e: JSON editor (saveRoCrateMetadataJSON, getCrateRaw)

`json-editor/page.tsx` → `usePersistence().getCrateService()?.getMetadata()` / `.setMetadata()`

### WP5f: Crate ID consumers (crateId, setCrateId, unsetCrateId)

`app/editor/page.tsx`, `app/editor/full/layout.tsx`, and various components using `crateId` for gating. After WP4, these use `usePersistence().getCrateId()` / `.setCrateId()`.

---

## WP6: Remove legacy code

**Tasks**:

1. Delete `CrateDataProvider`, `CrateDataContext`, `ICrateDataProvider` from `crate-data-provider.tsx`
2. Delete `CrateServiceAdapter.d.ts`, `CrateServiceBase.ts`, `BrowserBasedCrateService.ts` from `lib/backend/`
3. Remove the legacy `applyServerDifferences` function from `lib/ensure-sync.ts` (keep `applyGraphDifferences` which is used by `useCoreSync`)
4. Remove `serviceProvider` prop from `app/editor/layout.tsx`
5. Wire `PersistenceProvider` into `app/editor/layout.tsx` and `CoreProvider` into `app/editor/full/layout.tsx`
6. Remove the legacy health check polling from `CrateDataProvider` (now handled by `useHealthCheck` in `PersistenceProvider`)
7. Remove the legacy `useInterval`-based SWR sync (now handled by `useCoreSync` in `CoreProvider`)
8. Clean up remaining imports

---

## WP7: Validation system adaptation

**Tasks**:

1. Update `ValidatorContext` in `lib/validation/validator.ts` to use `ICoreService` + `IPersistenceService` instead of `ICrateDataProvider`.
2. Update `ValidationContextProvider` to pass the new services.
3. Update validators that access `ctx.crateData.*`.
4. Run existing validation tests.
