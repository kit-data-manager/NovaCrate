import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { TypeBadge } from "@/components/modals/create-entity/components/type-badge"
import { ProfileEntityRules } from "@/components/modals/create-entity/hooks/use-profile-entity-rules"

/**
 * Renders the entity rules declared by a single profile as a grid of
 * {@link TypeBadge}s. The profile name is intentionally not shown here — the
 * parent tab label serves as the title. This is the component to extend when
 * implementing richer profile browsing (filtering, search, collapsing, etc.).
 */
export function ProfileTypeSection({
    profile,
    onTypeSelect
}: {
    profile: ProfileEntityRules
    onTypeSelect(value: string | string[], entityRule?: EntityRule): void
}) {
    if (profile.classes.length === 0) return null

    return (
        <div className="grid grid-cols-3 gap-4">
            {profile.classes.map((c: EntityRule) => (
                <TypeBadge
                    key={c["@id"]}
                    type={c.specializationOf || "Thing"}
                    name={c.name || c["@id"]}
                    description={c.description || "No description provided"}
                    onTypeSelect={onTypeSelect}
                    entityRule={c}
                />
            ))}
        </div>
    )
}
