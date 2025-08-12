import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CheckIcon, CircleAlert, InfoIcon, PanelBottomOpen, TriangleAlert } from "lucide-react"
import React, { memo, useEffect, useMemo, useState } from "react"
import { useStore } from "zustand/index"
import { useShallow } from "zustand/react/shallow"
import { ValidationResultLine } from "@/components/editor/validation/validation-result-line"
import { sortValidationResultByName } from "@/lib/utils"
import { useEditorState } from "@/lib/state/editor-state"
import { useValidationStore } from "@/lib/validation/hooks"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"

export const ValidationOverview = memo(function ValidationOverview({
    entityId,
    validationRunning
}: {
    entityId?: string
    validationRunning?: boolean
}) {
    const [initiallyHidden, setInitiallyHidden] = useState(true)

    const validationStore = useValidationStore()
    const validationRanAtLeastOnce = useStore(validationStore, (s) => s.ranAtLeastOnce)
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

    useEffect(() => {
        setInitiallyHidden(!validationRanAtLeastOnce)
    }, [validationRanAtLeastOnce])

    const errorResults = useMemo(() => {
        return validationResults.filter(
            (res) => res.resultSeverity === ValidationResultSeverity.error
        )
    }, [validationResults])

    const warningResults = useMemo(() => {
        return validationResults.filter(
            (res) => res.resultSeverity === ValidationResultSeverity.warning
        )
    }, [validationResults])

    const softWarningResults = useMemo(() => {
        return validationResults.filter(
            (res) => res.resultSeverity === ValidationResultSeverity.softWarning
        )
    }, [validationResults])

    const infoResults = useMemo(() => {
        return validationResults.filter(
            (res) => res.resultSeverity === ValidationResultSeverity.info
        )
    }, [validationResults])

    const icon = useMemo(() => {
        if (validationResults.length === 0)
            return [<CheckIcon key={"self"} className="size-4 stroke-success" />]

        const icons = []
        if (errorResults.length > 0)
            icons.push(
                <span className="flex items-center gap-1" key={"error"}>
                    {errorResults.length}
                    <CircleAlert
                        key="error"
                        className="size-4 fill-error [&_circle]:stroke-error stroke-background dark:stroke-foreground"
                    />
                </span>
            )
        if (warningResults.length > 0)
            icons.push(
                <span className="flex items-center gap-1" key={"warn"}>
                    {warningResults.length}
                    <TriangleAlert
                        key="warn"
                        className="size-4 fill-warn [&_path:nth-child(1)]:stroke-warn stroke-background dark:stroke-foreground"
                    />
                </span>
            )
        if (softWarningResults.length > 0)
            icons.push(
                <span className="flex items-center gap-1" key={"soft-warn"}>
                    {softWarningResults.length}
                    <TriangleAlert
                        key="soft-warn"
                        className="size-4 fill-warn [&_path:nth-child(1)]:stroke-warn opacity-50 stroke-background dark:stroke-foreground"
                    />
                </span>
            )
        if (infoResults.length > 0)
            icons.push(
                <span className="flex items-center gap-1" key={"info"}>
                    {infoResults.length}
                    <InfoIcon
                        key="info"
                        className="size-4 fill-info [&_circle]:stroke-info stroke-background dark:stroke-foreground"
                    />
                </span>
            )

        return icons
    }, [
        errorResults.length,
        infoResults.length,
        softWarningResults.length,
        validationResults.length,
        warningResults.length
    ])

    return (
        <div
            className={`p-1 ${validationRunning && validationResults.length > 0 ? "opacity-50" : ""} ${initiallyHidden ? "opacity-0" : ""} transition-opacity`}
        >
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"}>{icon}</Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 pb-0 pr-0 w-[600px]">
                    <div className="text-xs font-medium p-1 mb-1 flex justify-between">
                        {validationResults.length} {entityId ? "Entity" : "Crate"} Issues
                    </div>
                    <div className="overflow-y-auto max-h-[400px] pr-2 pb-2">
                        {validationResults.length === 0 && (
                            <div className="flex justify-center text-muted-foreground text-xs p-2">
                                No issues found.
                            </div>
                        )}
                        {validationResults.map((res) => (
                            <ValidationResultLine
                                result={res}
                                key={res.id}
                                showPropertyName
                                showEntityId={entityId === undefined}
                            />
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full -ml-1"
                        size="sm"
                        onClick={() => setShowValidationDrawer(true)}
                    >
                        <PanelBottomOpen /> Show Details
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
    )
})
