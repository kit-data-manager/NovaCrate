import { Braces, Check, Search } from "lucide-react"
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

export function NavHeader() {
    return (
        <div className="p-4 w-full grid grid-cols-[1fr_auto_1fr] border-b">
            <div className="flex items-center">
                <Braces className="w-6 h-6 mr-2" />
                <div className="mr-6">RO-Crate Editor</div>

                <Menubar>
                    <MenubarMenu>
                        <MenubarTrigger>Crate</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>New</MenubarItem>
                            <MenubarItem>Open</MenubarItem>
                            <MenubarItem>Open Recent</MenubarItem>
                            <MenubarItem>Close</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>Export</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>Share</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>Files</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem>Upload File</MenubarItem>
                            <MenubarItem>Upload Folder</MenubarItem>
                            <MenubarItem>Upload & Unpack</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>View Orphans</MenubarItem>
                            <MenubarItem>View All</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>Entities</MenubarTrigger>
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
                    <MenubarMenu>
                        <MenubarTrigger>Context</MenubarTrigger>
                        <MenubarContent>
                            <MenubarSub>
                                <MenubarSubTrigger>Profile</MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarItem>
                                        <Check className="w-4 h-4 mr-2" /> None
                                    </MenubarItem>
                                </MenubarSubContent>
                            </MenubarSub>
                            <MenubarSeparator />
                            <MenubarItem>Add External Context</MenubarItem>
                            <MenubarItem>Add Custom Definition</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem>View in Settings</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            </div>

            <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-2 text-muted-foreground" />
                <Input
                    className="focus:w-[500px] w-96 pl-8 transition-[width]"
                    placeholder="Search for anything..."
                />
            </div>

            <div className="flex justify-end items-center text-green-500">
                <Check className="w-4 h-4 mr-2" /> No Issues detected
            </div>
        </div>
    )
}
