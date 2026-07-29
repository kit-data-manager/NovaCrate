import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLinkIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { TypeBadge } from "@/components/modals/create-entity/components/type-badge"
import { ProfileTypeSection } from "@/components/modals/create-entity/components/profile-type-section"
import { useProfileClassRules } from "@/components/modals/create-entity/hooks/use-profile-class-rules"
import {
    SUGGESTED_CONTEXTUAL_ENTITIES,
    SUGGESTED_DATA_ENTITIES
} from "@/components/modals/create-entity/data/suggested-types"

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
    const profileClassRules = useProfileClassRules()

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
                <ProfileTypeSection
                    key={profile.id}
                    profile={profile}
                    onTypeSelect={onTypeSelect}
                    restrictToClasses={restrictToClasses}
                />
            ))}

            <div className="text-lg font-bold">Data Entities</div>
            <div className="grid grid-cols-3 gap-4">
                {SUGGESTED_DATA_ENTITIES.map((suggested) => (
                    <TypeBadge
                        key={suggested.type as string}
                        type={suggested.type}
                        name={suggested.name}
                        description={suggested.description}
                        onTypeSelect={onTypeSelect}
                        restrictToClasses={restrictToClasses}
                    />
                ))}
            </div>
            <div className="text-lg font-bold">Contextual Entities</div>
            <div className="grid grid-cols-3 gap-4">
                {SUGGESTED_CONTEXTUAL_ENTITIES.map((suggested) => (
                    <TypeBadge
                        key={suggested.type as string}
                        type={suggested.type}
                        name={suggested.name}
                        description={suggested.description}
                        onTypeSelect={onTypeSelect}
                        restrictToClasses={restrictToClasses}
                    />
                ))}
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
