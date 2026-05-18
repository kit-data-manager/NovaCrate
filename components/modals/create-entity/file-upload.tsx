import { File, Globe, HardDrive } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import React from "react"
import { Button } from "@/components/ui/button"
import prettyBytes from "pretty-bytes"
import { usePersistence } from "@/components/providers/persistence-provider"

// TODO integrate
export function FileUpload(props: {
    externalResource: boolean
    onValueChange: (v: string) => void
    onClick: () => void
    files: File[]
}) {
    const fileService = usePersistence().getCrateService()?.getFileService()

    return (
        <div>
            <Tabs
                className="mb-4"
                value={props.externalResource ? "without-file" : "with-file"}
                onValueChange={props.onValueChange}
            >
                <TabsList className="flex self-center">
                    <TabsTrigger value="with-file">
                        <HardDrive className="size-4" /> Local File
                    </TabsTrigger>
                    <TabsTrigger value="without-file">
                        <Globe className="size-4" /> Web Resource
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            {props.externalResource ? null : fileService ? (
                <>
                    <Label>File</Label>
                    <div>
                        <Button
                            className="min-w-0 max-w-full truncate"
                            variant="outline"
                            onClick={props.onClick}
                        >
                            <File className="size-4 mr-2 shrink-0" />
                            <span className="truncate min-w-0">
                                {props.files.length == 0 ? "Select File" : props.files[0].name}
                            </span>
                        </Button>
                        <span className="ml-2 text-muted-foreground">
                            {props.files.length == 0 ? "" : prettyBytes(props.files[0].size)}
                        </span>
                    </div>
                </>
            ) : (
                <div>File uploads are disabled.</div>
            )}
        </div>
    )
}
