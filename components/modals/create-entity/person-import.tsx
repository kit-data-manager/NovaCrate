import React, { useCallback, useContext, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Import, LoaderCircle, TextCursor } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AutoReference } from "@/components/providers/global-modals-provider"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { Error } from "@/components/error"

export function PersonImport({
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
    const { importEntityFromOrcid } = useContext(CrateDataContext)
    const setPropertyValue = useEditorState.useSetPropertyValue()

    const onImportPress = useCallback(async () => {
        try {
            setCreating(true)
            const id = await importEntityFromOrcid(value)
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
    }, [autoReference, importEntityFromOrcid, onProviderCreate, setPropertyValue, value])

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
            <div className="flex justify-center gap-2 items-center mb-6">
                <Button
                    variant={createManually ? "default" : "secondary"}
                    onClick={() => setCreateManually(true)}
                    disabled={creating}
                >
                    <TextCursor className="w-4 h-4 mr-2" /> Create Manually
                </Button>
                or
                <Button
                    variant={createManually ? "secondary" : "default"}
                    onClick={() => setCreateManually(false)}
                    disabled={creating}
                >
                    <Import className="w-4 h-4 mr-2" /> Import from ORCID
                </Button>
            </div>

            {createManually ? null : (
                <>
                    <DialogHeader>
                        <DialogTitle>Import Person from ORCID</DialogTitle>
                        <DialogDescription>
                            Search at{" "}
                            <a
                                href="https://orcid.org/orcid-search/search"
                                target="_blank"
                                className="inline-flex hover:underline"
                            >
                                ORCID.org <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                            . Enter either ORCID ID or URL.
                        </DialogDescription>
                    </DialogHeader>
                    <Error error={error} title="Import failed" />
                    <div>
                        <Label>ORCID URL or Identifier</Label>
                        <Input
                            placeholder="https://orcid.org/..."
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={creating}
                        />
                    </div>
                    <div className="flex justify-between">
                        <Button variant="secondary" onClick={backToTypeSelect} disabled={creating}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>

                        <div className="flex gap-2 items-center">
                            {creating ? <LoaderCircle className="animate-spin w-4 h-4" /> : null}
                            <Button onClick={onImportPress} disabled={creating}>
                                <Import className="w-4 h-4 mr-2" /> Import
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
