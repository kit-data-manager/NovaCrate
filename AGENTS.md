# AGENTS.md - NovaCrate Editor

This file provides guidance for AI coding agents working in this repository.

## Project Overview

NovaCrate is a web-based interactive editor for creating, editing, and visualizing Research Object Crates (RO-Crate). Built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

**Migration in progress**: The editor is undergoing a major reengineering of its core logic. A new layered architecture (core layer + persistence layer) has been implemented in `lib/core/` and `lib/persistence/`, with React providers in `components/providers/persistence-provider.tsx` and `components/providers/core-provider.tsx`. However, the **UI still runs entirely on the legacy `CrateDataProvider`** in `components/providers/crate-data-provider.tsx`, which uses the old `CrateServiceAdapter` / `BrowserBasedCrateService` from `lib/backend/`. The next phase of work is migrating UI components from the legacy provider to the new hooks (`useCore()`, `usePersistence()`). See `lib-v2-transition-plan.md` for the full migration plan and remaining work packages.

## Build & Development Commands

```bash
# Development (runs Next.js + webworker in parallel)
npm run dev

# Production build
npm run build

# Linting
npm run lint
```

## Testing

### Unit Tests (Jest)

```bash
# Run all unit tests
npm run test:unit

# Run a single test file
npx jest tests/unit/lib/crate-context.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="should work for spec v1.2"

# Run with watch mode
npx jest --watch
```

Unit tests are located in `tests/unit/` and use the pattern `*.test.ts`.

### E2E Tests (Playwright)

```bash
# Run all e2e tests (requires build first)
npm run build && npm run test:e2e

# Run a single e2e test file
npx playwright test tests/e2e/create-crate.test.ts

# Run tests in a specific browser
npx playwright test --project=chrome

# Run with UI mode
npx playwright test --ui

# Full dev test suite (build + unit + e2e + serve)
npm run test:dev-all
```

E2E tests are located in `tests/e2e/` and require the app to be served at `http://localhost:3000`.

## Code Style Guidelines

### Formatting (Prettier)

The project uses Prettier with these settings:

- **Print width**: 100 characters
- **Semicolons**: None (no semicolons)
- **Trailing commas**: None
- **Tab width**: 4 spaces

### TypeScript

- **Strict mode** is enabled
- Use explicit types for function parameters and return values
- Prefer interfaces (`IEntity`, `IReference`) for data structures
- Use `type` for unions, intersections, and utility types
- Global types are defined in `lib/data-types.d.ts`

### Import Organization

Order imports as follows:

1. React imports (`import { useCallback, useEffect } from "react"`)
2. External libraries (`import useSWR from "swr"`)
3. Internal absolute imports using `@/` alias (`import { cn } from "@/lib/utils"`)
4. Relative imports (avoid when possible, prefer `@/` alias)

```typescript
// Example
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useStore } from "zustand"
import useSWR from "swr"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { cn, getEntityDisplayName } from "@/lib/utils"
```

### Naming Conventions

| Type              | Convention                          | Example                                 |
| ----------------- | ----------------------------------- | --------------------------------------- |
| Components        | PascalCase                          | `FileExplorer`, `EntityIcon`            |
| Hooks             | camelCase with `use` prefix         | `useEditorState`, `useGoToEntityEditor` |
| Utility functions | camelCase                           | `getEntityDisplayName`, `isReference`   |
| Constants         | SCREAMING_SNAKE_CASE                | `SCHEMA_ORG_TEXT`, `MAX_LIST_LENGTH`    |
| Interfaces        | PascalCase, `I` prefix for entities | `IEntity`, `IReference`, `EditorState`  |
| Types             | PascalCase                          | `EntityPropertyTypes`, `FileTreeNode`   |
| Files             | kebab-case                          | `editor-state.ts`, `file-explorer.tsx`  |
| Test files        | `*.test.ts`                         | `crate-context.test.ts`                 |

### React Components

- Use functional components with hooks
- Mark client components with `"use client"` directive at top of file
- Prefer `useCallback` and `useMemo` for performance optimization
- Use Zustand stores for global state (`useStore`, `useEditorState`)
- Use React Context for dependency injection (`CrateDataContext`)

```typescript
// Component pattern
export function MyComponent({ prop }: { prop: string }) {
    const state = useEditorState((store) => store.entities)
    const handler = useCallback(() => {
        // ...
    }, [dependencies])

    return <div>{/* ... */}</div>
}
```

### Error Handling

- Use the `Error` component from `@/components/error` to display errors in UI
- Use `handleSpringError` from `@/lib/spring-error-handling` to parse error objects
- Use Zod for runtime validation (`import * as z from "zod/mini"`)
- Log errors with `console.error` or `console.warn` for debugging

