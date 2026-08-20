import { ProfileService } from "@/lib/core/profiles/impl/ProfileService"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { Observable } from "@/lib/core/impl/Observable"

function mockMetadataService(entities: IEntity[] = []): IMetadataService {
    return {
        events: new Observable(),
        getEntities: () => entities,
        addEntity: jest.fn(),
        updateEntity: jest.fn(),
        changeEntityIdentifier: jest.fn(),
        deleteEntity: jest.fn(),
        dispose: jest.fn()
    } as unknown as IMetadataService
}

afterEach(() => {
    jest.restoreAllMocks()
})

describe("ProfileService trust policy", () => {
    it("defers profiles whose URI is not allowed by the trust policy", async () => {
        const fetchSpy = jest
            .spyOn(globalThis, "fetch")
            .mockImplementation(() => Promise.reject(new Error("fetch must not be called")))

        const service = new ProfileService(mockMetadataService(), {
            determineProfileUriTrust: () => "blocked"
        })
        const emitted: string[][] = []
        const remove = service.events.addEventListener("profile-approval-required", (uris) =>
            emitted.push([...uris])
        )

        await service.setProfileURIs(["https://example.com/profile"])

        expect(service.getProfileURIs()).toEqual(["https://example.com/profile"])
        expect(service.getProfileHandlers()).toHaveLength(0)
        expect(service.getPendingApprovalURIs()).toEqual(["https://example.com/profile"])
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(emitted).toEqual([["https://example.com/profile"]])
        remove()
    })

    it("re-attempts a deferred profile once the trust policy allows it", async () => {
        const fetchSpy = jest
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(null, { status: 404 }))
        let allow = false
        const service = new ProfileService(mockMetadataService(), {
            determineProfileUriTrust: () => (allow ? "allowed" : "blocked")
        })

        await service.setProfileURIs(["https://example.com/profile"])
        expect(service.getPendingApprovalURIs()).toEqual(["https://example.com/profile"])
        expect(fetchSpy).not.toHaveBeenCalled()

        allow = true
        await service.setProfileURIs(service.getProfileURIs())

        expect(service.getPendingApprovalURIs()).toEqual([])
        expect(fetchSpy).toHaveBeenCalled()
    })

    it("does not re-emit approval-required when the pending set is unchanged", async () => {
        const service = new ProfileService(mockMetadataService(), {
            determineProfileUriTrust: () => "blocked"
        })
        const emitted: string[][] = []
        const remove = service.events.addEventListener("profile-approval-required", (uris) =>
            emitted.push([...uris])
        )

        await service.setProfileURIs(["https://example.com/profile"])
        await service.setProfileURIs(["https://example.com/profile"])

        expect(emitted).toEqual([["https://example.com/profile"]])
        remove()
    })
})
