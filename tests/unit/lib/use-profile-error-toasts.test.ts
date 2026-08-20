/**
 * @jest-environment jsdom
 */

if (typeof structuredClone === "undefined") {
    ;(globalThis as any).structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
}

import { renderHook, act, cleanup as rtlCleanup } from "@testing-library/react"
import { Observable } from "@/lib/core/impl/Observable"
import { IProfileService, IProfileServiceEvents } from "@/lib/core/profiles/IProfileService"
import { ProfileHandlerError } from "@/lib/core/profiles/impl/ProfileHandlerError"
import { useProfileErrorToasts } from "@/lib/hooks/use-profile-error-toasts"

jest.mock("sonner", () => ({
    toast: { error: jest.fn(), custom: jest.fn(), dismiss: jest.fn() }
}))

function createMockProfileService() {
    const events = new Observable<IProfileServiceEvents>()
    const constructionErrors: ProfileHandlerError[] = []
    const service = {
        events,
        getProfileConstructionErrors: jest.fn(() => [...constructionErrors])
    }
    return {
        events,
        constructionErrors,
        service: service as unknown as IProfileService
    }
}

function loadError(uri: string, message: string) {
    return new ProfileHandlerError(message, { profileUri: uri })
}

afterEach(() => {
    rtlCleanup()
    jest.clearAllMocks()
})

describe("useProfileErrorToasts", () => {
    it("toasts construction errors that already exist when the hook mounts", () => {
        const { constructionErrors, service } = createMockProfileService()
        constructionErrors.push(loadError("https://example.com/broken", "Could not load"))

        renderHook(() => useProfileErrorToasts(service))

        expect(jest.requireMock("sonner").toast.error).toHaveBeenCalledTimes(1)
        expect(jest.requireMock("sonner").toast.error).toHaveBeenCalledWith(
            "Failed to load profile: https://example.com/broken",
            expect.objectContaining({ description: "Could not load" })
        )
    })

    it("toasts new construction errors when error-emitted fires", () => {
        const { constructionErrors, events, service } = createMockProfileService()

        renderHook(() => useProfileErrorToasts(service))
        constructionErrors.push(loadError("https://example.com/broken", "Could not load"))

        act(() => {
            events.emit("error-emitted")
        })

        expect(jest.requireMock("sonner").toast.error).toHaveBeenCalledTimes(1)
    })

    it("does not toast the same failing profile twice", () => {
        const { constructionErrors, events, service } = createMockProfileService()
        constructionErrors.push(loadError("https://example.com/broken", "Could not load"))

        renderHook(() => useProfileErrorToasts(service))
        act(() => {
            events.emit("error-emitted")
        })

        expect(jest.requireMock("sonner").toast.error).toHaveBeenCalledTimes(1)
    })

    it("stops listening after unmount", () => {
        const { constructionErrors, events, service } = createMockProfileService()

        const { unmount } = renderHook(() => useProfileErrorToasts(service))
        unmount()

        constructionErrors.push(loadError("https://example.com/broken", "Could not load"))
        act(() => {
            events.emit("error-emitted")
        })

        expect(jest.requireMock("sonner").toast.error).not.toHaveBeenCalled()
    })
})
