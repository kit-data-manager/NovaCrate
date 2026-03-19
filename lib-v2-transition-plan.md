# NovaCrate v2 Architecture Transition Plan

## Status Overview

The editor is migrating from a monolithic `CrateDataProvider` / `CrateServiceAdapter` architecture to a layered core + persistence architecture. The UI still runs entirely on the legacy layer.

| Work Package | Status   | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| WP1          | **Done** | Fill missing capabilities in persistence/core layers |
| WP2          | **Done** | Build the editor state sync bridge                   |
| WP3          | Pending  | Build the operation/UI state layer                   |
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

## WP3: Build the operation/UI state layer

**Goal**: Replace `isSaving`, `saveError`, `clearSaveError`, `healthTestError` from `CrateDataProvider`.

**Tasks**:

1. Create a Zustand store or React state tracking: `isSaving`, `saveErrors: Map<string, unknown>`, `clearSaveError`.
2. Wrap core service mutation calls in helpers that manage this state.
3. Decide on health checking (add `healthCheck()` to `IPersistenceService`, or drop it for OPFS).
4. Expose via context/hook for UI components.

---

## WP4: Build crate ID management / localStorage persistence

**Goal**: Replace `CrateDataProvider`'s localStorage-based crate ID persistence.

**Tasks**:

1. Move crate ID localStorage persistence into `PersistenceProvider`.
2. On mount, restore from localStorage → `setCrateId`.
3. Route main menu's `setCrateId`/`unsetCrateId` to `persistence.setCrateId()`.

---

## WP5: Migrate consumers from CrateDataContext to new hooks

**Goal**: Replace all `useContext(CrateDataContext)` usages. Subdivided by category:

### WP5a: Mutation consumers (saveEntity, deleteEntity, changeEntityId, createFileEntity, etc.)

~10 components including: `global-modals-provider`, `entity-context-menu`, `entity-actions`, `save-entity-changes-modal`, `save-as-modal`, `delete-entity-modal`, `rename-entity-modal`, `multi-rename-modal`, `create-entity-modal`, `default-actions`, `hooks.ts`

**Open items to discuss during WP5a:**

- `CoreServiceImpl.addFileEntity` does not pass an `overwrite` parameter through to `IMetadataService.addEntity`. The underlying method supports it — this is a one-line fix.
- Adding a folder with files + progress to an already-open crate (`createFolderEntity` multi-file variant) has no single convenience method. It is composable from `addFolderEntity` + looped `addFileEntity`, but the progress callback and error aggregation must be built by the caller. Consider adding a convenience method to `ICoreService`.
- `saveAllEntities` has no single-call batch equivalent. It can be composed by looping `updateEntity`/`addEntity`, but each call triggers a separate metadata write. Consider a batch method on `IMetadataService` if performance is an issue.

### WP5b: Status/loading consumers (crateDataIsLoading, isSaving, saveError, etc.)

~7 components including: `nav-header`, `entity-editor`, `entity-graph`, `entity-editor-tabs`, `entity-browser-content`, `context`, `crate-validation-supervisor`

### WP5c: serviceProvider direct-access consumers

~14 components accessing file operations, crate CRUD, exports, storage info, health checks.

### WP5d: Context consumers (addCustomContextPair, removeCustomContextPair)

`custom-pairs.tsx` → `useCore().getContextService()`

### WP5e: JSON editor (saveRoCrateMetadataJSON, getCrateRaw)

`json-editor/page.tsx` → `usePersistence().getCrateService().getMetadata()` / `.setMetadata()`

### WP5f: Crate ID consumers (crateId, setCrateId, unsetCrateId)

`app/editor/page.tsx`, `app/editor/full/layout.tsx`, and various components using `crateId` for gating.

---

## WP6: Remove legacy code

**Tasks**:

1. Delete `CrateDataProvider`, `CrateDataContext`, `ICrateDataProvider` from `crate-data-provider.tsx`
2. Delete `CrateServiceAdapter.d.ts`, `CrateServiceBase.ts`, `BrowserBasedCrateService.ts` from `lib/backend/`
3. Remove the legacy `applyServerDifferences` function from `lib/ensure-sync.ts` (keep `applyGraphDifferences` which is used by `useCoreSync`)
4. Remove `serviceProvider` prop from `app/editor/layout.tsx`
5. Wire `PersistenceProvider` into `app/editor/layout.tsx` and `CoreProvider` into `app/editor/full/layout.tsx`
6. Clean up remaining imports

---

## WP7: Validation system adaptation

**Tasks**:

1. Update `ValidatorContext` in `lib/validation/validator.ts` to use `ICoreService` + `IPersistenceService` instead of `ICrateDataProvider`.
2. Update `ValidationContextProvider` to pass the new services.
3. Update validators that access `ctx.crateData.*`.
4. Run existing validation tests.
