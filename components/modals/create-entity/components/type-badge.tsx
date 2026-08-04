import { useMemo } from "react"
import { TypeIcon } from "@/components/type-icon"
import { useContextResolver } from "@/lib/hooks/hooks"
import { isValidUrl, pickFirst, toArray } from "@/lib/utils"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"

/**
 * A selectable type card. Resolves the (possibly short) type id against the
 * crate context, disables the card when it is not allowed by
 * `restrictToClasses`, and reports the selected value (and an optional profile
 * class) back via `onTypeSelect`.
 *
 * When `entityRule` is supplied it is forwarded to the subsequent UI so the
 * create-entity form can pick up name/description from the profile rule; the
 * `type`/`name`/`description` props still drive what the badge displays.
 */
export function TypeBadge({
    description,
    type,
    name,
    onTypeSelect,
    entityRule
}: {
    type: string | string[]
    name?: string
    description: string
    onTypeSelect(value: string | string[], entityRule?: EntityRule): void
    entityRule?: EntityRule
}) {
    const resolver = useContextResolver()

    const revertedTypes = useMemo(() => {
        return toArray(type).map((t) => (isValidUrl(t) ? (resolver.reverse(t) ?? t) : t))
    }, [resolver, type])

    return (
        <div
            className={`p-4 border rounded-lg flex gap-4 hover:bg-secondary cursor-pointer transition`}
            onClick={() => onTypeSelect(revertedTypes, entityRule)}
        >
            <TypeIcon type={pickFirst(revertedTypes)} className="mt-1 w-5 h-5 shrink-0" />
            <div>
                <div className="font-bold">{name || revertedTypes.join(", ")}</div>
                <div className="text-sm">{description}</div>
            </div>
        </div>
    )
}
