import React, { useMemo } from "react"
import { CircleAlert, InfoIcon, TriangleAlert } from "lucide-react"
import { ValidationResult, ValidationResultSeverity } from "@/lib/validation/validation-result"

export function ValidationResultIcon({ result }: { result: ValidationResult | undefined }) {
    return useMemo(() => {
        if (!result)
            return <InfoIcon className="size-4 fill-info [&_circle]:stroke-info shrink-0" />
        if (result.resultSeverity === ValidationResultSeverity.error)
            return <CircleAlert className="size-4 fill-error [&_circle]:stroke-error shrink-0" />
        if (result.resultSeverity === ValidationResultSeverity.warning)
            return (
                <TriangleAlert className="size-4 fill-warn [&_path:nth-child(1)]:stroke-warn shrink-0" />
            )
        if (result.resultSeverity === ValidationResultSeverity.softWarning)
            return (
                <TriangleAlert className="size-4 fill-warn [&_path:nth-child(1)]:stroke-warn opacity-40 shrink-0" />
            )
        if (result.resultSeverity === ValidationResultSeverity.info)
            return <InfoIcon className="size-4 fill-info [&_circle]:stroke-info shrink-0" />
        return <InfoIcon className="size-4 fill-info [&_circle]:stroke-info shrink-0" />
    }, [result])
}
