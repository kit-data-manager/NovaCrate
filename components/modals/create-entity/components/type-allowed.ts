import { SlimClass } from "@/lib/schema-worker/helpers"
import { IContextResolverService } from "@/lib/core/IContextResolverService"
import { isValidUrl, toArray } from "@/lib/utils"

/**
 * Returns true when a type is selectable under the given `restrictToClasses`.
 * Mirrors the disable logic of {@link TypeBadge}: a type is allowed when there
 * are no restrictions, when it cannot be resolved, or when at least one of its
 * resolved URIs matches an allowed class. Used both inside {@link TypeBadge}
 * (to grey out disallowed cards) and by the simple-type-select tab logic (to
 * hide tabs that contain no allowed suggestions).
 */
export function isTypeAllowed(
    resolver: IContextResolverService,
    type: string | string[],
    restrictToClasses?: SlimClass[]
): boolean {
    if (!restrictToClasses) return true
    const resolvedTypes = toArray(type).map((t) => (isValidUrl(t) ? t : resolver.resolve(t)))
    if (resolvedTypes.filter((t) => t !== null).length === 0) return true
    return restrictToClasses.some((c) =>
        resolvedTypes.some((t) => t !== null && t === c["@id"])
    )
}
