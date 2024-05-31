"use client"

import {
    ArrowBigUp,
    Check,
    ChevronDown,
    Cog,
    Copy,
    Download,
    FileUp,
    FolderArchive,
    FolderUp,
    Info,
    Package,
    Palette,
    Plus,
    RefreshCw,
    Save,
    SaveAll,
    Search,
    Trash,
    Undo2,
    XIcon
} from "lucide-react"
import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarLabel,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger
} from "@/components/ui/menubar"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import React, { useCallback, useContext, useMemo } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useCrateName, useCurrentEntity, useGoToMainMenu, useSaveAllEntities } from "@/lib/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { useCopyToClipboard } from "usehooks-ts"
import { Skeleton } from "@/components/ui/skeleton"
import { getEntityDisplayName } from "@/lib/utils"

export function NavHeader() {
    const theme = useTheme()
    const revertAllEntities = useEditorState.useRevertAllEntities()
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const { showCreateEntityModal, showGlobalSearchModal } = useContext(GlobalModalContext)
    const { reload, serviceProvider, crateId, isSaving, crateDataIsLoading } =
        useContext(CrateDataContext)
    // const { undo, redo } = useEditorState.temporal.getState()
    const [_, copyFn] = useCopyToClipboard()

    const copy = useCallback(
        (text: string) => {
            copyFn(text).catch((e) => console.error("Failed to copy to clipboard", e))
        },
        [copyFn]
    )

    const showUploadFolderModal = useCallback(() => {
        showCreateEntityModal([
            {
                "@id": RO_CRATE_DATASET,
                comment: ""
            }
        ])
    }, [showCreateEntityModal])

    const showUploadFileModal = useCallback(() => {
        showCreateEntityModal([
            {
                "@id": RO_CRATE_FILE,
                comment: ""
            }
        ])
    }, [showCreateEntityModal])

    const downloadCrateZip = useCallback(() => {
        if (serviceProvider) {
            serviceProvider.downloadCrateZip(crateId).then()
        }
    }, [crateId, serviceProvider])

    const goToMainMenu = useGoToMainMenu()
    const saveAllEntities = useSaveAllEntities()
    const crateName = useCrateName()
    const currentEntity = useCurrentEntity()

    const currentEntityName = useMemo(() => {
        return currentEntity ? getEntityDisplayName(currentEntity) : "No Active Entity"
    }, [currentEntity])

    return (
        <div className="p-4 py-3 w-full grid grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center">
                <Package className="w-7 h-7 mr-2" />
                {crateDataIsLoading ? (
                    <Skeleton className="h-8 w-32" />
                ) : (
                    <div className="mr-6 font-bold max-w-[300px] truncate">{crateName}</div>
                )}

                <Menubar>
                    <MenubarMenu>
                        <MenubarTrigger>
                            Editor <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        </MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onClick={showGlobalSearchModal}>
                                <Search className="w-4 h-4 mr-2" /> Search
                                <MenubarShortcut>⌘K</MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarSub>
                                <MenubarSubTrigger>
                                    <Palette className="w-4 h-4 mr-2" /> Theme
                                </MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarCheckboxItem
                                        checked={theme.theme === "dark"}
                                        onClick={() => theme.setTheme("dark")}
                                    >
                                        Dark Theme
                                    </MenubarCheckboxItem>
                                    <MenubarCheckboxItem
                                        checked={theme.theme === "light"}
                                        onClick={() => theme.setTheme("light")}
                                    >
                                        Light Theme
                                    </MenubarCheckboxItem>
                                </MenubarSubContent>
                            </MenubarSub>
                            <MenubarItem disabled>
                                <Cog className="w-4 h-4 mr-2" /> Settings
                            </MenubarItem>
                            <MenubarItem disabled>
                                <Info className="w-4 h-4 mr-2" /> Info
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={goToMainMenu}>
                                <XIcon className="w-4 h-4 mr-2" /> Close Editor{" "}
                                <MenubarShortcut className="flex">⌘W</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>
                            Crate <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        </MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onClick={() => showCreateEntityModal()}>
                                <Plus className="w-4 h-4 mr-2" /> Add new Entity
                                <MenubarShortcut className="flex">⌘A</MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={() => showUploadFileModal()}>
                                <FileUp className="w-4 h-4 mr-2" /> Upload File
                            </MenubarItem>
                            <MenubarItem onClick={() => showUploadFolderModal()}>
                                <FolderUp className="w-4 h-4 mr-2" /> Upload Folder
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem
                                onClick={saveAllEntities}
                                disabled={isSaving || !hasUnsavedChanges}
                            >
                                <SaveAll className={"w-4 h-4 mr-2"} /> Save All Entities
                                <MenubarShortcut className="flex">
                                    <ArrowBigUp className="w-4 h-4" /> ⌘S
                                </MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem
                                onClick={revertAllEntities}
                                disabled={isSaving || !hasUnsavedChanges}
                            >
                                <Undo2 className={"w-4 h-4 mr-2"} /> Revert All Entities
                                <MenubarShortcut className="flex ml-2">
                                    <ArrowBigUp className="w-4 h-4" /> ⌘Z
                                </MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={() => reload()}>
                                <RefreshCw className="w-4 h-4 mr-2" /> Reload Entities
                                <MenubarShortcut className="flex">⌘R</MenubarShortcut>
                            </MenubarItem>

                            <MenubarSeparator />
                            <MenubarSub>
                                <MenubarSubTrigger>
                                    <Copy className="w-4 h-4 mr-2" /> Copy Crate...
                                </MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarItem onClick={() => copy(crateId)}>
                                        <Copy className="w-4 h-4 mr-2" /> Copy Crate ID
                                    </MenubarItem>
                                    <MenubarItem onClick={() => copy(crateName)}>
                                        <Copy className="w-4 h-4 mr-2" /> Copy Crate Name
                                    </MenubarItem>
                                </MenubarSubContent>
                            </MenubarSub>
                            <MenubarSub>
                                <MenubarSubTrigger>
                                    <Download className="w-4 h-4 mr-2" /> Export
                                </MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarItem onClick={downloadCrateZip}>
                                        <FolderArchive className="w-4 h-4 mr-2" /> As .zip Archive
                                    </MenubarItem>
                                </MenubarSubContent>
                            </MenubarSub>
                        </MenubarContent>
                    </MenubarMenu>
                    {currentEntity !== undefined ? (
                        <MenubarMenu>
                            <MenubarTrigger>
                                Entity{" "}
                                <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                            </MenubarTrigger>
                            <MenubarContent>
                                <MenubarLabel className="max-w-[300px] truncate">
                                    {currentEntityName}
                                </MenubarLabel>
                                <MenubarItem>
                                    <Save className="w-4 h-4 mr-2" /> Save
                                    <MenubarShortcut className="flex">⌘S</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem>
                                    <Save className="w-4 h-4 mr-2" /> Save as...
                                </MenubarItem>
                                <MenubarItem>
                                    <Undo2 className="w-4 h-4 mr-2" /> Revert
                                    <MenubarShortcut className="flex">⌘Z</MenubarShortcut>
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem>
                                    <Plus className="w-4 h-4 mr-2" /> Add Property
                                    <MenubarShortcut className="flex">⌘E</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem>
                                    <Search className="w-4 h-4 mr-2" /> Find References
                                    <MenubarShortcut className="flex">⌘Q</MenubarShortcut>
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem className="bg-destructive">
                                    <Trash className="w-4 h-4 mr-2" /> Delete
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    ) : null}
                </Menubar>
                {/* Disabled until a proper implementation is done */}
                {/*<Button size="sm" variant="ghost" className="mx-2 text-sm" onClick={() => undo()}>*/}
                {/*    <Undo className="w-4 h-4 mr-2" />*/}
                {/*    Undo*/}
                {/*</Button>*/}
                {/*<Button size="sm" variant="ghost" className="text-sm" onClick={() => redo()}>*/}
                {/*    <Redo className="w-4 h-4 mr-2" />*/}
                {/*    Redo*/}
                {/*</Button>*/}
            </div>

            <div />

            <div className="flex justify-end items-center gap-2">
                <div className="flex items-center mr-2 text-green-500">
                    <Check className="w-4 h-4 mr-2" /> No Issues detected
                </div>
                <Button
                    variant="secondary"
                    className="text-muted-foreground text-xs"
                    onClick={showGlobalSearchModal}
                >
                    <Search className="w-4 h-4 mr-2 text-foreground" /> ⌘K
                </Button>
                <Button variant="secondary" size="icon">
                    <Cog className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
