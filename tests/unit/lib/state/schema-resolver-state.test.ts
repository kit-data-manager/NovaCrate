/**
 * @jest-environment jsdom
 */

import { useSchemaResolverState } from "@/lib/state/schema-resolver-state"

function resetStore() {
    useSchemaResolverState.setState({ terms: {} })
}

describe("useSchemaResolverState", () => {
    beforeEach(() => {
        resetStore()
    })

    describe("initial state", () => {
        it("should have no tracked terms", () => {
            expect(useSchemaResolverState.getState().terms).toEqual({})
        })
    })

    describe("markLoading", () => {
        it("should mark a term as loading", () => {
            useSchemaResolverState.getState().markLoading("https://schema.org/Person")
            expect(useSchemaResolverState.getState().terms["https://schema.org/Person"]).toEqual({
                status: "loading"
            })
        })
    })

    describe("markResolved", () => {
        it("should store the term result", () => {
            useSchemaResolverState
                .getState()
                .markResolved("https://schema.org/Person", {
                    comment: "A person",
                    resolvedFrom: "schema"
                })
            expect(useSchemaResolverState.getState().terms["https://schema.org/Person"]).toEqual({
                status: "loaded",
                comment: "A person",
                resolvedFrom: "schema"
            })
        })
    })

    describe("markFailed", () => {
        it("should store the error", () => {
            const error = new Error("Failed to resolve")
            useSchemaResolverState.getState().markFailed("https://schema.org/Person", error)
            expect(useSchemaResolverState.getState().terms["https://schema.org/Person"]).toEqual({
                status: "error",
                error
            })
        })
    })

    describe("reset", () => {
        it("should remove a single term", () => {
            useSchemaResolverState.getState().markLoading("https://schema.org/Person")
            useSchemaResolverState.getState().reset("https://schema.org/Person")
            expect(useSchemaResolverState.getState().terms).toEqual({})
        })

        it("should keep other terms untouched", () => {
            useSchemaResolverState.getState().markLoading("https://schema.org/Person")
            useSchemaResolverState.getState().markLoading("https://schema.org/Organization")
            useSchemaResolverState.getState().reset("https://schema.org/Person")
            expect(useSchemaResolverState.getState().terms).toEqual({
                "https://schema.org/Organization": { status: "loading" }
            })
        })
    })

    describe("clear", () => {
        it("should remove all terms", () => {
            useSchemaResolverState.getState().markLoading("https://schema.org/Person")
            useSchemaResolverState.getState().markFailed("https://schema.org/Organization", "x")
            useSchemaResolverState.getState().clear()
            expect(useSchemaResolverState.getState().terms).toEqual({})
        })
    })

    it("should track terms independently", () => {
        useSchemaResolverState.getState().markLoading("https://schema.org/Person")
        useSchemaResolverState.getState().markResolved("https://schema.org/Organization", {
            comment: "An organization"
        })
        const terms = useSchemaResolverState.getState().terms
        expect(terms["https://schema.org/Person"]).toEqual({ status: "loading" })
        expect(terms["https://schema.org/Organization"]).toEqual({
            status: "loaded",
            comment: "An organization"
        })
    })
})
