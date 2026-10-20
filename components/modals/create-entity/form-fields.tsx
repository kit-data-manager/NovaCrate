import React, { ChangeEvent, useId } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Globe, HardDrive, Plus, TriangleAlert } from "lucide-react"
import { camelCaseReadable, hasAtLeastOneValue, pickFirst } from "@/lib/utils"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import HelpTooltip from "@/components/help-tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MarkdownComment } from "@/components/markdown-comment"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"

export type CreateEntityVariant = "contextual" | "file" | "folder"

/**
 * Shared dialog header for the create-entity forms. Renders the entity-rule
 * description (if the entity is created from a profile) followed by the variant
 * specific description text.
 */
export function CreateEntityHeader({
    selectedType,
    entityRule,
    variant,
    forceId
}: {
    selectedType: string | string[]
    entityRule?: EntityRule
    variant: CreateEntityVariant
    forceId?: string
}) {
    return (
        <DialogHeader>
            <DialogTitle>
                Create a new{" "}
                {entityRule && entityRule.name
                    ? entityRule.name
                    : hasAtLeastOneValue(selectedType)
                      ? camelCaseReadable(pickFirst(selectedType))
                      : "Unknown"}{" "}
                Entity
            </DialogTitle>

            <DialogDescription asChild={true}>
                <div>
                    {entityRule && entityRule.description && (
                        <div className="mb-2 max-h-52 overflow-auto">
                            <MarkdownComment comment={entityRule.description} allowLinks />
                        </div>
                    )}

                    {variant === "contextual" ? (
                        <>
                            Enter a name for the entity.{" "}
                            {forceId
                                ? ""
                                : `An ID will be generated.
                            You can also change the ID.`}{" "}
                            Press Create to start adding Properties.
                        </>
                    ) : null}

                    {variant === "file" ? (
                        <>
                            Add a file to the Crate. Use the File Explorer to upload the file to a
                            specific folder. This will import the File into the Crate and also
                            create a corresponding Data Entity.
                        </>
                    ) : null}

                    {variant === "folder" ? (
                        <>
                            Add a folder to the Crate. If you want to create an empty folder, select
                            Empty Folder and enter a name of your choice. Otherwise, the folder and
                            all contained files and folders will be uploaded.
                        </>
                    ) : null}
                </div>
            </DialogDescription>
        </DialogHeader>
    )
}

export function NameField({
    value,
    onChange,
    onKeyDown,
    placeholder
}: {
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    placeholder?: string
}) {
    const id = useId()

    return (
        <div>
            <Label htmlFor={`nameField-${id}`}>
                Name
                <HelpTooltip>
                    Give the entity a human-readable name that tells other humans what this entity
                    describes
                </HelpTooltip>
            </Label>
            <Input
                id={`nameField-${id}`}
                value={value}
                placeholder={placeholder ?? "Entity Name"}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
        </div>
    )
}

export function IdentifierField({
    value,
    onChange,
    externalResource,
    autoId
}: {
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    externalResource: boolean
    autoId: string
}) {
    const id = useId()

    return (
        <div>
            <Label htmlFor={`identifierField-${id}`}>
                {externalResource ? "URL" : "Identifier"}
                <HelpTooltip>
                    The identifier must be unique and persistent. Consider using a PID such as a DOI
                    as the identifier. In most cases, a locally unique ID is automatically generated
                    for you.
                </HelpTooltip>
            </Label>
            <Input
                id={`identifierField-${id}`}
                placeholder={
                    externalResource ? "https://..." : autoId || "Unique and persistent identifier"
                }
                value={value}
                onChange={onChange}
            />
        </div>
    )
}

/**
 * Tabs to switch between a local upload and a web-based (external) resource.
 * The label of the "local" tab depends on the variant ("Local File" vs "Local Folder").
 */
export function ResourceSourceTabs({
    value,
    onChange,
    variant
}: {
    value: boolean
    onChange: (external: boolean) => void
    variant: "file" | "folder"
}) {
    return (
        <Tabs
            className="mb-4"
            value={value ? "without-file" : "with-file"}
            onValueChange={(v) => onChange(v === "without-file")}
        >
            <TabsList className="flex self-center">
                <TabsTrigger value="with-file">
                    <HardDrive className="size-4" />
                    {variant === "file" ? "Local File" : "Local Folder"}
                </TabsTrigger>
                <TabsTrigger value="without-file">
                    <Globe className="size-4" /> Web Resource
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}

export function UrlInvalidAlert({ show }: { show: boolean }) {
    if (!show) return null
    return (
        <Alert className="text-warn border-warn/40">
            <TriangleAlert />
            <AlertTitle>The provided URL is invalid.</AlertTitle>
            <AlertDescription>
                Make sure the URL is properly formatted, including the protocol. Example:
                https://doi.org/example.pid
            </AlertDescription>
        </Alert>
    )
}

export function ActionBar({
    onBack,
    onCreate,
    createDisabled
}: {
    onBack: () => void
    onCreate: () => void
    createDisabled: boolean
}) {
    return (
        <div className="mt-2 flex justify-between">
            <Button variant="secondary" onClick={onBack}>
                <ArrowLeft className="size-4 mr-2" /> Back
            </Button>
            <Button onClick={onCreate} disabled={createDisabled}>
                <Plus className="size-4 mr-2" />
                Create
            </Button>
        </div>
    )
}
