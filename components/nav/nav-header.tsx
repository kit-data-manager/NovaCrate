"use client"

import {
    Check,
    ChevronDown,
    Cog,
    FileUp,
    FolderArchive,
    FolderUp,
    Moon,
    Package,
    Plus,
    RefreshCcw,
    SaveAll,
    Search,
    Sun,
    Undo2,
    XIcon
} from "lucide-react"
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger
} from "@/components/ui/menubar"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useGoToMainMenu, useSaveAllEntities } from "@/lib/hooks"
import { useEditorState } from "@/lib/state/editor-state"

export function NavHeader() {
    const theme = useTheme()
    const revertAllEntities = useEditorState.useRevertAllEntities()
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const { showCreateEntityModal, showGlobalSearchModal } = useContext(GlobalModalContext)
    const { reload, serviceProvider, crateId, isSaving } = useContext(CrateDataContext)
    // const { undo, redo } = useEditorState.temporal.getState()

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

    const toggleTheme = useCallback(() => {
        if (theme.theme === "light") {
            theme.setTheme("dark")
        } else {
            theme.setTheme("light")
        }
    }, [theme])

    const downloadCrateZip = useCallback(() => {
        if (serviceProvider) {
            serviceProvider.downloadCrateZip(crateId).then()
        }
    }, [crateId, serviceProvider])

    const goToMainMenu = useGoToMainMenu()

    const saveAllEntities = useSaveAllEntities()

    return (
        <div className="p-4 w-full grid grid-cols-[1fr_auto_1fr] border-b">
            <div className="flex items-center">
                <Package className="w-7 h-7 mr-2" />
                <div className="mr-6 font-bold">Editor Name</div>

                <Menubar>
                    <MenubarMenu>
                        <MenubarTrigger>
                            Crate <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        </MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onClick={goToMainMenu}>
                                <XIcon className="w-4 h-4 mr-2" /> Close Editor
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem
                                onClick={saveAllEntities}
                                disabled={isSaving || !hasUnsavedChanges}
                            >
                                <SaveAll className={"w-4 h-4 mr-2"} /> Save All Entities
                            </MenubarItem>
                            <MenubarItem
                                onClick={revertAllEntities}
                                disabled={isSaving || !hasUnsavedChanges}
                            >
                                <Undo2 className={"w-4 h-4 mr-2"} /> Revert All Entities
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={downloadCrateZip}>
                                <FolderArchive className="w-4 h-4 mr-2" /> Download Crate as .zip
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>
                            Entities <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        </MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onClick={() => showCreateEntityModal()}>
                                <Plus className="w-4 h-4 mr-2" /> Add new Entity
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={() => showUploadFileModal()}>
                                <FileUp className="w-4 h-4 mr-2" /> Upload File
                            </MenubarItem>
                            <MenubarItem onClick={() => showUploadFolderModal()}>
                                <FolderUp className="w-4 h-4 mr-2" /> Upload Folder
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={() => reload()}>
                                <RefreshCcw className="w-4 h-4 mr-2" /> Reload Entities
                            </MenubarItem>
                            <MenubarItem onClick={showGlobalSearchModal}>
                                <Search className="w-4 h-4 mr-2" /> Search
                                <MenubarShortcut>⌘K</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
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

            <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-2 text-muted-foreground" />
                <button
                    className="w-96 p-2 pl-8 text-left text-muted-foreground border rounded-lg flex items-center justify-between cursor-text"
                    onClick={() => showGlobalSearchModal()}
                >
                    <span>Search for anything...</span>
                    <span className="text-muted-foreground/60 text-sm">⌘K</span>
                </button>
            </div>

            <div className="flex justify-end items-center gap-2">
                <div className="flex items-center mr-6 text-green-500">
                    <Check className="w-4 h-4 mr-2" /> No Issues detected
                </div>

                <Button onClick={toggleTheme} variant="secondary" className="justify-start">
                    {theme.theme === "light" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>
                {/*<Button variant="secondary">*/}
                {/*    <User className="h-4 w-4" />*/}
                {/*</Button>*/}
                <Button variant="secondary">
                    <Cog className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
