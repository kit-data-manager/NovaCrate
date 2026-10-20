/**
 * @jest-environment jsdom
 */
import { profileTrustSettings } from "@/lib/state/profile-trust-settings"

describe("profileTrustSettings", () => {
    beforeEach(() => {
        profileTrustSettings.setState({ trusted: [], blocked: [] })
    })

    it("initially has no decisions", () => {
        expect(profileTrustSettings.getState().trusted).toEqual([])
        expect(profileTrustSettings.getState().blocked).toEqual([])
    })

    it("setTrusted adds the URL and removes it from blocked", () => {
        profileTrustSettings.getState().setBlocked("https://example.com/profile")
        profileTrustSettings.getState().setTrusted("https://example.com/profile")

        expect(profileTrustSettings.getState().trusted).toEqual(["https://example.com/profile"])
        expect(profileTrustSettings.getState().blocked).toEqual([])
    })

    it("setBlocked adds the URL and removes it from trusted", () => {
        profileTrustSettings.getState().setTrusted("https://example.com/profile")
        profileTrustSettings.getState().setBlocked("https://example.com/profile")

        expect(profileTrustSettings.getState().trusted).toEqual([])
        expect(profileTrustSettings.getState().blocked).toEqual(["https://example.com/profile"])
    })

    it("does not duplicate URLs in a list", () => {
        profileTrustSettings.getState().setTrusted("https://example.com/profile")
        profileTrustSettings.getState().setTrusted("https://example.com/profile")

        expect(profileTrustSettings.getState().trusted).toEqual(["https://example.com/profile"])
    })

    it("remove deletes the URL from both lists", () => {
        profileTrustSettings.getState().setTrusted("https://example.com/a")
        profileTrustSettings.getState().setBlocked("https://example.com/b")
        profileTrustSettings.getState().remove("https://example.com/a")

        expect(profileTrustSettings.getState().trusted).toEqual([])
        expect(profileTrustSettings.getState().blocked).toEqual(["https://example.com/b"])
    })
})
