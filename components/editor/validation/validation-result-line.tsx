import { Button } from "@/components/ui/button"
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react"
import { ValidationResultIcon } from "@/components/editor/validation/validation-result-icon"
import { useGoToEntityEditor } from "@/lib/hooks"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { ValidationResult } from "@/lib/validation/validation-result"
import Markdown from "react-markdown"
import { CircleQuestionMark } from "lucide-react"
import { useEditorState } from "@/lib/state/editor-state"

export const ValidationResultLine = memo(function ValidationResultLine({
    result,
    showPropertyName,
    showEntityId,
    focusable,
    render,
    renderRequest,
    truncate = true
}: {
    result: ValidationResult
    showPropertyName?: boolean
    showEntityId?: boolean
    focusable?: boolean
    render?: boolean
    renderRequest?: () => void
    truncate?: boolean
}) {
    const container = useRef<HTMLDivElement>(null)
    const goToEntityEditor = useGoToEntityEditor()
    const focusProperty = useEntityEditorTabs((store) => store.focusProperty)
    const focusedValidationResult = useEditorState((store) =>
        focusable ? store.focusedValidationResultId : undefined
    )
    const focusValidationResult = useEditorState((store) => store.setFocusedValidationResultId)
    const setShowValidationDrawer = useEditorState((store) => store.setShowValidationDrawer)

    const openTarget = useCallback(() => {
        if (result.entityId) {
            goToEntityEditor({ "@id": result.entityId, "@type": [] })

            if (result.propertyName) {
                focusProperty(result.entityId, result.propertyName)
            }
        }
    }, [focusProperty, goToEntityEditor, result.entityId, result.propertyName])

    const focusResult = useCallback(() => {
        setShowValidationDrawer(true)
        focusValidationResult(result.id)
    }, [focusValidationResult, result.id, setShowValidationDrawer])

    const isFocused = useMemo(() => {
        return focusedValidationResult === result.id && focusable
    }, [focusable, focusedValidationResult, result.id])

    useEffect(() => {
        if (isFocused) {
            if (!render) {
                renderRequest?.()
            } else {
                container.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                const timeout = setTimeout(() => {
                    focusValidationResult(undefined)
                }, 2000)

                return () => clearTimeout(timeout)
            }
        }
    }, [focusValidationResult, isFocused, render, renderRequest])

    if (render === false) return null

    return (
        <div
            className={`flex gap-2 p-1 px-2 text-sm hover:bg-muted rounded-sm items-center w-full text-left transition-colors ${isFocused ? "bg-muted" : ""}`}
            onClick={openTarget}
            onDoubleClick={focusResult}
            ref={container}
        >
            <ValidationResultIcon result={result} />
            <div className="flex flex-col grow min-w-0">
                <div className="flex items-center gap-1 grow">
                    <div className="text-nowrap">
                        <Markdown allowedElements={["a", "code", "pre", "em", "strong", "i", "p"]}>
                            {result.resultTitle}
                        </Markdown>
                    </div>
                    {showEntityId && (
                        <div
                            className={`text-muted-foreground text-xs self-end ${truncate && "truncate"}`}
                        >
                            {result.entityId}
                        </div>
                    )}
                    {showPropertyName && (
                        <div
                            className={`text-muted-foreground text-xs self-end ${truncate && "truncate"}`}
                        >
                            {result.propertyName}
                            {result.propertyIndex !== undefined && `#${result.propertyIndex}`}
                        </div>
                    )}
                </div>
                <div className={`text-muted-foreground text-xs ${truncate && "line-clamp-1"}`}>
                    <Markdown allowedElements={["a", "code", "pre", "em", "strong", "i", "p"]}>
                        {`${result.resultDescription} (${result.validatorName}${result.ruleName ? "/" + result.ruleName : ""})`}
                    </Markdown>
                </div>
            </div>

            <div className="flex gap-2">
                {result.actions?.map((action, j) => (
                    <Button
                        className="p-0 m-0 h-auto"
                        variant="link"
                        key={j}
                        onClick={(e) => {
                            e.stopPropagation()
                            action.dispatch()
                        }}
                    >
                        {action.displayName}
                    </Button>
                ))}
                {result.helpUrl && (
                    <Button
                        className="p-0 m-0 h-auto cursor-pointer"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            window.open(result.helpUrl, "_blank")
                        }}
                    >
                        <CircleQuestionMark className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    )
})
