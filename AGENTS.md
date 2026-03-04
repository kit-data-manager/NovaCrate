# AGENTS.md - NovaCrate Editor

This file provides guidance for AI coding agents working in this repository.

## Project Overview

NovaCrate is a web-based interactive editor for creating, editing, and visualizing Research Object Crates (RO-Crate). Built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

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
  state/                # Zustand state stores
  validation/           # Validation logic
  backend/              # Backend service interfaces
tests/
  unit/                 # Jest unit tests
  e2e/                  # Playwright e2e tests
  data/                 # Test fixtures
```

## Key Dependencies

- **Next.js 16** - App router, React Server Components
- **React 19** - UI framework
- **Zustand** - State management
- **Immer** - Immutable state updates
- **SWR** - Data fetching
- **Tailwind CSS 4** - Styling
- **Zod** - Schema validation
- **react-arborist** - Tree view component
- **Monaco Editor** - Code editor
- **Playwright** - E2E testing
- **Jest** - Unit testing
