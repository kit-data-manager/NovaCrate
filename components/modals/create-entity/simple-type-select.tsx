import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useMemo } from "react"
import { ExternalLinkIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTypeIcon } from "@/components/type-icon"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { useEditorState } from "@/lib/state/editor-state"

function TypeBadge({
    description,
    type,
    name,
    onTypeSelect,
    restrictToClasses
}: {
    type: string
    name?: string
    description: string
    onTypeSelect(value: string): void
    restrictToClasses?: SlimClass[]
}) {
    const Icon = useTypeIcon(type)
    const context = useEditorState((store) => store.crateContext)

    const resolvedType = useMemo(() => {
        return context.resolve(type)
    }, [context, type])

    const disabled = useMemo(() => {
        return (
            resolvedType &&
            restrictToClasses &&
            !restrictToClasses.find((c) => c["@id"] === resolvedType)
        )
    }, [resolvedType, restrictToClasses])

    return (
        <div
            className={`p-4 border rounded-lg flex gap-4 hover:bg-secondary cursor-pointer transition ${disabled ? "opacity-30 cursor-not-allowed pointer-events-none" : ""}`}
            onClick={() => (disabled ? "" : onTypeSelect(type))}
        >
            <Icon className="mt-1 w-5 h-5 shrink-0" />
            <div>
                <div className="font-bold">{name || type}</div>
                <div className="text-sm">{description}</div>
            </div>
        </div>
    )
}

export function SimpleTypeSelect({
    onTypeSelect,
    setFullTypeBrowser,
    onOpenChange,
    restrictToClasses
}: {
    onTypeSelect(value: string): void
    setFullTypeBrowser(open: boolean): void
    onOpenChange(open: boolean): void
    restrictToClasses?: SlimClass[]
}) {
    return (
        <>
            <DialogHeader>
                <DialogTitle>Create a new Entity</DialogTitle>

                <DialogDescription>
                    Select the type of the entity you want to create. If you want to add a file or
                    folder to the Crate, choose the appropriate Data Entity Type. If you want to add
                    some contextual information to your crate, simply choose a matching contextual
                    entity or open the full type browser at the bottom.
                </DialogDescription>
            </DialogHeader>

            <div className="text-lg font-bold">Data Entities</div>
            <div className="grid grid-cols-3 gap-4">
                <TypeBadge
                    type="File"
                    name="File"
                    description="Import a new single file into the Crate and create a data entity for it"
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
                <TypeBadge
                    type="Dataset"
                    name="Folder"
                    description="Import a folder, including the contained files into the Crate and create data entities for it"
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
            </div>
            <div className="text-lg font-bold">Contextual Entities</div>
            <div className="grid grid-cols-3 gap-4">
                <TypeBadge
                    type="Person"
                    description="Use this contextual entity to describe a person (alive, dead, undead, or fictional). "
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
                <TypeBadge
                    type="Organization"
                    description="An organization such as a school, NGO, corporation, club, etc."
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
                <TypeBadge
                    type="Place"
                    description="Describes a (more or less fixed) physical location."
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
                <TypeBadge
                    type="ScholarlyArticle"
                    name="Scholarly Article"
                    description="A scholarly article that is referenced/used but not included in the Crate"
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
                <TypeBadge
                    type="CreativeWork"
                    name="Creative Work"
                    description="The most generic kind of creative work, including books, movies, photographs, software programs, etc."
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
                <TypeBadge
                    type="ContactPoint"
                    name="Contact Information"
                    description="A contact point — for example, contact information for a person or a Customer Complaints department."
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
            </div>

            <div className="text-sm text-muted-foreground">
                Descriptions based on{" "}
                <a
                    target="_blank"
                    href="https://schema.org/"
                    className="hover:underline inline-flex"
                >
                    Schema.org <ExternalLinkIcon className="w-3 h-3" />
                </a>{" "}
                Type Descriptions
            </div>

            <div className="flex justify-between">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                    Close
                </Button>
                <Button variant="secondary" onClick={() => setFullTypeBrowser(true)}>
                    <Search className="size-4 mr-2" /> Browse all Types
                </Button>
            </div>
        </>
    )
}
