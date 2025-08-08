import { BugIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ValidationResultLine } from "@/components/editor/validation/validation-result-line"
import React from "react"
import { useStore } from "zustand/index"
import { useShallow } from "zustand/react/shallow"
import { useEditorState } from "@/lib/state/editor-state"
import { sortValidationResultByName } from "@/lib/utils"
import { useValidationStore } from "@/lib/validation/hooks"

export function ValidationDrawer() {
    const validationStore = useValidationStore()
    const validationResults = useStore(
        validationStore,
        useShallow((s) =>
            Array.from(s.results)
                .sort(sortValidationResultByName)
                .sort((a, b) => b.resultSeverity - a.resultSeverity)
        )
    )

    const setShowValidationDrawer = useEditorState((store) => store.setShowValidationDrawer)

    return (
        <div className="flex flex-col max-h-full min-h-0">
            <div className="pl-4 pr-2 bg-accent text-sm h-10 flex items-center gap-2 truncate shrink-0">
                <BugIcon className="size-4 shrink-0" /> Validation
                <div className="grow" />
                <Button variant="header" size="sm" onClick={() => setShowValidationDrawer(false)}>
                    <XIcon className="size-4" />
                </Button>
            </div>
            <div className="overflow-y-auto p-2 grow">
                {validationResults.length === 0 && (
                    <div className="flex justify-center text-muted-foreground text-xs p-4">
                        No issues found.
                    </div>
                )}
                {validationResults.map((res) => (
                    <ValidationResultLine result={res} key={res.id} showPropertyName showEntityId />
                ))}
            </div>
        </div>
    )
}
