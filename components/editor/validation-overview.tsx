import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CircleAlert, InfoIcon, PanelBottomOpen, TriangleAlert } from "lucide-react"
import React, { useMemo } from "react"
import { useStore } from "zustand/index"
import { useShallow } from "zustand/react/shallow"
import { ValidationResultLine } from "@/components/editor/validation/validation-result-line"
import { sortValidationResultByName } from "@/lib/utils"
import { useEditorState } from "@/lib/state/editor-state"
import { useValidationStore } from "@/lib/validation/hooks"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"

export function ValidationOverview({
    entityId,
    validationRunning
}: {
    entityId?: string
    validationRunning?: boolean
}) {
    const validationStore = useValidationStore()
    const validationResults = useStore(
        validationStore,
        useShallow((s) =>
            s.results
                .filter((res) => (entityId ? res.entityId === entityId : true))
                .sort(sortValidationResultByName)
                .sort((a, b) => b.resultSeverity - a.resultSeverity)
        )
    )
    const setShowValidationDrawer = useEditorState((s) => s.setShowValidationDrawer)

    const icon = useMemo(() => {
        const icons = []
        if (validationResults.find((res) => res.resultSeverity === ValidationResultSeverity.error))
            icons.push(<CircleAlert key="error" className="size-4 stroke-error" />)
        if (
            validationResults.find((res) => res.resultSeverity === ValidationResultSeverity.warning)
        )
            icons.push(<TriangleAlert key="warn" className="size-4 stroke-warn" />)
        if (
            validationResults.find(
                (res) => res.resultSeverity === ValidationResultSeverity.softWarning
            )
        )
            icons.push(<TriangleAlert key="soft-warn" className="size-4 stroke-warn opacity-40" />)
        if (validationResults.find((res) => res.resultSeverity === ValidationResultSeverity.info))
            icons.push(<InfoIcon key="info" className="size-4 stroke-info" />)

        return icons
    }, [validationResults])

    return (
        <div
            className={`p-1 ${validationResults.length > 0 ? "" : "opacity-0 pointer-events-none"} ${validationRunning && validationResults.length > 0 ? "opacity-50" : ""} transition-opacity`}
        >
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"}>
                        {validationResults.length} {icon}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 pb-0 pr-0 w-[600px]">
                    <div className="text-xs font-medium p-1 mb-1 flex justify-between">
                        {entityId ? "Entity" : "Crate"} Issues
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-auto p-1"
                            onClick={() => setShowValidationDrawer(true)}
                        >
                            <PanelBottomOpen className="size-3" />
                        </Button>
                    </div>
                    <div className="overflow-y-auto max-h-[400px] pr-2 pb-2">
                        {validationResults.length === 0 && (
                            <div className="flex justify-center text-muted-foreground text-xs p-2">
                                No issues found.
                            </div>
                        )}
                        {validationResults.map((res, i) => (
                            <ValidationResultLine result={res} key={i} showPropertyName />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
