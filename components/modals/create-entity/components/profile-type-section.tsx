import { SlimClass } from "@/lib/schema-worker/helpers"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { TypeBadge } from "@/components/modals/create-entity/components/type-badge"
import { ProfileClassRules } from "@/components/modals/create-entity/hooks/use-profile-class-rules"

/**
 * Renders the entity rules declared by a single profile as a grid of
 * {@link TypeBadge}s. This is the component to extend when implementing richer
 * profile browsing (filtering, search, collapsing, etc.).
 */
export function ProfileTypeSection({
    profile,
    onTypeSelect,
    restrictToClasses
}: {
    profile: ProfileClassRules
    onTypeSelect(value: string | string[], profileClass?: EntityRule): void
    restrictToClasses?: SlimClass[]
}) {
    if (profile.classes.length === 0) return null

    return (
        <div>
            <div className="text-lg font-bold">{profile.profileName}</div>
            <div className="grid grid-cols-3 gap-4">
                {profile.classes.map((c: EntityRule) => (
                    <TypeBadge
                        key={c["@id"]}
                        type={c.specializationOf || "Thing"}
                        name={c.name || c["@id"]}
                        description={c.description || "No description provided"}
                        onTypeSelect={onTypeSelect}
                        restrictToClasses={restrictToClasses}
                        profileClass={c}
                    />
                ))}
            </div>
        </div>
    )
}
