import { Download, Eye, Pencil, Trash, X } from "lucide-react"
import HelpTooltip from "@/components/help-tooltip"
import { Button } from "@/components/ui/button"
import { useContext } from "react"
import { FileExplorerContext } from "@/components/file-explorer/context"

export function FilePreview() {
    const { previewingFilePath, setPreviewingFilePath } = useContext(FileExplorerContext)

    return (
        <>
            <div className="pl-4 bg-accent text-sm h-10 flex items-center gap-2">
                <Eye className="w-4 h-4 shrink-0" /> File Preview
                <HelpTooltip>
                    <div>
                        Click on a file in the File Explorer to preview it here. Only supported for
                        some file types.
                    </div>
                </HelpTooltip>
            </div>
            <div className="flex gap-2 sticky top-0 z-10 p-2 bg-accent">
                <Button size="sm" variant="outline" className="text-xs">
                    <Download className={"w-4 h-4 mr-2"} /> Download File
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setPreviewingFilePath("")}
                >
                    <X className={"w-4 h-4 mr-1"} /> Close Preview
                </Button>
            </div>
            {/*<object*/}
            {/*    className="w-full h-full"*/}
            {/*    data="https://media.geeksforgeeks.org/wp-content/cdn-uploads/20210101201653/PDF.pdf"*/}
            {/*/>*/}
            {previewingFilePath}
        </>
    )
}
