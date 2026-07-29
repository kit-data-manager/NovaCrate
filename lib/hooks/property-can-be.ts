import { useEffect, useMemo, useState } from "react"
import {
    SCHEMA_ORG_BOOLEAN,
    SCHEMA_ORG_DATE,
    SCHEMA_ORG_DATE_TIME,
    SCHEMA_ORG_NUMBER,
    SCHEMA_ORG_NUMBERLIKE,
    SCHEMA_ORG_TIME
} from "@/lib/constants"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { DateTime } from "luxon"
import { referenceCheck, textCheck } from "@/lib/utils"
import { PropertyType } from "@/lib/property"
import { useProfileEntityMapping, useProfileService } from "@/lib/hooks/use-profile-service"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"

export type PropertyCanBeResult = {
    canBeTime: boolean | undefined
    canBeBoolean: boolean | undefined
    canBeDateTime: boolean | undefined
    canBeNumber: boolean | undefined
    canBeDate: boolean | undefined
    canBeText: boolean | undefined
    canBeReference: boolean | undefined
    possiblePropertyTypes: PropertyType[]
}

/**
 * Pure (non-hook) implementation of {@link usePropertyCanBe}. Computes which
 * property types a value can take given its allowed range. Use this outside of
 * React components or in places where memoization is handled by the caller.
 *
 * @param propertyRange Allowed ranges. May be {@link SlimClass} objects or bare
 *   URI strings (or a mix). Pass `undefined` to indicate an unconstrained
 *   property (in which case the `canBe*` flags are `undefined`).
 * @param value The current value of the property. When `undefined`, the
 *   value-dependent flags (`canBeTime`, `canBeNumber`, etc.) fall back to
 *   `true` so the caller can decide whether to offer the type.
 */
export function propertyCanBe(
    propertyRange?: SlimClass[] | string[],
    value?: EntitySinglePropertyTypes
): PropertyCanBeResult {
    const range = propertyRange?.map((p) => (typeof p === "object" ? p["@id"] : p))

    const canBeTime =
        range?.includes(SCHEMA_ORG_TIME) &&
        textValueGuard(value, (v) => DateTime.fromISO(v) != null && v[2] === ":", true)

    const canBeBoolean =
        range?.includes(SCHEMA_ORG_BOOLEAN) &&
        textValueGuard(value, (v) => v === "true" || v === "false", true)

    const canBeDateTime =
        range?.includes(SCHEMA_ORG_DATE_TIME) &&
        textValueGuard(
            value,
            (v) => DateTime.fromISO(v) != null && v[4] === "-" && v.includes("T"),
            true
        )

    const canBeNumber = range
        ? (range.includes(SCHEMA_ORG_NUMBER) ||
              SCHEMA_ORG_NUMBERLIKE.find((s) => range.includes(s)) !== undefined) &&
          textValueGuard(value, (v) => !isNaN(parseFloat(v)) && parseFloat(v) + "" === v, true)
        : undefined

    const canBeDate =
        range?.includes(SCHEMA_ORG_DATE) &&
        textValueGuard(
            value,
            (v) => DateTime.fromISO(v) != null && v[4] === "-" && !v.includes("T"),
            true
        )

    const canBeText = textCheck(range)
    const canBeReference = referenceCheck(range)

    const possiblePropertyTypes: PropertyType[] = []
    if (canBeTime) possiblePropertyTypes.push(PropertyType.Time)
    if (canBeNumber) possiblePropertyTypes.push(PropertyType.Number)
    if (canBeDate) possiblePropertyTypes.push(PropertyType.Date)
    if (canBeDateTime) possiblePropertyTypes.push(PropertyType.DateTime)
    if (canBeText) possiblePropertyTypes.push(PropertyType.Text)
    if (canBeBoolean) possiblePropertyTypes.push(PropertyType.Boolean)
    if (canBeReference) possiblePropertyTypes.push(PropertyType.Reference)

    return {
        canBeTime,
        canBeBoolean,
        canBeDateTime,
        canBeNumber,
        canBeDate,
        canBeText,
        canBeReference,
        possiblePropertyTypes
    }
}

export function usePropertyCanBe(
    _propertyRange?: SlimClass[] | string[],
    value?: EntitySinglePropertyTypes
): PropertyCanBeResult {
    return useMemo(() => propertyCanBe(_propertyRange, value), [_propertyRange, value])
}

function textValueGuard(
    value: EntitySinglePropertyTypes | undefined,
    guardedFn: (value: string) => boolean,
    fallback: boolean
) {
    if (typeof value === "undefined") return fallback
    else if (typeof value === "string") return guardedFn(value)
    else return fallback
}

export function useActivePropertyProfileRules(entityId: string, propertyName: string) {
    const profileService = useProfileService()
    const mapping = useProfileEntityMapping(entityId)
    const [propertyRules, setPropertyRules] = useState<PropertyRule[]>([])

    useEffect(() => {
        if (mapping) {
            const newPropertyRules: typeof propertyRules = []
            mapping.forEach(({ profileId, entityRuleId }) => {
                const handler = profileService.getProfileHandler(profileId)
                if (handler) {
                    const rulesOfCurrentHandler = handler.getPropertyRulesFor(entityRuleId)
                    newPropertyRules.push(
                        ...rulesOfCurrentHandler.filter((r) => r.label === propertyName)
                    )
                }
            })
            setPropertyRules(newPropertyRules)
        } else {
            setPropertyRules([])
        }
    }, [mapping, profileService, propertyName])

    return propertyRules
}
