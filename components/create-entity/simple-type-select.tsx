import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React from "react"
import {
    BookMarked,
    Building,
    Contact,
    File,
    FolderOpen,
    GraduationCap,
    LucideIcon,
    MapPin,
    Search,
    User
} from "lucide-react"
import { Button } from "@/components/ui/button"

function TypeBadge({
    description,
    type,
    Icon,
    name,
    onTypeSelect
}: {
    type: string
    name?: string
    description: string
    Icon: LucideIcon
    onTypeSelect(value: string): void
}) {
    return (
        <div
            className="p-4 border rounded-lg flex gap-4 hover:bg-secondary cursor-pointer transition"
            onClick={() => onTypeSelect(type)}
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
    onOpenChange
}: {
    onTypeSelect(value: string): void
    setFullTypeBrowser(open: boolean): void
    onOpenChange(open: boolean): void
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
                    Icon={File}
                    onTypeSelect={onTypeSelect}
                />
                <TypeBadge
                    type="Dataset"
                    name="Folder"
                    description="Import a folder, including the contained files into the Crate and create data entities for it"
                    Icon={FolderOpen}
                    onTypeSelect={onTypeSelect}
                />
            </div>
            <div className="text-lg font-bold">Contextual Entities</div>
            <div className="grid grid-cols-3 gap-4">
                <TypeBadge
                    type="Person"
                    description="Use this contextual entity to describe a person (alive, dead, undead, or fictional). "
                    Icon={User}
                    onTypeSelect={onTypeSelect}
                />
                <TypeBadge
                    type="Organization"
                    description="An organization such as a school, NGO, corporation, club, etc."
                    Icon={Building}
                    onTypeSelect={onTypeSelect}
                />
                <TypeBadge
                    type="Place"
                    description="Describes a (more or less fixed) physical location."
                    Icon={MapPin}
                    onTypeSelect={onTypeSelect}
                />
                <TypeBadge
                    type="ScholarlyArticle"
                    name="Scholarly Article"
                    description="A scholarly article that is referenced/used but not included in the Crate"
                    Icon={GraduationCap}
                    onTypeSelect={onTypeSelect}
                />
                <TypeBadge
                    type="CreativeWork"
                    name="Creative Work"
                    description="The most generic kind of creative work, including books, movies, photographs, software programs, etc."
                    Icon={BookMarked}
                    onTypeSelect={onTypeSelect}
                />
                <TypeBadge
                    type="ContactPoint"
                    name="Contact Information"
                    description="A contact point — for example, contact information for a person or a Customer Complaints department."
                    Icon={Contact}
                    onTypeSelect={onTypeSelect}
                />
            </div>

            <div className="text-sm text-muted-foreground">
                Descriptions based on{" "}
                <a target="_blank" href="https://schema.org/" className="underline">
                    Schema.org
                </a>{" "}
                Type Descriptions
            </div>

            <div className="flex justify-between">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                    Close
                </Button>
                <Button variant="secondary" onClick={() => setFullTypeBrowser(true)}>
                    <Search className="w-4 h-4 mr-2" /> Browse all Types
                </Button>
            </div>
        </>
    )
}
