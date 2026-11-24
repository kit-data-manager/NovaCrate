/**
 * @jest-environment jsdom
 */

/**
 * Tests for {@link SchemaSettingsPage} draft handling.
 *
 * Unsaved edits in `RegisteredSchemaDisplay` are kept in page-level state keyed
 * by schema.id. They must survive collapsing a list entry, switching between
 * cards/list views, and filtering, and must be cleared on Save / Revert.
 *
 * The schema resolver store is mocked to avoid persisting to localStorage and
 * to keep zustand's real `persist` middleware out of the test.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import type { ISchemaWorkerContext } from "@/components/providers/schema-worker-provider"
import { SchemaSettingsPage } from "@/components/modals/settings/schemas"
import { schemaResolverStore } from "@/lib/state/schema-resolver"
import type { RegisteredSchema } from "@/lib/state/schema-resolver"
import { RO_CRATE_VERSION } from "@/lib/constants"

jest.mock("@/lib/state/schema-resolver", () => {
    type MockSchema = {
        id: string
        displayName: string
        matchesUrls: string[]
        schemaUrl: string
        activeOnSpec: string[]
    }

    let registeredSchemas: MockSchema[] = []
    const listeners = new Set<() => void>()
    const emit = () => {
        listeners.forEach((listener) => listener())
    }

    const addSchema = () => {}
    const updateSchema = (id: string, schema: MockSchema) => {
        registeredSchemas = registeredSchemas.map((entry) => (entry.id === id ? schema : entry))
        emit()
    }
    const deleteSchema = (id: string) => {
        registeredSchemas = registeredSchemas.filter((entry) => entry.id !== id)
        emit()
    }

    return {
        schemaResolverStore: {
            initialState: { registeredSchemas },
            getState: () => ({
                registeredSchemas,
                addSchema,
                updateSchema,
                deleteSchema
            }),
            getInitialState: () => ({
                registeredSchemas: [],
                addSchema,
                updateSchema,
                deleteSchema
            }),
            setState: (partial: unknown) => {
                const patch = partial as { registeredSchemas?: MockSchema[] }
                if (patch.registeredSchemas) registeredSchemas = patch.registeredSchemas
                emit()
            },
            subscribe: (listener: () => void) => {
                listeners.add(listener)
                return () => {
                    listeners.delete(listener)
                }
            }
        }
    }
})

const testSchema = (): RegisteredSchema => ({
    id: "test-schema",
    displayName: "Test Schema",
    matchesUrls: ["https://example.org/"],
    schemaUrl: "https://example.org/schema.jsonld",
    activeOnSpec: [RO_CRATE_VERSION.V1_3_0]
})

const ORIGINAL_URL = "https://example.org/schema.jsonld"
const EDITED_URL = "https://new.example.org/schema.jsonld"

const workerExecute = jest.fn()
const schemaWorkerContext: ISchemaWorkerContext = {
    isReady: true,
    isUsingWebWorker: false,
    worker: {
        executeUncached: workerExecute
    } as unknown as ISchemaWorkerContext["worker"]
}

function renderPage() {
    return render(
        <SchemaWorker.Provider value={schemaWorkerContext}>
            <SchemaSettingsPage />
        </SchemaWorker.Provider>
    )
}

// The mocked worker resolves asynchronously; wait for its side effects to be
// applied inside act() so React does not warn about updates outside of it.
async function flushWorker(call: string) {
    await waitFor(() => {
        expect(workerExecute.mock.calls.some((callArgs) => callArgs[0] === call)).toBe(true)
    })
    // Drain the mock's promise continuations inside act() so their state
    // updates are not reported as updates outside of act().
    await act(async () => {
        for (let i = 0; i < 20; i++) {
            await Promise.resolve()
        }
    })
}

async function switchToListView() {
    fireEvent.click(screen.getByRole("button", { name: "List view" }))
    await flushWorker("getWorkerStatus")
}

async function expandEntry(initialValue = ORIGINAL_URL) {
    fireEvent.click(screen.getByRole("button", { name: /Test Schema/ }))
    await screen.findByDisplayValue(initialValue)
    await flushWorker("getWorkerStatus")
}

beforeEach(() => {
    workerExecute.mockImplementation(async () => ({
        schemaStatus: {
            loadedSchemas: new Map(),
            schemaIssues: new Map()
        }
    }))
    schemaResolverStore.setState({ registeredSchemas: [testSchema()] })
})

describe("SchemaSettingsPage drafts", () => {
    it("keeps edits when collapsing and re-expanding a list entry", async () => {
        renderPage()

        await switchToListView()
        await expandEntry()

        const urlInput = screen.getByDisplayValue(ORIGINAL_URL)
        fireEvent.change(urlInput, { target: { value: EDITED_URL } })

        // Collapse then re-expand: the edit must still be there.
        fireEvent.click(screen.getByRole("button", { name: /Test Schema/ }))
        expect(screen.queryByDisplayValue(EDITED_URL)).toBeNull()
        fireEvent.click(screen.getByRole("button", { name: /Test Schema/ }))
        expect(screen.getByDisplayValue(EDITED_URL)).toBeTruthy()
        await flushWorker("getWorkerStatus")
    })

    it("keeps edits when switching between cards and list views", async () => {
        renderPage()

        const urlInput = await screen.findByDisplayValue(ORIGINAL_URL)
        fireEvent.change(urlInput, { target: { value: EDITED_URL } })

        await switchToListView()
        await expandEntry(EDITED_URL)
        expect(screen.getByDisplayValue(EDITED_URL)).toBeTruthy()
    })

    it("keeps edits when the schema is filtered out and back", async () => {
        renderPage()

        const urlInput = await screen.findByDisplayValue(ORIGINAL_URL)
        fireEvent.change(urlInput, { target: { value: EDITED_URL } })

        fireEvent.change(screen.getByPlaceholderText("Search by name or URL..."), {
            target: { value: "no-match" }
        })
        expect(screen.queryByDisplayValue(EDITED_URL)).toBeNull()

        fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
        expect(screen.getByDisplayValue(EDITED_URL)).toBeTruthy()
    })

    it("persists trimmed edits on Save and clears the draft", async () => {
        renderPage()

        await switchToListView()
        await expandEntry()

        const urlInput = screen.getByDisplayValue(ORIGINAL_URL)
        fireEvent.change(urlInput, { target: { value: `  ${EDITED_URL}  ` } })

        fireEvent.click(await screen.findByRole("button", { name: "Save" }))
        await flushWorker("forceSchemaLoad")

        await waitFor(() => {
            expect(schemaResolverStore.getState().registeredSchemas[0].schemaUrl).toBe(EDITED_URL)
        })

        // The draft was cleared: re-opening the entry shows the saved (trimmed) value.
        fireEvent.click(screen.getByRole("button", { name: /Test Schema/ }))
        fireEvent.click(screen.getByRole("button", { name: /Test Schema/ }))
        expect(screen.getByDisplayValue(EDITED_URL)).toBeTruthy()
        expect(screen.queryByDisplayValue(`  ${EDITED_URL}  `)).toBeNull()
        await flushWorker("getWorkerStatus")
    })

    it("discards edits on Revert", async () => {
        renderPage()

        await switchToListView()
        await expandEntry()

        const urlInput = screen.getByDisplayValue(ORIGINAL_URL)
        fireEvent.change(urlInput, { target: { value: EDITED_URL } })

        fireEvent.click(await screen.findByRole("button", { name: "Revert" }))
        expect(screen.getByDisplayValue(ORIGINAL_URL)).toBeTruthy()

        // No unsaved changes are left behind after collapse and re-expand.
        fireEvent.click(screen.getByRole("button", { name: /Test Schema/ }))
        fireEvent.click(screen.getByRole("button", { name: /Test Schema/ }))
        expect(screen.getByDisplayValue(ORIGINAL_URL)).toBeTruthy()
        expect(screen.queryByDisplayValue(EDITED_URL)).toBeNull()
        await flushWorker("getWorkerStatus")
    })
})
