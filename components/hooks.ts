import { useCallback, useEffect, useState } from "react"
import { crateDetailsKey } from "@/components/landing/util"

const MAX_LIST_LENGTH = 100

export function useRecentCrates() {
    const [recentCrates, setRecentCrates] = useState<string[] | undefined>(undefined)

    useEffect(() => {
        const content = window.localStorage.getItem("recent-crates")
        if (content) {
            try {
                const recentlyUsed = JSON.parse(content)
                setRecentCrates(recentlyUsed)
            } catch (e) {
                console.warn("Failed to read recently used crated", e)
            }
        } else {
            window.localStorage.setItem("recent-crates", JSON.stringify([]))
            setRecentCrates([])
        }
    }, [])

    const addRecentCrate = useCallback((crateId: string) => {
        const content = window.localStorage.getItem("recent-crates")
        if (content) {
            try {
                let recentlyUsed = JSON.parse(content) as string[]
                recentlyUsed = recentlyUsed.filter((e) => e !== crateId)
                recentlyUsed.unshift(crateId)
                while (recentlyUsed.length > MAX_LIST_LENGTH) recentlyUsed.pop()
                setRecentCrates(recentlyUsed)
                window.localStorage.setItem("recent-crates", JSON.stringify(recentlyUsed))
                window.localStorage.setItem(
                    crateDetailsKey(crateId),
                    JSON.stringify({ lastOpened: new Date() })
                )
            } catch (e) {
                console.warn("Failed to add recently used crated", e)
            }
        } else {
            window.localStorage.setItem("recent-crates", JSON.stringify([crateId]))
            setRecentCrates([crateId])
        }
    }, [])

    const removeFromRecentCrates = useCallback((crateId: string) => {
        const content = window.localStorage.getItem("recent-crates")
        if (content) {
            try {
                let recentlyUsed = JSON.parse(content) as string[]
                recentlyUsed = recentlyUsed.filter((e) => e !== crateId)
                while (recentlyUsed.length > MAX_LIST_LENGTH) recentlyUsed.pop()
                setRecentCrates(recentlyUsed)
                window.localStorage.setItem("recent-crates", JSON.stringify(recentlyUsed))
            } catch (e) {
                console.warn("Failed to add recently used crated", e)
            }
        } else {
            window.localStorage.setItem("recent-crates", JSON.stringify([]))
            setRecentCrates([])
        }
    }, [])

    return { recentCrates, addRecentCrate, removeFromRecentCrates }
}
