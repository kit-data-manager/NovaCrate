import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { crateDetailsKey } from "@/components/landing/util"
import { useEditorState } from "@/lib/state/editor-state"
import { usePathname, useRouter } from "next/navigation"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { isRootEntity } from "@/lib/utils"
import { useGraphState } from "@/components/providers/graph-state-provider"
import { Action, notFoundAction } from "@/lib/state/actions"
import { useActionsStore } from "@/components/providers/actions-provider"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"

const MAX_LIST_LENGTH = 100

/**
 * Utility hook to provide easy access to recent crates (stored in local storage)
 * Contains the IDs of recent crates
 */
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

    const addRecentCrate = useCallback((crateId: string, name: string) => {
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
                    JSON.stringify({ lastOpened: new Date(), name })
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
                window.localStorage.removeItem(crateDetailsKey(crateId))
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

/**
 * Compare a value or an array of values using Object.is
 * @param data
 * @param oldData
 * @returns true when data and oldData are equal, or if each of their indexes is equal (in case of an array)
 */
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

/**
 * Wrapper to evaluate an asynchronous function and provide its output
 * Will automatically rerun the function when the input changes.
 * When input is null, the resolver will not be executed
 * @param input Input for the resolver. Will trigger rerun when changed. When set to null, the resolver will not be executed
 * @param resolver Asynchronous function to run with the input
 */
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

/**
 * Utility for the create-entity-modal
 * Tries to guess an entity ID from the entity name
 * @param name Name of the entity
 */
export function useAutoId(name: string) {
    const entities = useEditorState.useEntities()

    return useMemo(() => {
        if (name == "") return ""
        let generated = "#" + encodeURIComponent(name.toLowerCase().trim().replaceAll(" ", "-"))
        let maxIterations = 10
        while (entities.has(generated)) {
            if (maxIterations-- < 0) throw "Could not generate a unique id after 10 attempts"
            generated += "-1"
        }
        return generated
    }, [entities, name])
}

/**
 * Returns a function that redirects the user to the entities page and opens/focuses a tab for the supplied entity
 * @param entity
 */
export function useGoToEntityEditor(entity?: IEntity) {
    const pathname = usePathname()
    const router = useRouter()
    const openTab = useEntityEditorTabs((store) => store.openTab)

    return useCallback(
        (_entity?: IEntity) => {
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

/**
 * Returns a function that redirects the user to the graph
 */
export function useGoToGraph() {
    const pathname = usePathname()
    const router = useRouter()

    return useCallback(() => {
        const href =
            pathname
                .split("/")
                .filter((_, i) => i < 3)
                .join("/") + "/graph"
        router.push(href)
    }, [pathname, router])
}

/**
 * Returns a function that redirects the user to the file explorer page and opens the preview for the supplied entity
 * @param entity
 */
export function useGoToFileExplorer(entity?: IEntity) {
    const pathname = usePathname()
    const router = useRouter()
    const setPreviewingFilePath = useFileExplorerState((store) => store.setPreviewingFilePath)

    return useCallback(
        (_entity?: IEntity) => {
            if (_entity || entity) {
                setPreviewingFilePath(_entity?.["@id"] || entity?.["@id"]!)
            }

            const href =
                pathname
                    .split("/")
                    .filter((_, i) => i < 3)
                    .join("/") + "/file-explorer"
            router.push(href)
        },
        [entity, pathname, router, setPreviewingFilePath]
    )
}

/**
 * Returns a function that redirects the user to the specified page
 * @param page Name of the page to redirect to (e.g. "entites")
 */
export function useGoToPage(page: string) {
    const pathname = usePathname()
    const router = useRouter()

    return useCallback(() => {
        const href =
            pathname
                .split("/")
                .filter((_, i) => i < 3)
                .join("/") +
            "/" +
            page
        router.push(href)
    }, [page, pathname, router])
}

/**
 * Returns the name of the current page
 * @example
 * // User is on /editor/full/entities
 * useCurrentPageName() // returns "entities"
 */
export function useCurrentPageName() {
    const pathname = usePathname()
    return pathname.split("/")[3]
}

/**
 * Returns a function that redirects the user to the main menu
 */
export function useGoToMainMenu() {
    const router = useRouter()

    return useCallback(() => {
        router.push("/editor")
    }, [router])
}

/**
 * Wrapper to call CrateDataContext.saveAllEntities with only entities that have changes
 */
export function useSaveAllEntities() {
    const { saveAllEntities } = useContext(CrateDataContext)
    const getChangedEntities = useEditorState.useGetChangedEntities()

    return useCallback(() => {
        return saveAllEntities(getChangedEntities())
    }, [getChangedEntities, saveAllEntities])
}

/**
 * Returns the name of the current crate
 */
export function useCrateName() {
    const crate = useContext(CrateDataContext)

    return useMemo(() => {
        return (crate.crateData?.["@graph"].find(isRootEntity)?.name || crate.crateId) + ""
    }, [crate.crateData, crate.crateId])
}

/**
 * This hook tries to find the currently active entity
 * Works in Entities page, File Explorer page and Graph page
 */
export function useCurrentEntity() {
    const page = useCurrentPageName()
    const activeTabEntityID = useEntityEditorTabs((store) => store.activeTabEntityID)
    const activeNodeEntityID = useGraphState((store) => store.selectedEntityID)
    const fileExplorerFilePath = useFileExplorerState((store) => store.previewingFilePath)
    return useEditorState((store) => {
        if (page === "entities") {
            return store.entities.get(activeTabEntityID)
        } else if (page === "file-explorer") {
            return store.entities.get(fileExplorerFilePath)
        } else if (page === "graph" && activeNodeEntityID) {
            return store.entities.get(activeNodeEntityID)
        } else return undefined
    })
}

/**
 * This hook registers an action with the Actions Registry
 * @param id Unique ID of the action
 * @param name Display name of the action
 * @param fn Function for the action. Will be called when the action is executed
 * @param options Options for this action
 */
export function useRegisterAction(
    id: string,
    name: string,
    fn: () => void,
    options?: Partial<Omit<Action, "id" | "name" | "execute">>
) {
    const registerAction = useActionsStore((store) => store.registerAction)
    const unregisterAction = useActionsStore((store) => store.unregisterAction)
    const constId = useRef(id)
    const constName = useRef(name)
    const constOptions = useRef(options)

    const action: Action = useMemo(
        () => ({
            id: constId.current,
            name: constName.current,
            execute: fn,
            ...constOptions.current
        }),
        [fn]
    )

    useEffect(() => {
        registerAction(action)

        return () => unregisterAction(action.id)
    }, [action, registerAction, unregisterAction])
}

/**
 * Get an action from the Action Registry via the action id
 * @param id ID of the action
 */
export function useAction(id: string) {
    return useActionsStore((store) => store.actions.get(id) || notFoundAction(id))
}

/**
 * Helper hook to determine if the Action Registry is ready yet. The Action Registry is always safe to use, but while
 * it is not ready, yet it may miss some actions
 */
export function useActionsReady() {
    return useActionsStore((store) => store.isReady())
}

export function useDeferredValue<T>(
    value: T,
    onChange: (v: T) => void,
    options?: Partial<{ time: number }>
) {
    const [state, setState] = useState(value)

    useEffect(() => {
        setState(value)
    }, [value])

    const updateDeferredValueTimer = useRef<number>()
    const debouncedState = useRef(state)
    useEffect(() => {
        debouncedState.current = state
    }, [state])

    const onTriggerChange = useCallback(
        (newValue: T) => {
            setState(newValue)
            if (updateDeferredValueTimer.current === undefined) {
                updateDeferredValueTimer.current = window.setTimeout(() => {
                    onChange(debouncedState.current)
                    updateDeferredValueTimer.current = undefined
                }, options?.time || 300)
            }
        },
        [onChange, options?.time]
    )

    return {
        unDeferredValue: state,
        deferredOnChange: onTriggerChange
    }
}
