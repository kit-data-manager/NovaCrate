import { Button } from "@/components/ui/button"
import React, { useCallback } from "react"
import { ValidationResultIcon } from "@/components/editor/validation/validation-result-icon"
import { useGoToEntityEditor } from "@/lib/hooks"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { ValidationResult } from "@/lib/validation/validation-result"
import Markdown from "react-markdown"
import { CircleQuestionMark } from "lucide-react"

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
        <div
            className="flex gap-2 p-1 px-2 text-sm hover:bg-muted rounded-sm items-center w-full text-left"
            onClick={openTarget}
        >
            <ValidationResultIcon result={result} />
            <div className="flex flex-col grow">
                <div className="flex items-center gap-1 grow truncate">
                    <div className="truncate">
                        <Markdown allowedElements={["a", "code", "pre", "em", "strong", "i", "p"]}>
                            {result.resultTitle}
                        </Markdown>
                    </div>
                    {showEntityId && (
                        <div className="text-muted-foreground text-xs self-end">
                            {result.entityId}
                        </div>
                    )}
                    {showPropertyName && (
                        <div className="text-muted-foreground text-xs self-end">
                            {result.propertyName}
                            {result.propertyIndex !== undefined && `#${result.propertyIndex}`}
                        </div>
                    )}
                </div>
                <div className="text-muted-foreground text-xs line-clamp-1">
                    <Markdown allowedElements={["a", "code", "pre", "em", "strong", "i", "p"]}>
                        {`${result.resultDescription} (${result.validatorName}${result.ruleName ? ": " + result.ruleName : ""})`}
                    </Markdown>
                </div>
            </div>

            <div className="flex gap-2">
                {result.actions?.map((action, j) => (
                    <Button
                        className="p-0 m-0 h-auto"
                        variant="link"
                        key={j}
                        onClick={action.dispatch}
                    >
                        {action.displayName}
                    </Button>
                ))}
                {result.helpUrl && (
                    <Button
                        className="p-0 m-0 h-auto cursor-pointer"
                        variant="ghost"
                        onClick={() => window.open(result.helpUrl, "_blank")}
                    >
                        <CircleQuestionMark className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
