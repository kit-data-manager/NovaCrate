import { ExternalLinkIcon } from "lucide-react"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { TypeBadge } from "@/components/modals/create-entity/components/type-badge"
import {
    SUGGESTED_CONTEXTUAL_ENTITIES,
    SUGGESTED_DATA_ENTITIES
} from "@/components/modals/create-entity/data/suggested-types"
import { isTypeAllowed } from "@/components/modals/create-entity/components/type-allowed"
import { useContextResolver } from "@/lib/hooks/hooks"

/**
 * Content of the "General" tab: the curated data-entity and contextual-entity
 * recommendations, each in its own labelled grid. Profile-defined rules live
 * in their own tabs.
 */
export function SuggestedTypesSection({
    onTypeSelect,
    restrictToClasses
}: {
    onTypeSelect(value: string | string[], entityRule?: EntityRule): void
    restrictToClasses?: SlimClass[]
}) {
    const resolver = useContextResolver()

    return (
        <div className="space-y-4">
            <div>
                <div className="text-lg font-bold">Data Entities</div>
                <div className="grid grid-cols-3 gap-4">
                    {SUGGESTED_DATA_ENTITIES.filter((suggested) =>
                        isTypeAllowed(resolver, suggested.type, restrictToClasses)
                    ).map((suggested) => (
                        <TypeBadge
                            key={suggested.type as string}
                            type={suggested.type}
                            name={suggested.name}
                            description={suggested.description}
                            onTypeSelect={onTypeSelect}
                        />
                    ))}
                </div>
            </div>
            <div>
                <div className="text-lg font-bold">Contextual Entities</div>
                <div className="grid grid-cols-3 gap-4">
                    {SUGGESTED_CONTEXTUAL_ENTITIES.filter((suggested) =>
                        isTypeAllowed(resolver, suggested.type, restrictToClasses)
                    ).map((suggested) => (
                        <TypeBadge
                            key={suggested.type as string}
                            type={suggested.type}
                            name={suggested.name}
                            description={suggested.description}
                            onTypeSelect={onTypeSelect}
                        />
                    ))}
                </div>
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
        </div>
    )
}
