import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import React, { useMemo } from "react"
import { useValidationStore, ValidationResultSeverity } from "@/lib/validation/ValidationProvider"
import { useStore } from "zustand/index"
import { useShallow } from "zustand/react/shallow"
import { ValidationResultIcon } from "@/components/editor/validation/validation-result-icon"
import { ValidationResultLine } from "@/components/editor/validation/validation-result-line"

export function SinglePropertyValidation({
    propertyName,
    entityId,
    propertyIndex
}: {
    propertyName: string
    propertyIndex: number
    entityId: string
}) {
    const validationStore = useValidationStore()
    const validationResults = useStore(
        validationStore,
        useShallow((s) =>
            s.results
                .filter(
                    (res) =>
                        res.entityId === entityId &&
                        res.propertyName === propertyName &&
                        (res.propertyIndex === propertyIndex ||
                            (!res.propertyIndex && propertyIndex === 0))
                )
                .sort((a, b) => b.resultSeverity - a.resultSeverity)
        )
    )

    const highestResultType = useMemo(() => {
        return (
            validationResults.find(
                (res) => res.resultSeverity === ValidationResultSeverity.error
            ) ??
            validationResults.find(
                (res) => res.resultSeverity === ValidationResultSeverity.warning
            ) ??
            validationResults.find(
                (res) => res.resultSeverity === ValidationResultSeverity.softWarning
            ) ??
            validationResults.find((res) => res.resultSeverity === ValidationResultSeverity.info)
        )
    }, [validationResults])

    return (
        <div
            className={`p-1 ${validationResults.length > 0 ? "" : "opacity-0 pointer-events-none"}`}
        >
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"ghost"}>
                        <ValidationResultIcon result={highestResultType} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-[600px] max-w-[600px]">
                    <div className="text-xs font-medium p-1 mb-1">Issues</div>
                    {validationResults.map((res, i) => (
                        <ValidationResultLine result={res} key={i} />
                    ))}
                </PopoverContent>
            </Popover>
        </div>
    )
}
