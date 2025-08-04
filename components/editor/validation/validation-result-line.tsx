import { Button } from "@/components/ui/button"
import React from "react"
import { ValidationResult } from "@/lib/validation/ValidationProvider"
import { ValidationResultIcon } from "@/components/editor/validation/validation-result-icon"

export function ValidationResultLine({
    result,
    showPropertyName
}: {
    result: ValidationResult
    showPropertyName?: boolean
}) {
    return (
        <div className="flex gap-3 p-1 text-sm hover:bg-muted rounded-sm">
            <div className="flex items-center gap-1 grow truncate">
                <ValidationResultIcon result={result} />
                <div className="truncate">{result.resultTitle}</div>
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
