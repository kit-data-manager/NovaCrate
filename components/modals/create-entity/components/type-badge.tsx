import { useMemo } from "react"
import { TypeIcon } from "@/components/type-icon"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { useContextResolver } from "@/lib/hooks/hooks"
import { isValidUrl, pickFirst, toArray } from "@/lib/utils"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"

/**
 * A selectable type card. Resolves the (possibly short) type id against the
 * crate context, disables the card when it is not allowed by
 * `restrictToClasses`, and reports the selected value (and an optional profile
 * class) back via `onTypeSelect`.
 *
 * When `profileClass` is supplied it is forwarded to the subsequent UI so the
 * create-entity form can pick up name/description from the profile rule; the
 * `type`/`name`/`description` props still drive what the badge displays.
 */
export function TypeBadge({
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