```typescript
// Error display pattern
<Error error={error} title="Failed to fetch files list" />

// Error handling pattern
try {
    // operation
} catch (e) {
    console.error("Operation failed", e)
    return null
}
```

### State Management

- Use Zustand with Immer middleware for complex state
- State stores are in `lib/state/` directory
- Use selectors to minimize re-renders: `useEditorState((store) => store.entities)`

### UI Components

- UI primitives are in `components/ui/` (shadcn/ui based)
- Use `cn()` utility for conditional class merging
- Icons from `lucide-react`
- Use Radix UI primitives for accessibility

## Project Structure

```
app/                    # Next.js app router pages
components/
  ui/                   # Reusable UI primitives (shadcn/ui)
  providers/            # React context providers
  editor/               # Editor-specific components
  entity/               # Entity-related components
  file-explorer/        # File explorer components
lib/
  core/                 # Core layer interfaces and implementations
    impl/               # Implementations (CoreServiceImpl, MetadataServiceImpl, etc.)
    persistence/        # Persistence layer interfaces (ICrateService, IFileService, etc.)
  persistence/
    browser/            # Browser-based persistence (OPFS-backed implementations)
  state/                # Zustand state stores
  validation/           # Validation logic
  backend/              # Legacy backend service (being replaced — see Architecture)
tests/
  unit/                 # Jest unit tests
  e2e/                  # Playwright e2e tests
  data/                 # Test fixtures
```

## Architecture

The editor is being migrated to a layered architecture. Understanding this is essential for making changes.

### Core Layer (`lib/core/`)

The core layer contains all RO-Crate domain logic. It is persistence-agnostic.

- **`ICoreService` / `CoreServiceImpl`** — Orchestrates metadata and context services. Provides high-level operations: `addFileEntity`, `addFolderEntity`, `changeEntityIdentifier`, `deleteEntity`. Coordinates file service operations with metadata updates.
- **`IMetadataService` / `MetadataServiceImpl`** — Entity CRUD. Stores the `@graph` as a `Map<string, IEntity>`. Manages `hasPart` on the root entity for data entities. Uses `getRootEntityID()` (not hardcoded `"./"`) to find the root entity via the metadata descriptor's `about` reference.
- **`IContextService` / `ContextServiceImpl`** — Manages the `@context`. Resolves/reverses short names to/from full URIs. Handles custom context pairs. Loads known RO-Crate context definitions (v1.1, v1.2) from bundled JSON files.
- **`IPersistenceAdapter` / `PersistenceAdapterImpl`** — Bridges persistence (`ICrateService`) and core services. Converts between raw JSON metadata strings and typed graph/context objects.
- **`Observable`** — Generic typed event emitter used throughout both layers. `emit()` spreads arguments to listeners: `listener(...args)`.
- **`CrateFactory`** — Factory for creating new crates. All RO-Crate metadata structure knowledge lives here (templates, validation), keeping the repository service metadata-agnostic. Methods: `createEmptyCrate`, `createCrateFromFile`, `createCrateFromMetadataFile`, `createCrateFromFiles`, `duplicateCrate`.
- **`lib/core/util.ts`** — Browser-level utilities: `getFileAsURL`, `downloadBlob`, `downloadCrateAs`.

### Persistence Layer (`lib/core/persistence/` interfaces, `lib/persistence/browser/` implementation)

The persistence layer handles storage. The only current implementation is browser-based (OPFS via Web Workers).

- **`IPersistenceService` / `BrowserPersistenceService`** — Top-level entry point. Manages crate ID selection, provides `ICrateService` and `IRepositoryService`. Has `createCrateServiceFor(crateId)` for creating a standalone crate service without changing the selected crate. Has `healthCheck()` which resolves if healthy, throws if the OPFS worker is unresponsive.
- **`ICrateService` / `BrowserCrateService`** — Read/write the `ro-crate-metadata.json` for a specific crate. Provides `IFileService`. Emits `metadata-changed` events.
- **`IFileService` / `BrowserFileService`** — File operations within a crate (add, read, update, move, delete). Emits granular events (`file-created`, `file-deleted`, `folder-created`, etc.) and `quota-changed`.
- **`IRepositoryService` / `BrowserRepositoryService`** — Manages the collection of crates. Metadata-agnostic: only stores/retrieves opaque crate directories. Methods: `getCratesList`, `createCrateFromZip` (returns crate ID), `createCrateFromMetadata` (writes a metadata string, returns crate ID), `deleteCrate`, `getCrateAs` (export as zip/eln/json).

### React Providers (`components/providers/`)

