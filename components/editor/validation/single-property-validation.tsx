import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import React, { useMemo } from "react"
import { useStore } from "zustand"
import { useShallow } from "zustand/shallow"
import { ValidationResultIcon } from "@/components/editor/validation/validation-result-icon"
import { ValidationResultLine } from "@/components/editor/validation/validation-result-line"
import { sortValidationResultByName } from "@/lib/utils"
import { PanelBottomOpen } from "lucide-react"
import { useEditorState } from "@/lib/state/editor-state"
import { useValidationStore } from "@/lib/validation/hooks"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"
import { validationSettings } from "@/lib/state/validation-settings"

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
                            (res.propertyIndex === undefined && propertyIndex === 0))
                )
                .sort(sortValidationResultByName)
                .sort((a, b) => b.resultSeverity - a.resultSeverity)
        )
    )
    const setShowValidationDrawer = useEditorState((s) => s.setShowValidationDrawer)
    const validationEnabled = useStore(validationSettings, (s) => s.enabled)

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

    if (!validationEnabled) return null

    return (
        <div
            className={`p-1 ${validationResults.length > 0 ? "" : "opacity-0 pointer-events-none"} transition-opacity shrink-0`}
        >
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"ghost"}>
                        <ValidationResultIcon result={highestResultType} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-[600px] max-w-[600px]">
                    <div className="text-xs font-medium p-1 mb-1 flex justify-between">
                        Property Issues
                    </div>
                    {validationResults.length === 0 && (
                        <div className="flex justify-center text-muted-foreground text-xs p-2">
                            No issues found.
                        </div>
                    )}
                    {validationResults.map((res, i) => (
                        <ValidationResultLine result={res} key={i} />
                    ))}
                    <Button
                        variant="ghost"
                        className="w-full -ml-1 mt-2"
                        size="sm"
                        onClick={() => setShowValidationDrawer(true)}
                    >
                        <PanelBottomOpen /> Show Details
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
    )
}
