import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Bug, Cog, Folder, GitFork, Package, PackageSearch, User } from "lucide-react"
import { PropsWithChildren } from "react"

export function NavSidebar({ children }: PropsWithChildren<{}>) {
    return (
        <ResizablePanelGroup direction="horizontal" autoSaveId="globalSidebarLayout">
            <ResizablePanel minSize={10} defaultSize={12}>
                <div className="flex flex-col gap-2 p-2 h-full min-w-52">
                    <Button variant="link" className="justify-start">
                        <Package className="h-4 w-4 mr-2" />
                        Root
                    </Button>
                    <Button variant="link" className="justify-start">
                        <Folder className="h-4 w-4 mr-2" />
                        File Explorer
                    </Button>
                    <Button variant="link" className="justify-start">
                        <GitFork className="h-4 w-4 mr-2" />
                        Graph
                    </Button>
                    <Button variant="link" className="justify-start">
                        <PackageSearch className="h-4 w-4 mr-2" />
                        Entities
                    </Button>
                    <Button variant="link" className="justify-start">
                        <Bug className="h-4 w-4 mr-2" />
                        Validation
                    </Button>

                    <div className="grow"></div>

                    <Button variant="link" className="justify-start justify-self-end">
                        <User className="h-4 w-4 mr-2" />
                        Login
                    </Button>
                    <Button variant="link" className="justify-start justify-self-end">
                        <Cog className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize={50}>{children}</ResizablePanel>
        </ResizablePanelGroup>
    )
}
