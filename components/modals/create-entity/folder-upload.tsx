import { Folder, FolderDot, Globe, HardDrive } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import prettyBytes from "pretty-bytes"
import React from "react"
import { useCrateServiceFeatureFlags } from "@/lib/hooks"

export function FolderUpload(props: {
    externalResource: boolean
    onValueChange: (v: string) => void
    emptyFolder: boolean
    onClickSelectFolder: () => void
    files: File[]
    baseFileName: string | undefined
    onClickEmptyFolder: () => void
}) {
    const flags = useCrateServiceFeatureFlags()

    return (
        <div>
            <Tabs
                className="mb-4"
                value={props.externalResource ? "without-file" : "with-file"}
                onValueChange={props.onValueChange}
            >
                <TabsList className="flex self-center">
                    <TabsTrigger value="with-file">
                        <HardDrive className="size-4" /> Local Folder
                    </TabsTrigger>
                    <TabsTrigger value="without-file">
                        <Globe className="size-4" /> Web Resource
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            {props.externalResource ? null : flags?.fileManagement ? (
                <>
                    <Label>Folder</Label>
                    <div className="flex items-center">
                        {!props.emptyFolder ? (
                            <Button
                                className="min-w-0 max-w-full truncate shrink"
                                variant="outline"
                                onClick={props.onClickSelectFolder}
                            >
                                <Folder className="size-4 mr-2" />
                                <span className={"truncate min-w-0"}>
                                    {props.files.length == 0
                                        ? "Select Folder"
                                        : props.files[0].webkitRelativePath.split("/")[0]}
                                </span>
                            </Button>
                        ) : null}
                        {props.baseFileName || props.emptyFolder ? null : (
                            <span className="m-2 text-muted-foreground">or</span>
                        )}
                        {props.baseFileName ? null : (
                            <Button
                                variant={props.emptyFolder ? "default" : "outline"}
                                onClick={props.onClickEmptyFolder}
                            >
                                <FolderDot className="size-4 mr-2" />
                                Empty Folder
                            </Button>
                        )}
                        <span className="ml-2 text-muted-foreground">
                            {props.files.length == 0
                                ? ""
                                : `${props.files.length} files (${prettyBytes(props.files.map((f) => f.size).reduce((a, b) => a + b))} total)`}
                        </span>
                    </div>
                </>
            ) : (
                <div>Folder uploads are disabled.</div>
            )}
        </div>
    )
}
