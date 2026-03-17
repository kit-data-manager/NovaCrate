import { BrowserPersistenceService } from "@/lib/persistence/browser/BrowserPersistenceService"

// Mock the opfs-worker functions module to avoid pulling in happy-opfs (ESM / OPFS)
jest.mock("@/lib/opfs-worker/functions", () => ({
    opfsFunctions: {}
}))

// Mock FunctionWorker so the constructor doesn't try to spawn a real Web Worker
jest.mock("@/lib/function-worker", () => ({
    FunctionWorker: jest.fn().mockImplementation(() => ({
        mount: jest.fn(),
        execute: jest.fn(),
        executeTransfer: jest.fn()
    }))
}))

// Mock the Next.js addBasePath helper
jest.mock("next/dist/client/add-base-path", () => ({
    addBasePath: jest.fn((path: string) => path)
}))

describe("BrowserPersistenceService", () => {
    let service: BrowserPersistenceService

    beforeEach(() => {
        service = new BrowserPersistenceService()
    })

    describe("initial state", () => {
        it("should have no crate selected initially", () => {
            expect(service.getCrateId()).toBeNull()
        })

        it("should have no crate service initially", () => {
            expect(service.getCrateService()).toBeNull()
        })

        it("should always allow setting crate ID", () => {
            expect(service.canSetCrateId()).toBe(true)
        })

        it("should provide a repository service", () => {
            expect(service.getRepositoryService()).not.toBeNull()
        })
    })

    describe("setCrateId", () => {
        it("should update the crate ID", () => {
            service.setCrateId("test-crate-1")
            expect(service.getCrateId()).toBe("test-crate-1")
        })

        it("should create a crate service when setting a non-null ID", () => {
            service.setCrateId("test-crate-1")
            expect(service.getCrateService()).not.toBeNull()
        })

        it("should clear the crate service when setting null", () => {
            service.setCrateId("test-crate-1")
            expect(service.getCrateService()).not.toBeNull()

            service.setCrateId(null)
            expect(service.getCrateService()).toBeNull()
            expect(service.getCrateId()).toBeNull()
        })

        it("should emit crate-id-changed event", () => {
            const listener = jest.fn()
            service.events.addEventListener("crate-id-changed", listener)

            service.setCrateId("test-crate-1")
            expect(listener).toHaveBeenCalledWith("test-crate-1")
        })

        it("should emit crate-service-changed event with the new service", () => {
            const listener = jest.fn()
            service.events.addEventListener("crate-service-changed", listener)

            service.setCrateId("test-crate-1")
            expect(listener).toHaveBeenCalledTimes(1)
            expect(listener.mock.calls[0][0]).not.toBeNull()
        })

        it("should emit crate-service-changed with null when clearing", () => {
            service.setCrateId("test-crate-1")

            const listener = jest.fn()
            service.events.addEventListener("crate-service-changed", listener)

            service.setCrateId(null)
            expect(listener).toHaveBeenCalledWith(null)
        })

        it("should not emit events when setting the same crate ID", () => {
            service.setCrateId("test-crate-1")

            const idListener = jest.fn()
            const serviceListener = jest.fn()
            service.events.addEventListener("crate-id-changed", idListener)
            service.events.addEventListener("crate-service-changed", serviceListener)

            service.setCrateId("test-crate-1")
            expect(idListener).not.toHaveBeenCalled()
            expect(serviceListener).not.toHaveBeenCalled()
        })

        it("should create a new crate service when switching crates", () => {
            service.setCrateId("crate-A")
            const serviceA = service.getCrateService()

            service.setCrateId("crate-B")
            const serviceB = service.getCrateService()

            expect(serviceB).not.toBeNull()
            expect(serviceB).not.toBe(serviceA)
        })

        it("should emit both events in order: crate-id-changed then crate-service-changed", () => {
            const order: string[] = []
            service.events.addEventListener("crate-id-changed", () =>
                order.push("crate-id-changed")
            )
            service.events.addEventListener("crate-service-changed", () =>
                order.push("crate-service-changed")
            )

            service.setCrateId("test-crate-1")
            expect(order).toEqual(["crate-id-changed", "crate-service-changed"])
        })
    })

    describe("invariant: getCrateId() == null implies getCrateService() == null", () => {
        it("should hold when no crate is set", () => {
            expect(service.getCrateId()).toBeNull()
            expect(service.getCrateService()).toBeNull()
        })

        it("should hold after clearing a crate", () => {
            service.setCrateId("some-crate")
            service.setCrateId(null)
            expect(service.getCrateId()).toBeNull()
            expect(service.getCrateService()).toBeNull()
        })

        it("should hold in the other direction: non-null ID means non-null service", () => {
            service.setCrateId("some-crate")
            expect(service.getCrateId()).not.toBeNull()
            expect(service.getCrateService()).not.toBeNull()
        })
    })
})
