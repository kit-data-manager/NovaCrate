"use client"

import useSWR from "swr"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useCallback, useEffect, useState } from "react"
import packageJson from "../package.json"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Markdown from "react-markdown"
import { Error as ErrorDisplay } from "@/components/error"
import { FileClock, LoaderCircle } from "lucide-react"

/**
 * Used by the ChangelogModal component to store and persist the last seen changelog version
 */
interface ChangelogStore {
    lastSeenVersion: string
    setLastSeenVersion: (version: string) => void
}

/**
 * Check if the semver version passed in test is newer than the one in currentVersion
 * @param test Semver version in the format d+.d+.d+ (1.5.0 or 20.5000.12, not 1.5.0-beta)
 * @param currentVersion Semver version in the format d+.d+.d+ (1.5.0 or 20.5000.12, not 1.5.0-beta)
 */
function isNewerVersion(test: string, currentVersion: string) {
    const testVersion = test.split(".").map((n) => parseInt(n))
    const currentVersionParts = currentVersion.split(".").map((n) => parseInt(n))
    for (let i = 0; i < 3; i++) {
        if (Number.isNaN(testVersion[i]) || Number.isNaN(currentVersionParts[i])) {
            console.error(
                `Invalid semver version: ${test} (test) or ${currentVersion} (currentVersion)`
            )
            return false
        }
        if (testVersion[i] > currentVersionParts[i]) return true
        if (testVersion[i] < currentVersionParts[i]) return false
    }
    return false
}

/**
 * Used by the ChangelogModal component to store and persist the last seen changelog version
 */
const useChangelogStore = create<ChangelogStore>()(
    persist(
        (set) => ({
            lastSeenVersion: "",
            setLastSeenVersion: (version) => {
                set({ lastSeenVersion: version })
            }
        }),
        {
            name: "novacrate-changelog",
            version: 1
        }
    )
)

const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (res.ok) return res.text()
        else throw new Error(`Failed to fetch changelog: ${res.statusText}`)
    })

/**
 * Component that displays a changelog button that, when clicked, opens a changelog modal. Automatically stores the last seen version
 * and checks if a newer one is now being accessed. This is indicated by a red dot on the button. This component can be used in isolation and has
 * no context dependencies.
 * @constructor
 */
export function ChangelogModal() {
    const [unreadUpdates, setUnreadUpdates] = useState(false)
    const changelogStore = useChangelogStore()
    const [previousVersion, setPreviousVersion] = useState("0.0.0")
    const [loadChangelog, setLoadChangelog] = useState(false)

    // Set the last seen version to the current version if it is not set yet. This ensures that the store is persisted to local storage
    useEffect(() => {
        // True iff loading from local storage is done (persist has hydrated), and the lastSeenVersion field is still empty. In this case, the state has never been set and is initialized here
        if (
            useChangelogStore.persist.hasHydrated() &&
            useChangelogStore.getState().lastSeenVersion === ""
        ) {
            changelogStore.setLastSeenVersion(packageJson.version)
        }
    }, [changelogStore])

    const { data, error, isLoading } = useSWR(loadChangelog ? "/api/changelog" : null, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false
    })
    const latestVersion = packageJson.version

    if (
        changelogStore.lastSeenVersion !== "" &&
        isNewerVersion(latestVersion, changelogStore.lastSeenVersion) &&
        !unreadUpdates
    ) {
        setUnreadUpdates(true)
    }

    const markAsRead = useCallback(() => {
        setLoadChangelog(true)
        setPreviousVersion(changelogStore.lastSeenVersion)
        changelogStore.setLastSeenVersion(latestVersion)
        setUnreadUpdates(false)
    }, [changelogStore, latestVersion])

    const separator = data ? data.indexOf("---") : undefined
    const separatedText =
        data && separator !== undefined && separator > 0 ? data.slice(separator) : ""

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button onClick={markAsRead} variant="outline" className="relative">
                    {unreadUpdates && (
                        <div className="size-2 bg-red-500 absolute rounded-full right-0 top-0 translate-x-[40%] -translate-y-[40%]" />
                    )}
                    <FileClock /> Changelog
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Changelog</DialogTitle>
                    <DialogDescription>
                        The changelog summarizes the changes that happened in previous updates of
                        NovaCrate.
                    </DialogDescription>
                    <div className="max-h-125 overflow-auto typography">
                        You were using version {previousVersion} the last time you were here.
                        {isLoading && (
                            <div className="flex justify-center pt-6">
                                <LoaderCircle className="size-6 animate-spin" />
                            </div>
                        )}
                        <Markdown
                            allowedElements={[
                                // Styled in globals.css
                                "h1",
                                "p",
                                "ul",
                                "li",
                                "h2",
                                "a",
                                "br",
                                "b",
                                "i",
                                "h3"
                            ]}
                        >
                            {separatedText}
                        </Markdown>
                    </div>
                    <ErrorDisplay error={error} title="Failed to fetch changelog." />
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
