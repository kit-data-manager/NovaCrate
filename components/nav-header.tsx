"use client"

import { Braces, Check, ChevronDown, Cog, Moon, Search, Sun } from "lucide-react"
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger
} from "@/components/ui/menubar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useCallback } from "react"

export function NavHeader() {
    const theme = useTheme()

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
                <Braces className="w-6 h-6 mr-2" />
                <div className="mr-6">Editor</div>

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
                            <MenubarSeparator />
                            <MenubarItem>Export</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>
                            Files <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        </MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>Add File</MenubarItem>
                            <MenubarItem>Add Folder</MenubarItem>
                            <MenubarItem>Upload & Unpack</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>View All</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>
                            Entities <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                        </MenubarTrigger>
                        <MenubarContent>
                            <MenubarSub>
                                <MenubarSubTrigger>Add</MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarItem>File</MenubarItem>
                                    <MenubarItem>Person</MenubarItem>
                                    <MenubarItem>Organization</MenubarItem>
                                </MenubarSubContent>
                            </MenubarSub>
                            <MenubarItem>Add Custom</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>View All</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            </div>

            <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-2 text-muted-foreground" />
                <Input className="w-96 pl-8" placeholder="Search for anything..." />
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
