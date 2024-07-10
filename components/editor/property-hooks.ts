import { useMemo } from "react"
import {
    SCHEMA_ORG_BOOLEAN,
    SCHEMA_ORG_DATE,
    SCHEMA_ORG_DATE_TIME,
    SCHEMA_ORG_NUMBER,
    SCHEMA_ORG_NUMBERLIKE,
    SCHEMA_ORG_TEXT,
    SCHEMA_ORG_TEXTLIKE,
    SCHEMA_ORG_TIME
} from "@/lib/constants"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { DateTime } from "luxon"
import { referenceCheck } from "@/lib/utils"

export function usePropertyCanBe(
    _propertyRange?: SlimClass[] | string[],
    value?: EntitySinglePropertyTypes
) {
    const propertyRange = useMemo(() => {
        return _propertyRange?.map((p) => (typeof p === "object" ? p["@id"] : p))
    }, [_propertyRange])

    const canBeTime = useMemo(() => {
        return (
            propertyRange?.includes(SCHEMA_ORG_TIME) &&
            textValueGuard(value, (v) => DateTime.fromISO(v) != null && v[2] === ":", true)
        )
    }, [propertyRange, value])

    const canBeBoolean = useMemo(() => {
        return (
            propertyRange?.includes(SCHEMA_ORG_BOOLEAN) &&
            textValueGuard(value, (v) => v === "true" || v === "false", true)
        )
    }, [propertyRange, value])

    const canBeDateTime = useMemo(() => {
        return (
            propertyRange?.includes(SCHEMA_ORG_DATE_TIME) &&
            textValueGuard(
                value,
                (v) => DateTime.fromISO(v) != null && v[4] === "-" && v.includes("T"),
                true
            )
        )
    }, [propertyRange, value])

    const canBeNumber = useMemo(() => {
        return propertyRange
            ? propertyRange.includes(SCHEMA_ORG_NUMBER) ||
                  SCHEMA_ORG_NUMBERLIKE.find((s) => propertyRange.includes(s)) !== undefined
            : undefined
    }, [propertyRange])

    const canBeDate = useMemo(() => {
        return (
            propertyRange?.includes(SCHEMA_ORG_DATE) &&
            textValueGuard(
                value,
                (v) => DateTime.fromISO(v) != null && v[4] === "-" && !v.includes("T"),
                true
            )
        )
    }, [propertyRange, value])

    const canBeText = useMemo(() => {
        return propertyRange
            ? propertyRange.length === 0 ||
                  propertyRange.includes(SCHEMA_ORG_TEXT) ||
                  SCHEMA_ORG_TEXTLIKE.find((s) => propertyRange.includes(s)) !== undefined // ||
            : // canBeTime ||
              // canBeBoolean ||
              // canBeDate ||
              // canBeDateTime ||
              // canBeNumber
              undefined
    }, [propertyRange])

    const canBeReference = useMemo(() => {
        return referenceCheck(propertyRange)
    }, [propertyRange])

    const possiblePropertyTypes = useMemo(() => {
        const types: PropertyEditorTypes[] = []
        if (canBeTime) types.push(PropertyEditorTypes.Time)
        if (canBeNumber) types.push(PropertyEditorTypes.Number)
        if (canBeDate) types.push(PropertyEditorTypes.Date)
        if (canBeDateTime) types.push(PropertyEditorTypes.DateTime)
        if (canBeText) types.push(PropertyEditorTypes.Text)
        if (canBeBoolean) types.push(PropertyEditorTypes.Boolean)
        if (canBeReference) types.push(PropertyEditorTypes.Reference)
        return types
    }, [canBeBoolean, canBeDate, canBeDateTime, canBeNumber, canBeReference, canBeText, canBeTime])

    return useMemo(
        () => ({
            canBeTime,
            canBeBoolean,
            canBeDateTime,
            canBeNumber,
            canBeDate,
            canBeText,
            canBeReference,
            possiblePropertyTypes
        }),
        [
            canBeBoolean,
            canBeDate,
            canBeDateTime,
            canBeNumber,
            canBeReference,
            canBeText,
            canBeTime,
            possiblePropertyTypes
        ]
    )
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
