import React, { useCallback, useContext, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Import, LoaderCircle, TextCursor } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { Error } from "@/components/error"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutoReference } from "@/lib/utils"

export function OrganizationImport({
    createManually,
    setCreateManually,
    backToTypeSelect,
    onProviderCreate,
    autoReference
}: {
    createManually: boolean
    setCreateManually: (val: boolean) => void
    backToTypeSelect: () => void
    onProviderCreate: (entity: string) => void
    autoReference?: AutoReference
}) {
    const [value, setValue] = useState("")
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<unknown>()
    const { importOrganizationFromRor } = useContext(CrateDataContext)
    const setPropertyValue = useEditorState((store) => store.setPropertyValue)

    const onImportPress = useCallback(async () => {
        try {
            setCreating(true)
            const id = await importOrganizationFromRor(value)
            if (autoReference) {
                setPropertyValue(
                    autoReference.entityId,
                    autoReference.propertyName,
                    { "@id": id },
                    autoReference.valueIdx
                )
            }
            setCreating(false)
            setError(undefined)
            onProviderCreate(id)
        } catch (e) {
            setCreating(false)
            setError(e)
        }
    }, [autoReference, importOrganizationFromRor, onProviderCreate, setPropertyValue, value])

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                onImportPress().then()
            }
        },
        [onImportPress]
    )

    return (
        <>
            <Tabs
                className="mb-4"
                value={createManually ? "manual" : "import"}
                onValueChange={(v) => {
                    setCreateManually(v === "manual")
                }}
            >
                <TabsList className="flex self-center">
                    <TabsTrigger value="manual">
                        <TextCursor className="size-4 mr-2" /> Create Manually
                    </TabsTrigger>
                    <TabsTrigger value="import">
                        <Import className="size-4 mr-2" /> Import from ROR
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {createManually ? null : (
                <>
                    <DialogHeader>
                        <DialogTitle>Import Organization from ROR</DialogTitle>
                        <DialogDescription>
                            Search at{" "}
                            <a
                                href="https://ror.org/search"
                                target="_blank"
                                className="inline-flex hover:underline"
                            >
                                ROR.org <ExternalLink className="size-4 ml-1" />
                            </a>
                            . Enter either ROR ID or URL.
                        </DialogDescription>
                    </DialogHeader>
                    <Error error={error} title="Import failed" />
                    <div>
                        <Label>ROR URL or Identifier</Label>
                        <Input
                            placeholder="https://ror.org/..."
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={creating}
                        />
                    </div>
                    <div className="flex justify-between">
                        <Button variant="secondary" onClick={backToTypeSelect} disabled={creating}>
                            <ArrowLeft className="size-4 mr-2" /> Back
                        </Button>

                        <div className="flex gap-2 items-center">
                            {creating ? <LoaderCircle className="animate-spin size-4" /> : null}
                            <Button onClick={onImportPress} disabled={creating}>
                                <Import className="size-4 mr-2" /> Import
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
