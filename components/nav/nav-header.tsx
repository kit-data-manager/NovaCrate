"use client"

import {
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
    Search
} from "lucide-react"
import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarLabel,
    MenubarMenu,
    MenubarSeparator,
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
import { useAction, useCrateName, useCurrentEntity } from "@/lib/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { useCopyToClipboard } from "usehooks-ts"
import { Skeleton } from "@/components/ui/skeleton"
import { getEntityDisplayName } from "@/lib/utils"
import { ActionButton, ActionMenubarItem } from "@/components/actions/action-buttons"
import { EntityIcon } from "@/components/entity-icon"
import {
    ActionKeyboardShortcuts,
    KeyboardShortcut
} from "@/components/actions/action-keyboard-shortcuts"

function EntityMenu() {
    const currentEntity = useCurrentEntity()

    const currentEntityName = useMemo(() => {
        return currentEntity ? getEntityDisplayName(currentEntity) : "No Active Entity"
    }, [currentEntity])

    return currentEntity !== undefined ? (
        <MenubarMenu>
            <MenubarTrigger>
                Entity
                <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
            </MenubarTrigger>
            <MenubarContent>
                <MenubarLabel className="max-w-[300px] truncate flex">
                    <EntityIcon entity={currentEntity} /> {currentEntityName}
                </MenubarLabel>
                <MenubarSeparator />
                <ActionMenubarItem actionId="entity.save" />
                <ActionMenubarItem actionId="entity.revert" />
                <MenubarSeparator />
                <ActionMenubarItem actionId="entity.add-property" />
                <ActionMenubarItem actionId="entity.find-references" />
                <MenubarSeparator />
                <ActionMenubarItem
                    actionId="entity.delete"
                    className="bg-destructive text-destructive-foreground"
                />
            </MenubarContent>
        </MenubarMenu>
    ) : null
}

export function NavHeader() {
    const theme = useTheme()
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const { showCreateEntityModal, showGlobalSearchModal } = useContext(GlobalModalContext)
    const { serviceProvider, crateId, isSaving, crateDataIsLoading } = useContext(CrateDataContext)
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
        if (serviceProvider && crateId) {
            serviceProvider.downloadCrateZip(crateId).then()
        }
    }, [crateId, serviceProvider])

    const crateName = useCrateName()
    const searchAction = useAction("editor.global-search")

    return (
        <div className="p-4 py-3 w-full grid grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center">
                <Package className="w-7 h-7 mr-2" />
                {crateDataIsLoading || !crateName ? (
                    <Skeleton className="h-8 w-32" />
                ) : (
                    <div className="mr-6 font-bold max-w-[300px] truncate animate-in">
                        <div className="text-xs font-normal">NovaCrate</div>
                        {crateName}
                    </div>
                )}

                <Menubar>
                    <MenubarMenu>
                        <MenubarTrigger>
                            Editor <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        </MenubarTrigger>
                        <MenubarContent>
                            <ActionMenubarItem actionId="editor.global-search" />
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
                            <ActionMenubarItem actionId="editor.settings" />
                            <MenubarItem disabled>
                                <Info className="w-4 h-4 mr-2" /> Info
                            </MenubarItem>
                            <MenubarSeparator />
                            <ActionMenubarItem actionId="editor.close" />
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>
                            Crate <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        </MenubarTrigger>
                        <MenubarContent>
                            <ActionMenubarItem actionId="crate.add-entity" />
                            <MenubarSeparator />
                            <MenubarItem onClick={() => showUploadFileModal()}>
                                <FileUp className="w-4 h-4 mr-2" /> Upload File
                            </MenubarItem>
                            <MenubarItem onClick={() => showUploadFolderModal()}>
                                <FolderUp className="w-4 h-4 mr-2" /> Upload Folder
                            </MenubarItem>
                            <MenubarSeparator />
                            <ActionMenubarItem
                                disabled={isSaving || !hasUnsavedChanges}
                                actionId="crate.save-all-entities"
                            />
                            <ActionMenubarItem
                                disabled={isSaving || !hasUnsavedChanges}
                                actionId="crate.revert-all-entities"
                            />
                            <MenubarSeparator />
                            <ActionMenubarItem actionId="crate.reload-entities" />
                            <MenubarSeparator />
                            <MenubarSub>
                                <MenubarSubTrigger>
                                    <Copy className="w-4 h-4 mr-2" /> Copy Crate...
                                </MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarItem onClick={() => copy(crateId || "")}>
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
                    <EntityMenu />
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
                {/*<div className="flex items-center mr-2 text-green-500">*/}
                {/*    <Check className="w-4 h-4 mr-2" /> No Issues detected*/}
                {/*</div>*/}
                <ActionButton
                    variant="outline"
                    actionId={"editor.global-search"}
                    noShortcut
                    hideName
                    className="text-muted-foreground font-normal hover:bg-background cursor-text"
                >
                    <span className="pl-2 pr-4 font-normal">Search for anything...</span>
                    <span className="text-muted-foreground text-xs tracking-widest">
                        <KeyboardShortcut action={searchAction} />
                    </span>
                </ActionButton>
                <ActionButton variant="secondary" actionId={"editor.settings"} iconOnly />
            </div>
        </div>
    )
}
