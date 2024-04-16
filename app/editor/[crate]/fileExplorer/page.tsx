import { FileX, Folder, FolderX, Eye, X, Pencil, Trash } from "lucide-react"
import { FileExplorer } from "@/components/file-explorer"
import HelpTooltip from "@/components/help-tooltip"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"

export default function FileExplorerPage() {
    return (
        <div className="h-full">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={33} minSize={15}>
                    <div className="pl-4 bg-accent text-sm h-10 flex items-center gap-2 truncate">
                        <Folder className="w-4 h-4 shrink-0" /> File Explorer
                        <HelpTooltip>
                            <div>
                                The File Explorer lists all files and folders in the RO-Crate. Files
                                that are not described by a Data Entity are marked by{" "}
                                <FolderX className="inline-block w-4 h-4 text-warn" />
                                {" or "}
                                <FileX className="inline-block w-4 h-4 text-warn" />.
                                <div className="mt-6">
                                    <b>Double-Left-Click:</b> Edit/Create Data Entity
                                </div>
                                <div>
                                    <b>Left-Click:</b> Preview File Content (only supported for some
                                    file types)
                                </div>
                                <div>
                                    <b>Right-Click:</b> More Options
                                </div>
                            </div>
                        </HelpTooltip>
                    </div>

                    <FileExplorer />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={67}>
                    <div className="pl-4 bg-accent text-sm h-10 flex items-center gap-2">
                        <Eye className="w-4 h-4 shrink-0" /> File Preview
                        <HelpTooltip>
                            <div>
                                Click on a file in the File Explorer to preview it here. Only
                                supported for some file types.
                            </div>
                        </HelpTooltip>
                    </div>
                    <div className="flex gap-2 sticky top-0 z-10 p-2 bg-accent">
                        <Button size="sm" variant="outline" className="text-xs">
                            <Pencil className={"w-4 h-4 mr-1.5"} /> Edit Entity
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs">
                            <Trash className={"w-4 h-4 mr-1.5"} /> Delete Entity
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                            <X className={"w-4 h-4 mr-1"} /> Close Preview
                        </Button>
                    </div>
                    <object
                        className="w-full h-full"
                        data="https://media.geeksforgeeks.org/wp-content/cdn-uploads/20210101201653/PDF.pdf"
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
