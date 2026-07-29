import React, { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Import, LoaderCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEditorState } from "@/lib/state/editor-state"
import { Error } from "@/components/error"
import { AutoReference, toArray } from "@/lib/utils"

/**
 * Generic import-from-external-source form. Renders just the import UI
 * (header, input, back/import buttons) — the manual/provider tab switching is
 * owned by the parent {@link CreateProviders}. Add new providers by supplying
 * another configuration object there.
 */
export function EntityImport({
    importFn,
    title,
    searchUrl,
    searchLabel,
    inputLabel,
    placeholder,
    descriptionSuffix,
    backToTypeSelect,
    onProviderCreate,
    autoReference
}: {
    importFn: (value: string) => Promise<IEntity>
    title: string
    searchUrl: string
    searchLabel: string
    inputLabel: string
    placeholder: string
    descriptionSuffix: string
    backToTypeSelect: () => void
    onProviderCreate: (entity: IEntity) => void
    autoReference?: AutoReference
}) {
    const [value, setValue] = useState("")
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<unknown>()
    const addEntity = useEditorState((store) => store.addEntity)

    const onImportPress = useCallback(async () => {
        try {
            setCreating(true)
            const entity = await importFn(value)
            addEntity(entity["@id"], toArray(entity["@type"]), entity, autoReference)
            setCreating(false)
            setError(undefined)
            onProviderCreate(entity)
        } catch (e) {
            setCreating(false)
            setError(e)
        }
    }, [addEntity, autoReference, importFn, onProviderCreate, value])

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
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    Search at{" "}
                    <a href={searchUrl} target="_blank" className="inline-flex hover:underline">
                        {searchLabel} <ExternalLink className="size-4 ml-1" />
                    </a>
                    . Enter either {descriptionSuffix}.
                </DialogDescription>
            </DialogHeader>
            <Error error={error} title="Import failed" />
            <div>
                <Label>{inputLabel}</Label>
                <Input
                    placeholder={placeholder}
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
    )
}
