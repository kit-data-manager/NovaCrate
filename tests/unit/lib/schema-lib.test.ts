/**
 * @jest-environment jsdom
 */

import { resolveTerm, TermResolutionWorker } from "@/lib/schema-lib"
import { useSchemaResolverState } from "@/lib/state/schema-resolver-state"

const TERM = "https://schema.org/Person"

function mockWorker(result?: unknown, error?: unknown): TermResolutionWorker {
    return {
        executeUncached: jest.fn(async () => {
            if (error) throw error
            return result
        })
    } as unknown as TermResolutionWorker
}

beforeEach(() => {
    useSchemaResolverState.setState({ terms: {} })
})

describe("resolveTerm", () => {
    it("marks the term as loading and then resolved", async () => {
        const worker = mockWorker("A person")

        const promise = resolveTerm(TERM, worker)
        expect(useSchemaResolverState.getState().terms[TERM]?.status).toBe("loading")

        await promise

        expect(useSchemaResolverState.getState().terms[TERM]).toEqual({
            status: "loaded",
            comment: "A person"
        })
        expect(worker.executeUncached).toHaveBeenCalledWith("getPropertyComment", TERM)
    })

    it("supports localized comment objects", async () => {
        const comment = { "@language": "en", "@value": "A person" }
        const worker = mockWorker(comment)

        await resolveTerm(TERM, worker)

        expect(useSchemaResolverState.getState().terms[TERM]?.comment).toEqual(comment)
    })

    it("marks the term as failed when the worker throws", async () => {
        const error = new Error("Fetch failed")
        const worker = mockWorker(undefined, error)

        await resolveTerm(TERM, worker)

        expect(useSchemaResolverState.getState().terms[TERM]).toEqual({
            status: "error",
            error
        })
    })

    it("is a no-op for terms that are already resolved", async () => {
        const worker = mockWorker("A person")
        useSchemaResolverState.getState().markResolved(TERM, { comment: "cached" })

        await resolveTerm(TERM, worker)

        expect(worker.executeUncached).not.toHaveBeenCalled()
        expect(useSchemaResolverState.getState().terms[TERM]?.comment).toBe("cached")
    })

    it("deduplicates concurrent resolutions of the same term", async () => {
        const worker = mockWorker("A person")

        const first = resolveTerm(TERM, worker)
        const second = resolveTerm(TERM, worker)
        expect(worker.executeUncached).toHaveBeenCalledTimes(1)

        await Promise.all([first, second])
        expect(useSchemaResolverState.getState().terms[TERM]?.status).toBe("loaded")
    })

    it("does not start another resolution while one is loading", async () => {
        const worker = mockWorker("A person")
        useSchemaResolverState.getState().markLoading(TERM)

        await resolveTerm(TERM, worker)

        expect(worker.executeUncached).not.toHaveBeenCalled()
    })
})
