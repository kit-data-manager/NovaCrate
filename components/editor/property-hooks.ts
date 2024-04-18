import { useMemo } from "react"

function isNoneOf(value: string, of: string[]) {
    return of.find((s) => s === value) === undefined
}

export function usePropertyCanBe(propertyRange?: string[]) {
    const canBeTime = useMemo(() => {
        return propertyRange?.includes("Time")
    }, [propertyRange])

    const canBeBoolean = useMemo(() => {
        return propertyRange?.includes("Boolean")
    }, [propertyRange])

    const canBeDateTime = useMemo(() => {
        return propertyRange?.includes("DateTime")
    }, [propertyRange])

    const canBeNumber = useMemo(() => {
        return propertyRange?.includes("Number")
    }, [propertyRange])

    const canBeDate = useMemo(() => {
        return propertyRange?.includes("Date")
    }, [propertyRange])

    const canBeText = useMemo(() => {
        return (
            propertyRange?.includes("Text") ||
            canBeTime ||
            canBeBoolean ||
            canBeDateTime ||
            canBeNumber ||
            canBeDate
        )
    }, [canBeBoolean, canBeDate, canBeDateTime, canBeNumber, canBeTime, propertyRange])

    const canBeReference = useMemo(() => {
        return propertyRange
            ? propertyRange.filter((s) =>
                  isNoneOf(s, ["Time", "Boolean", "DateTime", "Number", "Date", "Text"])
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
