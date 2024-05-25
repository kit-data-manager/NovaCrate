import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { crateDetailsKey } from "@/components/landing/util"
import { useEditorState } from "@/lib/state/editor-state"
import { usePathname, useRouter } from "next/navigation"
import {
    createEntityEditorTab,
    EntityEditorTabsContext
} from "@/components/providers/entity-tabs-provider"

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

function isEqual<I>(data: I | I[], oldData: I | I[]) {
    if (Array.isArray(data) && Array.isArray(oldData)) {
        if (data.length !== oldData.length) return false
        for (let i = 0; i < data.length; i++) {
            if (!Object.is(data[i], oldData[i])) return false
        }
        return true
    } else {
        return Object.is(data, oldData)
    }
}

export function useAsync<I, O>(
    input: I | null,
    resolver: (input: I) => Promise<O>
): { data: O | undefined; error: unknown; isPending: boolean; revalidate(): void } {
    const [internalState, setInternalState] = useState<O | undefined>(undefined)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<any>()

    const lastInput = useRef<I | null>(null)

    const action = useCallback(
        (input: I) => {
            setPending(true)

            resolver(input)
                .then((output) => {
                    setInternalState(output)
                    setError(undefined)
                })
                .catch((e) => {
                    console.error("Error in useAsync", e)
                    setError(e)
                })
                .finally(() => {
                    setPending(false)
                })
        },
        [resolver]
    )

    useEffect(() => {
        if (isEqual(input, lastInput.current)) return
        lastInput.current = input

        if (input !== null) {
            action(input)
        }
    }, [action, input, resolver])

    return {
        data: internalState,
        error,
        isPending: pending,
        revalidate: () => {
            if (lastInput.current !== null) action(lastInput.current)
        }
    }
}

export function useAutoId(name: string) {
    const entities = useEditorState.useEntities()

    return useMemo(() => {
        let generated = "#" + encodeURIComponent(name.toLowerCase().trim().replaceAll(" ", "-"))
        let maxIterations = 10
        while (entities.has(generated)) {
            if (maxIterations-- < 0) throw "Could not generate a unique id after 10 attempts"
            generated += "-1"
        }
        return generated
    }, [entities, name])
}

export function useGoToEntity(entity?: IFlatEntity) {
    const pathname = usePathname()
    const router = useRouter()
    const { openTab } = useContext(EntityEditorTabsContext)

    return useCallback(
        (_entity?: IFlatEntity) => {
            if (_entity || entity) {
                openTab(createEntityEditorTab(_entity || entity!), true)
            }

            const href =
                pathname
                    .split("/")
                    .filter((_, i) => i < 3)
                    .join("/") + "/entities"
            router.push(href)
        },
        [entity, openTab, pathname, router]
    )
}

export function useGoToJsonEditor() {
    const pathname = usePathname()
    const router = useRouter()

    return useCallback(() => {
        const href =
            pathname
                .split("/")
                .filter((_, i) => i < 3)
                .join("/") + "/json-editor"
        router.push(href)
    }, [pathname, router])
}
