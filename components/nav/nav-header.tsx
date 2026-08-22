"use client"

import {
    ChevronDown,
    Download,
    File,
    FileUp,
    FolderArchive,
    FolderUp,
    Notebook,
    Package,
    Palette
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
import { useTheme } from "next-themes"
import React, { useCallback, useContext, useMemo } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { useOperationState } from "@/lib/state/operation-state"
import { usePersistence } from "@/components/providers/persistence-provider"
import { downloadCrateAs } from "@/lib/core/util"
import { useAction, useCrateName, useCurrentEntity, useIsEmbedded } from "@/lib/hooks/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { getEntityDisplayName } from "@/lib/utils"
import { ActionButton, ActionMenubarItem } from "@/components/actions/action-buttons"
import { EntityIcon } from "@/components/entity/entity-icon"
import { KeyboardShortcut } from "@/components/actions/action-keyboard-shortcuts"
import { ValidationOverview } from "@/components/editor/validation/validation-overview"
import { toast } from "sonner"
import { InternalErrorLog } from "@/components/internal-error-log"

function EntityMenu() {
    const currentEntity = useCurrentEntity()

    const currentEntityName = useMemo(() => {
        return currentEntity ? getEntityDisplayName(currentEntity) : "No Active Entity"
    }, [currentEntity])

    return currentEntity !== undefined ? (
        <MenubarMenu>
            <MenubarTrigger>
                Entity
                <ChevronDown className="size-4 ml-1 text-muted-foreground" />
            </MenubarTrigger>
            <MenubarContent>
                <MenubarLabel className="max-w-75 truncate flex">
                    <EntityIcon entity={currentEntity} /> {currentEntityName}
                </MenubarLabel>
                <MenubarSeparator />
                <ActionMenubarItem actionId="entity.save" />
                <ActionMenubarItem actionId="entity.revert" />
                <MenubarSeparator />
                <ActionMenubarItem actionId="entity.add-property" />
                <ActionMenubarItem actionId="entity.find-references" />
                <MenubarSeparator />
                <ActionMenubarItem actionId="entity.delete" variant={"destructive"} />
            </MenubarContent>
        </MenubarMenu>
    ) : null
}

export function NavHeader() {
    const theme = useTheme()
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const { showCreateEntityModal, showCrateExportedModal } = useContext(GlobalModalContext)
    const persistence = usePersistence()
    const isSaving = useOperationState((s) => s.isSaving)
    const isEmbedded = useIsEmbedded()

    const showUploadFolderModal = useCallback(() => {
        showCreateEntityModal({
            restrictToClasses: [
                {
                    "@id": RO_CRATE_DATASET,
                    comment: ""
                }
            ]
        })
    }, [showCreateEntityModal])

    const showUploadFileModal = useCallback(() => {
        showCreateEntityModal({
            restrictToClasses: [
                {
                    "@id": RO_CRATE_FILE,
                    comment: ""
                }
            ]
        })
    }, [showCreateEntityModal])

    const crateName = useCrateName()

    const downloadCrateZip = useCallback(
        async (compressed: boolean) => {
            const repo = persistence.getRepositoryService()
            const crateId = persistence.getCrateId()
            if (repo && crateId) {
                try {
                    await downloadCrateAs(repo, crateId, "zip", crateName + ".zip", { compressed })
                    showCrateExportedModal()
                } catch (e) {
                    console.error("Failed to export crate as .zip", e)
                    toast.error("Failed to export crate as .zip")
                }
            }
        },
        [crateName, persistence, showCrateExportedModal]
    )

    const downloadCrateEln = useCallback(
        async (compressed: boolean) => {
            const repo = persistence.getRepositoryService()
            const crateId = persistence.getCrateId()
            if (repo && crateId) {
                try {
                    await downloadCrateAs(repo, crateId, "eln", crateName + ".eln", { compressed })
                    showCrateExportedModal()
                } catch (e) {
                    console.error("Failed to export crate as .eln", e)
                    toast.error("Failed to export crate as .eln")
                }
            }
        },
        [crateName, persistence, showCrateExportedModal]
    )

    const downloadRoCrateMetadataFile = useCallback(async () => {
        const repo = persistence.getRepositoryService()
        const crateId = persistence.getCrateId()
        if (repo && crateId) {
            try {
                await downloadCrateAs(repo, crateId, "standalone-json", "ro-crate-metadata.json")
                showCrateExportedModal()
            } catch (e) {
                console.error("Failed to export crate as JSON", e)
                toast.error("Failed to export crate as JSON")
            }
        }
    }, [persistence, showCrateExportedModal])

    const searchAction = useAction("editor.global-search")

    const menubar = useMemo(() => {
        return (
            <Menubar className="bg-transparent">
                <MenubarMenu>
                    <MenubarTrigger>
                        Editor <ChevronDown className="size-4 ml-1 text-muted-foreground" />
                    </MenubarTrigger>
                    <MenubarContent>
                        <ActionMenubarItem actionId="editor.global-search" />
                        <MenubarSeparator />
                        <MenubarSub>
                            <MenubarSubTrigger>
                                <Palette className="size-4" /> Theme
                            </MenubarSubTrigger>
                            <MenubarSubContent>
                                {theme.systemTheme && (
                                    <MenubarCheckboxItem
                                        checked={theme.theme === "system"}
                                        onClick={() => theme.setTheme("system")}
                                    >
                                        System Default ({theme.systemTheme})
                                    </MenubarCheckboxItem>
                                )}
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
                        <ActionMenubarItem actionId="editor.about" />
                        {!isEmbedded && (
                            <>
                                <MenubarSeparator />
                                <ActionMenubarItem actionId="editor.close" />
                            </>
                        )}
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>
                        Crate <ChevronDown className="size-4 ml-1 text-muted-foreground" />
                    </MenubarTrigger>
                    <MenubarContent>
                        <ActionMenubarItem actionId="crate.add-entity" />
                        <MenubarSeparator />
                        <MenubarItem onClick={() => showUploadFileModal()}>
                            <FileUp className="size-4" /> Upload File
                        </MenubarItem>
                        <MenubarItem onClick={() => showUploadFolderModal()}>
                            <FolderUp className="size-4" /> Upload Folder
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
                        <ActionMenubarItem actionId="crate.manage-profiles" />
                        <MenubarSub>
                            <MenubarSubTrigger>
                                <Download className="size-4" /> Export
                            </MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarItem onClick={() => downloadCrateZip(true)}>
                                    <FolderArchive className="size-4" /> As .zip Archive
                                    (Compressed)
                                </MenubarItem>
                                <MenubarItem onClick={() => downloadCrateZip(false)}>
                                    <FolderArchive className="size-4" /> As .zip Archive
                                    (Uncompressed)
                                </MenubarItem>
                                <MenubarItem onClick={() => downloadCrateEln(true)}>
                                    <Notebook className="size-4" /> As ELN (Compressed)
                                </MenubarItem>
                                <MenubarItem onClick={() => downloadCrateEln(false)}>
                                    <Notebook className="size-4" /> As ELN (Uncompressed)
                                </MenubarItem>
                                <MenubarItem onClick={downloadRoCrateMetadataFile}>
                                    <File className="size-4" /> ro-crate-metadata.json
                                </MenubarItem>
                            </MenubarSubContent>
                        </MenubarSub>
                        <ActionMenubarItem actionId="crate.generate-html-preview" />
                    </MenubarContent>
                </MenubarMenu>
                <EntityMenu />
            </Menubar>
        )
    }, [
        downloadCrateEln,
        downloadCrateZip,
        downloadRoCrateMetadataFile,
        hasUnsavedChanges,
        isEmbedded,
        isSaving,
        showUploadFileModal,
        showUploadFolderModal,
        theme
    ])

    return (
        <div className="p-4 py-2 pr-3 w-full grid grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center">
                <Package className="w-7 h-7 mr-2" />
                <div className="mr-6 font-bold max-w-75 truncate animate-in">
                    <div className="text-xs font-normal">NovaCrate</div>
                    {crateName}
                </div>

                {menubar}
                {/* Disabled until a proper implementation is done */}
                {/*<Button size="sm" variant="ghost" className="mx-2 text-sm" onClick={() => undo()}>*/}
                {/*    <Undo className="size-4 mr-2" />*/}
                {/*    Undo*/}
                {/*</Button>*/}
                {/*<Button size="sm" variant="ghost" className="text-sm" onClick={() => redo()}>*/}
                {/*    <Redo className="size-4 mr-2" />*/}
                {/*    Redo*/}
                {/*</Button>*/}
            </div>

            <div />

            <div className="flex justify-end items-center gap-2" id={"header-right-side"}>
                <ValidationOverview />
                <InternalErrorLog />
                <ActionButton
                    variant="outline"
                    actionId={"editor.global-search"}
                    name={"search"}
                    noShortcut
                    hideName
                    className="text-muted-foreground font-normal hover:bg-background cursor-text"
                >
                    <span className="pl-2 pr-4 font-normal">Search for anything...</span>
                    <span className="text-muted-foreground text-xs tracking-widest">
                        <KeyboardShortcut action={searchAction} />
                    </span>
                </ActionButton>
                <ActionButton
                    variant="outline"
                    name={"settings"}
                    actionId={"editor.settings"}
                    iconOnly
                    showTooltip
                />
                {process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === "true" && (
                    <div className="border-l border-border pl-2">
                        <ActionButton
                            variant="outline"
                            name={"ai-assistant"}
                            actionId={"editor.toggle-ai-assistant"}
                            showTooltip
                            iconOnly
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
