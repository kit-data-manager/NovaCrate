"use client"

import {
    Check,
    ChevronDown,
    Cog,
    FileUp,
    FolderUp,
    Moon,
    Package,
    Plus,
    RefreshCcw,
    Search,
    Sun
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

export function NavHeader() {
    const theme = useTheme()
    const { showCreateEntityModal, showGlobalSearchModal } = useContext(GlobalModalContext)
    const { reload } = useContext(CrateDataContext)
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
                            <MenubarItem>New</MenubarItem>
                            <MenubarItem>Open</MenubarItem>
                            <MenubarItem>Open Recent</MenubarItem>
                            <MenubarItem>Close</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>Save All</MenubarItem>
                            <MenubarItem>Revert All</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>Export</MenubarItem>
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
                            <MenubarItem>
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
