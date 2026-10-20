import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

export type ProfileTrustSettings = {
    trusted: string[]
    blocked: string[]
    setTrusted(url: string): void
    setBlocked(url: string): void
    remove(url: string): void
}

export const profileTrustSettings = create<ProfileTrustSettings>()(
    ssrSafe(
        persist(
            (set) => ({
                trusted: [],
                blocked: [],
                setTrusted(url) {
                    set((s) => ({
                        trusted: s.trusted.includes(url) ? s.trusted : [...s.trusted, url],
                        blocked: s.blocked.filter((u) => u !== url)
                    }))
                },
                setBlocked(url) {
                    set((s) => ({
                        blocked: s.blocked.includes(url) ? s.blocked : [...s.blocked, url],
                        trusted: s.trusted.filter((u) => u !== url)
                    }))
                },
                remove(url) {
                    set((s) => ({
                        trusted: s.trusted.filter((u) => u !== url),
                        blocked: s.blocked.filter((u) => u !== url)
                    }))
                }
            }),
            {
                name: "profile-trust-settings"
            }
        )
    )
)
