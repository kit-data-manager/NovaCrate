/**
 * @jest-environment jsdom
 */

/**
 * Tests for the {@link useProfileApprovalToasts} hook.
 */

if (typeof structuredClone === "undefined") {
    ;(globalThis as any).structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
}

import { renderHook, act, cleanup as rtlCleanup } from "@testing-library/react"
import { Observable } from "@/lib/core/impl/Observable"
import { IProfileService, IProfileServiceEvents } from "@/lib/core/profiles/IProfileService"
import { profileTrustSettings } from "@/lib/state/profile-trust-settings"
import { useProfileApprovalToasts } from "@/lib/hooks/use-profile-approval-toasts"

jest.mock("sonner", () => ({
    toast: { custom: jest.fn(), dismiss: jest.fn() }
}))

function createMockProfileService() {
    const events = new Observable<IProfileServiceEvents>()
    const service = {
        events,
        getProfileURIs: jest.fn(() => ["https://example.com/profile"]),
        getPendingApprovalURIs: jest.fn(() => []),
        setProfileURIs: jest.fn().mockResolvedValue(undefined)
    }
    return service as unknown as IProfileService & {
        getProfileURIs: jest.Mock
        getPendingApprovalURIs: jest.Mock
        setProfileURIs: jest.Mock
    }
}

afterEach(() => {
    rtlCleanup()
    jest.clearAllMocks()
    profileTrustSettings.setState({ trusted: [], blocked: [] })
})

describe("useProfileApprovalToasts", () => {
    it("shows a toast for profiles that are already pending approval", () => {
        const service = createMockProfileService()
        service.getPendingApprovalURIs.mockReturnValue(["https://example.com/profile"])

        renderHook(() => useProfileApprovalToasts(service))

        expect(jest.requireMock("sonner").toast.custom).toHaveBeenCalledTimes(1)
    })

    it("does not show a toast for profiles that are explicitly blocked", () => {
        profileTrustSettings.getState().setBlocked("https://example.com/profile")
        const service = createMockProfileService()
        service.getPendingApprovalURIs.mockReturnValue(["https://example.com/profile"])

        renderHook(() => useProfileApprovalToasts(service))

        expect(jest.requireMock("sonner").toast.custom).not.toHaveBeenCalled()
    })

    it("re-triggers profile loading when the trust settings change", async () => {
        const service = createMockProfileService()

        renderHook(() => useProfileApprovalToasts(service))
        expect(service.setProfileURIs).not.toHaveBeenCalled()

        act(() => {
            profileTrustSettings.getState().setTrusted("https://example.com/profile")
        })

        expect(service.setProfileURIs).toHaveBeenCalledWith(["https://example.com/profile"])
    })

    it("stops reacting to trust settings changes after unmount", () => {
        const service = createMockProfileService()

        const { unmount } = renderHook(() => useProfileApprovalToasts(service))
        unmount()

        act(() => {
            profileTrustSettings.getState().setBlocked("https://example.com/profile")
        })

        expect(service.setProfileURIs).not.toHaveBeenCalled()
    })
})
