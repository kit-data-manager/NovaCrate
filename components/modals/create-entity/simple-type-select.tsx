import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useMemo } from "react"
import { ExternalLinkIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TypeIcon } from "@/components/type-icon"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { useContextResolver } from "@/lib/hooks/hooks"
import { useCore } from "@/components/providers/core-provider"
import { isValidUrl, pickFirst, toArray } from "@/lib/utils"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"

function TypeBadge({
    description,
    type,
    name,
    onTypeSelect,
    restrictToClasses,
    profileClass
}: {
    type: string | string[]
    name?: string
    description: string
    onTypeSelect(value: string | string[], profileClass?: EntityRule): void
    restrictToClasses?: SlimClass[]
    /**
     * Only used for reporting the selected profile class to the subsequent UI; type, name and description are used for the badge
     */
    profileClass?: EntityRule
}) {
    const resolver = useContextResolver()

    const resolvedTypes = useMemo(() => {
        return toArray(type).map((t) => (isValidUrl(t) ? t : resolver.resolve(t)))
    }, [resolver, type])

    const revertedTypes = useMemo(() => {
        return toArray(type).map((t) => (isValidUrl(t) ? (resolver.reverse(t) ?? t) : t))
    }, [resolver, type])

    const disabled = useMemo(() => {
        return (
            resolvedTypes.filter((t) => t !== null).length > 0 &&
            restrictToClasses &&
            !restrictToClasses.find((c) => resolvedTypes.some((t) => t !== null && t === c["@id"]))
        )
    }, [resolvedTypes, restrictToClasses])

    console.log(revertedTypes)

    return (
        <div
            className={`p-4 border rounded-lg flex gap-4 hover:bg-secondary cursor-pointer transition ${disabled ? "opacity-30 cursor-not-allowed pointer-events-none" : ""}`}
            onClick={() => (disabled ? "" : onTypeSelect(revertedTypes, profileClass))}
        >
            <TypeIcon type={pickFirst(revertedTypes)} className="mt-1 w-5 h-5 shrink-0" />
            <div>
                <div className="font-bold">{name || revertedTypes.join(", ")}</div>
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
    onTypeSelect(value: string | string[], profileClass: EntityRule): void
    setFullTypeBrowser(open: boolean): void
    onOpenChange(open: boolean): void
    restrictToClasses?: SlimClass[]
}) {
    const profile = useCore().getProfileService()

    const profileClassRules = useMemo(() => {
        return profile
            .getProfileHandlers()
            .map((p) => {
                const def = p.getDefinition()
                return {
                    id: p.id,
                    profileName: p.name,
                    classes: def ? def.entityRules : []
                }
            })
            .flat()
    }, [profile])

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

            {profileClassRules.map((profile) => (
                <div key={profile.id}>
                    <div className="text-lg font-bold">{profile.profileName}</div>
                    <div className="grid grid-cols-3 gap-4">
                        {profile.classes.map((c) => (
                            <TypeBadge
                                key={c["@id"]}
                                type={c.specializationOf || "Thing"} // TODO is Thing the right fallback?
                                name={c.name || c["@id"]}
                                description={c.description || "No description provided"}
                                onTypeSelect={onTypeSelect}
                                restrictToClasses={restrictToClasses}
                                profileClass={c}
                            />
                        ))}
                    </div>
                </div>
            ))}

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
