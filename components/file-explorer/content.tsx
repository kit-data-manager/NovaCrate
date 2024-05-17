"use client"

import { useMemo } from "react"
import { FileEntry, FolderEntry } from "@/components/file-explorer/entries"
import { DefaultSectionOpen } from "@/components/file-explorer/explorer"

export function FolderContent(props: {
    path: string
    filePaths: string[]
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const subFolders = useMemo(() => {
        const set = new Set<string>()
        props.filePaths
            .filter((file) => {
                const fileSplit = file.split("/")
                const pathSplit = props.path.split("/")
                return (
                    fileSplit.length > pathSplit.length &&
                    fileSplit.slice(0, pathSplit.length - 1).join() ===
                        pathSplit.slice(0, pathSplit.length - 1).join()
                )
            })
            .forEach((file) => {
                const fileSplit = file.split("/")
                const pathSplit = props.path.split("/")
                set.add(fileSplit.slice(0, pathSplit.length).join("/") + "/")
            })
        return Array.from(set)
    }, [props.filePaths, props.path])

    const contents = useMemo(() => {
        return props.filePaths.filter((file) => {
            const fileSplit = file.split("/")
            const pathSplit = props.path.split("/")
            return (
                fileSplit.length === pathSplit.length &&
                fileSplit.slice(0, fileSplit.length - 1).join() ===
                    pathSplit.slice(0, pathSplit.length - 1).join()
            )
        })
    }, [props.filePaths, props.path])

    return (
        <div>
            {subFolders.map((filePath) => {
                return (
                    <FolderEntry
                        filePath={filePath}
                        filePaths={props.filePaths}
                        key={filePath}
                        defaultSectionOpen={props.defaultSectionOpen}
                        onSectionOpenChange={props.onSectionOpenChange}
                    />
                )
            })}
            {contents.map((filePath) => {
                return <FileEntry filePath={filePath} key={filePath} />
            })}
        </div>
    )
}
