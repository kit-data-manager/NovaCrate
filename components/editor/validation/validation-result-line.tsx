import { Button } from "@/components/ui/button"
import React, { useCallback } from "react"
import { ValidationResult } from "@/lib/validation/ValidationProvider"
import { ValidationResultIcon } from "@/components/editor/validation/validation-result-icon"
import { useGoToEntityEditor } from "@/lib/hooks"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"

export function ValidationResultLine({
    result,
    showPropertyName,
    showEntityId
}: {
    result: ValidationResult
    showPropertyName?: boolean
    showEntityId?: boolean
}) {
    const goToEntityEditor = useGoToEntityEditor()
    const focusProperty = useEntityEditorTabs((store) => store.focusProperty)

    const openTarget = useCallback(() => {
        if (result.entityId) {
            goToEntityEditor({ "@id": result.entityId, "@type": [] })

            if (result.propertyName) {
                focusProperty(result.entityId, result.propertyName)
            }
        }
    }, [focusProperty, goToEntityEditor, result.entityId, result.propertyName])

    return (
        <div className="flex gap-3 p-1 text-sm hover:bg-muted rounded-sm" onClick={openTarget}>
            <div className="flex items-center gap-1 grow truncate">
                <ValidationResultIcon result={result} />
                <div className="truncate">{result.resultTitle}</div>
                {showEntityId && (
                    <div className="text-muted-foreground text-xs self-end">{result.entityId}</div>
                )}
                {showPropertyName && (
                    <div className="text-muted-foreground text-xs self-end">
                        {result.propertyName}
                        {result.propertyIndex !== undefined && `#${result.propertyIndex}`}
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                {result.actions
                    ?.filter((a) => "dispatch" in a)
                    .map((action, j) => (
                        <Button
                            className="p-0 m-0 h-auto"
                            variant="link"
                            key={j}
                            onClick={action.dispatch}
                        >
                            {action.displayName}
                        </Button>
                    ))}
            </div>
        </div>
    )
}
