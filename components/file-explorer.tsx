"use client"

import { useCallback, useContext, useMemo, useState } from "react"
import { CrateDataContext } from "@/components/crate-data-provider"
import { getEntityDisplayName, isDataEntity, isFileDataEntity, toArray } from "@/lib/utils"
import {
    ChevronDown,
    ChevronsDownUp,
    ChevronsUpDown,
    File,
    FileX,
    Folder,
    FolderX,
    Plus,
    RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_TYPE = "__EditorMock__"

function isNonEmptyPart(part: string) {
    return part !== "" && part !== "."
}

function entityDisplayNameFileExplorer(entity: IFlatEntity) {
    const parts = entity["@id"].split("/").filter(isNonEmptyPart)
    return parts[parts.length - 1] || entity["@id"]
}

function isMockEntity(entity: IFlatEntity) {
    return toArray(entity["@type"]).includes(MOCK_TYPE)
}

function inCurrentFolder(path: string, folderPath: string) {
    return (
        inSubFolder(path, folderPath) &&
        path.split("/").filter(isNonEmptyPart).length ===
            folderPath.split("/").filter(isNonEmptyPart).length + 1
    )
}

function inSubFolder(path: string, folderPath: string) {
    return path !== folderPath && path.startsWith(folderPath)
}

function addMissingFolders(content: IFlatEntity[], path: string, crate: ICrate) {
    const result = content.slice()
    const candidates = crate["@graph"]
        .filter((entity) => isDataEntity(entity))
        .filter((entity) => inSubFolder(entity["@id"], path))
    const deleteCount = path.split("/").length - 1

    for (const candidate of candidates) {
        const splitPath = candidate["@id"]
            .split("/")
            .filter((segment) => segment !== "." && segment !== "")
        splitPath.splice(0, deleteCount)
        if (splitPath.length <= 1) continue
        const folderName = splitPath[0]
        const fullPath = path + folderName + "/"
        if (!result.find((r) => r["@id"] === fullPath)) {
            result.push({
                "@id": fullPath,
                "@type": ["Dataset", MOCK_TYPE]
            })
        }
    }

    return result
}

function FolderEntry(props: { entity: IFlatEntity; crate: ICrate }) {
    const [isOpen, setIsOpen] = useState(true)

    const isFile = useMemo(() => {
        return isFileDataEntity(props.entity)
    }, [props.entity])

    const isMock = useMemo(() => {
        return isMockEntity(props.entity)
    }, [props.entity])

    const toggleOpen = useCallback(() => {
        if (!isFile) setIsOpen(!isOpen)
    }, [isFile, isOpen])

    return (
        <>
            <Button
                className={`gap-2 group/fileBrowserEntry w-full pl-1`}
                variant="list-entry"
                onClick={() => toggleOpen()}
            >
                {isFile ? (
                    <>
                        <div className="w-4 h-4 shrink-0" />
                        {isMock ? (
                            <FileX className="w-4 h-4 text-warn shrink-0" />
                        ) : (
                            <File className="w-4 h-4 shrink-0" />
                        )}
                    </>
                ) : (
                    <>
                        <ChevronDown
                            className="w-4 h-4 text-foreground shrink-0 aria-disabled:-rotate-90"
                            aria-disabled={!isOpen}
                        />
                        {isMock ? (
                            <FolderX className="w-4 h-4 text-warn shrink-0" />
                        ) : (
                            <Folder className="w-4 h-4 shrink-0" />
                        )}
                    </>
                )}
                <div className="truncate">
                    <span className="group-hover/fileBrowserEntry:underline">
                        {entityDisplayNameFileExplorer(props.entity)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                        {getEntityDisplayName(props.entity, false)}
                    </span>
                </div>
            </Button>
            {!isFile && isOpen ? (
                <div className="ml-6">
                    <FolderContent crate={props.crate} path={props.entity["@id"]} />
                </div>
            ) : null}
        </>
    )
}

function FolderContent(props: { crate: ICrate; path: string }) {
    const contents = useMemo(() => {
        return addMissingFolders(
            props.crate["@graph"]
                .filter((entity) => isDataEntity(entity))
                .filter((entity) => inCurrentFolder(entity["@id"], props.path)),
            props.path,
            props.crate
        )
    }, [props.crate, props.path])

    return (
        <div>
            {contents.map((entity) => {
                return <FolderEntry entity={entity} key={entity["@id"]} crate={props.crate} />
            })}
        </div>
    )
}

export function FileExplorer() {
    const crateData = useContext(CrateDataContext)

    return (
        <div>
            <div className="flex gap-2 sticky top-0 z-10 p-2 bg-accent">
                <Button size="sm" variant="outline" className="text-xs">
                    <Plus className={"w-4 h-4"} />
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                    <ChevronsDownUp className={"w-4 h-4"} />
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                    <ChevronsUpDown className={"w-4 h-4"} />
                </Button>
                <div className="grow"></div>
                <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs`}
                    disabled={crateData.crateDataIsLoading}
                >
                    <RefreshCw
                        className={`w-4 h-4 ${crateData.crateDataIsLoading ? "animate-spin" : ""}`}
                    />
                </Button>
            </div>
            <div className="p-2">
                {!crateData.crateData ? null : (
                    <FolderContent crate={crateData.crateData} path={""} />
                )}
            </div>
        </div>
    )
}
