/**
 * @jest-environment jsdom
 */
import { useTourState } from "@/lib/state/tour-state"

if (typeof structuredClone === "undefined") {
    ;(globalThis as any).structuredClone = <T>(v: T): T => JSON.parse(JSON.stringify(v))
}

describe("tour-state", () => {
    beforeEach(() => {
        window.localStorage.clear()
        useTourState.setState({
            tourActive: false,
            tourOrigin: null,
            hasSeenTour: false
        })
    })

    test("starts inactive and unseen by default", () => {
        const state = useTourState.getState()
        expect(state.tourActive).toBe(false)
        expect(state.tourOrigin).toBeNull()
        expect(state.hasSeenTour).toBe(false)
    })

    test("startTour activates the tour with the given origin", () => {
        useTourState.getState().startTour("main-menu")
        const state = useTourState.getState()
        expect(state.tourActive).toBe(true)
        expect(state.tourOrigin).toBe("main-menu")
    })

    test("startTour can switch the origin while active", () => {
        useTourState.getState().startTour("main-menu")
        useTourState.getState().startTour("editor")
        const state = useTourState.getState()
        expect(state.tourActive).toBe(true)
        expect(state.tourOrigin).toBe("editor")
    })

    test("stopTour deactivates the tour without marking it as seen", () => {
        useTourState.getState().startTour("editor")
        useTourState.getState().stopTour()
        const state = useTourState.getState()
        expect(state.tourActive).toBe(false)
        expect(state.tourOrigin).toBeNull()
        expect(state.hasSeenTour).toBe(false)
    })

    test("finishTour deactivates the tour and marks it as seen", () => {
        useTourState.getState().startTour("main-menu")
        useTourState.getState().finishTour()
        const state = useTourState.getState()
        expect(state.tourActive).toBe(false)
        expect(state.tourOrigin).toBeNull()
        expect(state.hasSeenTour).toBe(true)
    })

    test("hasSeenTour is persisted to localStorage", () => {
        useTourState.getState().finishTour()
        expect(window.localStorage.getItem("tour-state")).toContain('"hasSeenTour":true')
    })
})
