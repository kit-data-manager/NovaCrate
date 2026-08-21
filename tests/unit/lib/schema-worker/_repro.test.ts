/**
 * @jest-environment jsdom
 */

import { SchemaGraph } from "@/lib/schema-worker/SchemaGraph"
import { SchemaResolver } from "@/lib/schema-worker/SchemaResolver"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { DEFAULT_KNOWN_SCHEMAS, SchemaResolverSettingsData } from "@/lib/state/schema-resolver-settings"

const SPEC = RO_CRATE_VERSION.V1_1_3

const settings: SchemaResolverSettingsData = {
    preloadKnownSchemas: true,
    allowUnknownSchemas: false,
    knownSchemas: DEFAULT_KNOWN_SCHEMAS
}

const originalFetch = global.fetch

afterEach(() => {
    global.fetch = originalFetch
})

it("counts fetches during preload + term resolution when schema.org fails", async () => {
    const calls: string[] = []
    global.fetch = jest.fn(async (input: unknown) => {
        const url = new URL(String(input), "http://localhost").searchParams.get("url") ?? ""
        calls.push(url)
        return {
            json: async () => ({ error: "simulated failure", attempts: [] }),
            status: 502
        } as Response
    })

    const resolver = new SchemaResolver(settings)
    resolver.updateRegisteredSchemas(settings, SPEC)
    const graph = new SchemaGraph(resolver)

    await graph.loadAllSchemas()
    console.log("after preload:", [...calls])

    await graph.getNode("https://schema.org/CreativeWork")
    await graph.getNode("https://schema.org/Person")
    await graph.getNode("http://www.opengis.net/ont/geosparql#Feature")
    await graph.getNode("http://www.w3.org/ns/dx/prof/Profile")
    await graph.getNode("https://schema.org/Dataset")
    await graph.getNode("https://schema.org/author")

    console.log("total:", [...calls])
    console.log("count:", calls.length)
    expect(calls.length).toBeGreaterThan(0)
})