- **`PersistenceProvider`** (`persistence-provider.tsx`) — Creates and provides the `BrowserPersistenceService` singleton. Mount at `app/editor/layout.tsx`. Calls `useHealthCheck(persistence)` internally to monitor worker health. Hook: `usePersistence()`.
- **`CoreProvider`** (`core-provider.tsx`) — Creates `PersistenceAdapterImpl` + `CoreServiceImpl` when a crate is open. Mount at `app/editor/full/layout.tsx`. If the crate is deselected, navigates to `/editor`. Internally calls `useCoreSync(core)` to bridge core layer events into the Zustand `editorState`. Hook: `useCore()` (always non-null inside the provider).
- **`useCoreSync`** (`lib/use-core-sync.ts`) — Sync hook called inside `CoreProvider`. Subscribes to `graph-changed` and `context-changed` events from the core layer and pushes updates into `editorState`. On initial mount, hard-replaces entities and context. On subsequent `graph-changed` events, applies a three-way merge (`applyGraphDifferences` from `lib/ensure-sync.ts`) to preserve local edits while incorporating remote changes. Currently coexists with the legacy `CrateDataProvider`'s SWR sync — both populate `editorState` until the legacy provider is removed in WP6.

### Legacy Layer (`lib/backend/`) — Being Replaced

The `CrateDataProvider`, `CrateServiceAdapter`, and `BrowserBasedCrateService` in `lib/backend/` are the old monolithic architecture. They are being replaced by the core + persistence layers above. Do not add new functionality to the legacy layer. See `lib-v2-transition-plan.md` for the migration plan.

### Key Design Decisions

- **Root entity lookup**: Always use `getRootEntityID(entities)` from `lib/utils.ts`. Never hardcode `"./"`. The function finds the root by looking up the `ro-crate-metadata.json` entity's `about["@id"]` reference, supporting both standard (`./`) and non-standard root IDs.
- **Event-driven sync**: The core layer uses `Observable` events (`graph-changed`, `context-changed`, `metadata-changed`, etc.) for reactive updates between layers. Components should subscribe to events rather than polling.
- **Repository is metadata-agnostic**: `IRepositoryService` never parses or understands crate metadata. All metadata knowledge (templates, validation, structure) lives in `CrateFactory` and the core layer.
- **Separation of concerns**: `ICoreService` operates on an already-open crate. `CrateFactory` handles crate creation workflows (which happen before a crate is open).

## Testing Notes

### Jest Environment Caveats

- **`structuredClone` cross-realm issue**: Jest runs tests in a Node.js `vm` sandbox. `structuredClone()` returns objects from a different realm, causing `constructor` mismatches. The `dequal` library (used in `MetadataServiceImpl.updateGraph`) compares constructors, so `dequal(obj, structuredClone(obj))` returns `false` in Jest. **Workaround**: Use `JSON.parse(JSON.stringify(...))` instead of `structuredClone` in test mocks and fixtures when the data will be compared with `dequal`.
- **OPFS / Web Workers**: Not available in the Jest `node` environment. Browser persistence classes (`BrowserCrateService`, `BrowserFileService`, `BrowserRepositoryService`) accept a `FunctionWorker` via constructor injection — mock it in tests. `BrowserPersistenceService` creates its own worker internally — use `jest.mock` for `@/lib/function-worker`, `@/lib/opfs-worker/functions`, and `next/dist/client/add-base-path`.
- **JSZip in Node**: `JSZip.loadAsync()` does not accept `Blob` in Node.js. Convert to `ArrayBuffer` first: `JSZip.loadAsync(await blob.arrayBuffer())`. When generating zips for tests, use `{ type: "arraybuffer" }` and wrap in `new Blob([buffer])`.
- **jsdom for React hook tests**: The global test environment is `node`. For tests that need a DOM (e.g. React hooks using `renderHook` from `@testing-library/react`, or code that depends on Zustand's `ssrSafe` middleware), add the `@jest-environment jsdom` docblock at the top of the test file. All required packages (`jest-environment-jsdom`, `@testing-library/react`) are already installed. Polyfill `structuredClone` at the top of jsdom test files if the code under test uses it: `if (typeof structuredClone === "undefined") { (globalThis as any).structuredClone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) }`.

## Key Dependencies

- **Next.js 16** - App router, React Server Components
- **React 19** - UI framework
- **Zustand** - State management
- **Immer** - Immutable state updates
- **SWR** - Data fetching (legacy, being phased out)
- **Tailwind CSS 4** - Styling
- **Zod** (`zod/mini`) - Schema validation
- **JSZip** - Zip archive manipulation (used by `CrateFactory.duplicateCrate`)
- **js-file-download** - Browser file download trigger
- **happy-opfs** - OPFS filesystem abstraction (used by browser persistence)
- **react-arborist** - Tree view component
- **Monaco Editor** - Code editor
- **Playwright** - E2E testing
- **Jest** - Unit testing
