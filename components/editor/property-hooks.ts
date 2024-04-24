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
import { SlimClass } from "@/lib/crate-verify/helpers"

function isNoneOf(value: string, of: string[]) {
    return of.find((s) => s === value) === undefined
}

export function usePropertyCanBe(_propertyRange?: SlimClass[] | string[]) {
    const propertyRange = useMemo(() => {
        return _propertyRange?.map((p) => (typeof p === "object" ? p["@id"] : p))
    }, [_propertyRange])

    const canBeTime = useMemo(() => {
        return propertyRange?.includes(SCHEMA_ORG_TIME)
    }, [propertyRange])

    const canBeBoolean = useMemo(() => {
        return propertyRange?.includes(SCHEMA_ORG_BOOLEAN)
    }, [propertyRange])

    const canBeDateTime = useMemo(() => {
        return propertyRange?.includes(SCHEMA_ORG_DATE_TIME)
    }, [propertyRange])

    const canBeNumber = useMemo(() => {
        return propertyRange
            ? propertyRange.includes(SCHEMA_ORG_NUMBER) ||
                  SCHEMA_ORG_NUMBERLIKE.find((s) => propertyRange.includes(s))
            : undefined
    }, [propertyRange])

    const canBeDate = useMemo(() => {
        return propertyRange?.includes(SCHEMA_ORG_DATE)
    }, [propertyRange])

    const canBeText = useMemo(() => {
        return propertyRange
            ? propertyRange.length === 0 ||
                  propertyRange.includes(SCHEMA_ORG_TEXT) ||
                  SCHEMA_ORG_TEXTLIKE.find((s) => propertyRange.includes(s))
            : undefined
    }, [propertyRange])

    const canBeReference = useMemo(() => {
        return propertyRange
            ? propertyRange.length === 0 ||
                  propertyRange.filter((s) =>
                      isNoneOf(
                          s,
                          [
                              SCHEMA_ORG_TIME,
                              SCHEMA_ORG_BOOLEAN,
                              SCHEMA_ORG_DATE_TIME,
                              SCHEMA_ORG_NUMBER,
                              SCHEMA_ORG_DATE,
                              SCHEMA_ORG_TEXT,
                              SCHEMA_ORG_NUMBERLIKE,
                              SCHEMA_ORG_TEXTLIKE
                          ].flat()
                      )
                  ).length > 0
            : undefined
    }, [propertyRange])

    return {
        canBeTime,
        canBeBoolean,
        canBeDateTime,
        canBeNumber,
        canBeDate,
        canBeText,
        canBeReference
    }
}
