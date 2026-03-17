# NovaCrate v2 Architecture Transition Plan

## Status Overview

The editor is migrating from a monolithic `CrateDataProvider` / `CrateServiceAdapter` architecture to a layered core + persistence architecture. The UI still runs entirely on the legacy layer.

| Work Package | Status   | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| WP1          | **Done** | Fill missing capabilities in persistence/core layers |
| WP2          | Pending  | Build the editor state sync bridge                   |
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

## WP2: Build the editor state sync bridge

**Goal**: Replace the `CrateDataProvider`'s SWR-based sync with event-driven sync from the core layer into the Zustand `editorState`.

**Tasks**:

1. Create a sync hook or component (e.g. `useCoreSync` or `<CoreStateSynchronizer />`) inside the `CoreProvider`.
2. Subscribe to `IMetadataService.events["graph-changed"]` → update `editorState.setEntities` and `editorState.setInitialEntities`.
3. Subscribe to `IContextService.events["context-changed"]` → update `editorState.updateCrateContext` and `editorState.updateInitialCrateContext`.
4. Handle initial population on mount.
5. Determine merge/conflict strategy: since mutations go through the core layer, "remote" and "local" are always in sync. `initialEntities` reflects the core layer state, `entities` is the user's working copy. The old `applyServerDifferences` 3-way merge may no longer be needed.
6. Write unit tests.

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
3. Delete `lib/ensure-sync.ts`
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
