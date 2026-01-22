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
import { Error } from "@/components/error"
import { FileClock } from "lucide-react"

interface ChangelogStore {
    lastSeenVersion: string
    setLastSeenVersion: (version: string) => void
}

function isNewerVersion(test: string, currentVersion: string) {
    const testVersion = test.split(".")
    const currentVersionParts = currentVersion.split(".")
    for (let i = 0; i < testVersion.length; i++) {
        if (testVersion[i] > currentVersionParts[i]) return true
        if (testVersion[i] < currentVersionParts[i]) return false
    }
    return false
}

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

const fetcher = (url: string) => fetch(url).then((res) => res.text())

export function ChangelogModal() {
    const [unreadUpdates, setUnreadUpdates] = useState(false)
    const changelogStore = useChangelogStore()
    const [previousVersion, setPreviousVersion] = useState("0.0.0")

    // Set the last seen version to the current version if it is not set yet. This ensures that the store is persised to local storage
    useEffect(() => {
        if (changelogStore.lastSeenVersion === "") {
            changelogStore.setLastSeenVersion(packageJson.version)
        }
    }, [changelogStore])

    const { data, error } = useSWR("/api/changelog", fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false
    })
    const latestVersion = data ? /\[(\d+\.\d+\.\d+)]/gm.exec(data)?.[1] : undefined

    if (
        latestVersion &&
        isNewerVersion(latestVersion, changelogStore.lastSeenVersion) &&
        !unreadUpdates
    ) {
        setUnreadUpdates(true)
    }

    const markAsRead = useCallback(() => {
        if (latestVersion) {
            setPreviousVersion(changelogStore.lastSeenVersion)
            changelogStore.setLastSeenVersion(latestVersion)
            setUnreadUpdates(false)
        }
    }, [changelogStore, latestVersion])

    const separator = data ? data.indexOf("---") : undefined
    const separatedText = data && separator ? data.slice(separator) : ""

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
                        <Markdown
                            allowedElements={[
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
                    <Error error={error} title="Failed to fetch changelog." />
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
