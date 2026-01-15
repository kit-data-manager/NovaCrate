import {
    BugIcon,
    ChevronsUpDownIcon,
    ChevronsDownUpIcon,
    Ruler,
    TriangleAlert,
    XIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import React, { useCallback, useMemo, useState } from "react"
import { useStore } from "zustand/index"
import { useShallow } from "zustand/react/shallow"
import { editorState, useEditorState } from "@/lib/state/editor-state"
import { getEntityDisplayName, sortValidationResultByName } from "@/lib/utils"
import { useValidationStore } from "@/lib/validation/hooks"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"
import { ValidationDrawerSection } from "@/components/validation-drawer-section"
import type { DefaultSectionOpen } from "@/components/file-explorer/explorer"
import { EntityIcon } from "@/components/entity/entity-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useGoToEntityEditor } from "@/lib/hooks"
import { validationSettings } from "@/lib/state/validation-settings"

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
    const validationEnabled = useStore(validationSettings, (s) => s.enabled)
    const setValidationEnabled = useStore(validationSettings, (s) => s.setEnabled)

    const enableValidation = useCallback(() => {
        setValidationEnabled(true)
    }, [setValidationEnabled])

    const setShowValidationDrawer = useEditorState((store) => store.setShowValidationDrawer)

    const goToEntityExplorer = useGoToEntityEditor()

    const [defaultSectionOpen, setDefaultSectionOpen] = useState<DefaultSectionOpen>(true)
    const onSectionOpenChange = useCallback(() => {
        setDefaultSectionOpen("indeterminate")
    }, [])
    const [structuredView, setStructuredView] = useState<"severity" | "entity" | "ruleName">(
        "severity"
    )
    const structuredResults = useMemo(() => {
        if (structuredView === "severity") {
            return [
                {
                    header: <div>Error</div>,
                    key: "error",
                    elements: validationResults.filter(
                        (r) => r.resultSeverity === ValidationResultSeverity.error
                    )
                },
                {
                    header: <div>Warning</div>,
                    key: "warning",
                    elements: validationResults.filter(
                        (r) => r.resultSeverity === ValidationResultSeverity.warning
                    )
                },
                {
                    header: <div>Soft Warning</div>,
                    key: "softWarning",
                    elements: validationResults.filter(
                        (r) => r.resultSeverity === ValidationResultSeverity.softWarning
                    )
                },
                {
                    header: <div>Info</div>,
                    key: "info",
                    elements: validationResults.filter(
                        (r) => r.resultSeverity === ValidationResultSeverity.info
                    )
                }
            ].filter((g) => g.elements.length > 0)
        } else if (structuredView === "entity") {
            const entitiesSet = validationResults.reduce(
                (acc, r) => acc.add(r.entityId),
                new Set<string | undefined>()
            )
            const entities = Array.from(entitiesSet)

            return entities
                .sort((a, b) => (a ?? "").localeCompare(b ?? ""))
                .map((entity) => {
                    const example = entity ? editorState.getState().entities.get(entity) : undefined
                    return {
                        header: (
                            <div
                                className={"flex items-center"}
                                onDoubleClick={
                                    entity ? () => goToEntityExplorer(example) : undefined
                                }
                            >
                                {example ? (
                                    <>
                                        <EntityIcon entity={example} />{" "}
                                        {getEntityDisplayName(example)}
                                    </>
                                ) : (
                                    "Crate Issues"
                                )}
                            </div>
                        ),
                        key: entity || "Crate Issues",
                        elements: validationResults.filter((r) => r.entityId === entity)
                    }
                })
        } else if (structuredView === "ruleName") {
            const ruleSet = validationResults.reduce(
                (acc, r) => acc.add(r.ruleName),
                new Set<string>()
            )
            const rules = Array.from(ruleSet)

            return rules
                .sort((a, b) => (a ?? "").localeCompare(b ?? ""))
                .map((ruleName) => {
                    return {
                        header: <div>{ruleName || "Unknown"}</div>,
                        key: ruleName || "Unknown",
                        elements: validationResults.filter((r) => r.ruleName === ruleName)
                    }
                })
        }
        return []
    }, [goToEntityExplorer, structuredView, validationResults])

    return (
        <div className="bg-background flex flex-col max-h-full min-h-0 h-full overflow-hidden rounded-lg border">
            <div className="pl-4 pr-2 border-b text-sm h-10 flex items-center gap-2 truncate shrink-0 bg-accent">
                <BugIcon className="size-4 shrink-0" /> Validation
                <div className="flex items-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="header"
                                className={`ml-2 ${structuredView === "severity" ? "bg-muted-foreground/10 dark:bg-muted-foreground/20" : ""}`}
                                onClick={() => setStructuredView("severity")}
                            >
                                <TriangleAlert />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sort by Severity</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="header"
                                className={`${structuredView === "entity" ? "bg-muted-foreground/10 dark:bg-muted-foreground/20" : ""}`}
                                onClick={() => setStructuredView("entity")}
                            >
                                <EntityIcon
                                    className={`mr-0`}
                                    entity={{ "@id": "", "@type": "File" }}
                                    noColor
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sort by Entity</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="header"
                                className={`${structuredView === "ruleName" ? "bg-muted-foreground/10 dark:bg-muted-foreground/20" : ""}`}
                                onClick={() => setStructuredView("ruleName")}
                            >
                                <Ruler />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sort by Rule Name</TooltipContent>
                    </Tooltip>

                    <Button
                        size="icon"
                        variant="header"
                        className="ml-4"
                        onClick={() => setDefaultSectionOpen(true)}
                    >
                        <ChevronsUpDownIcon />
                    </Button>
                    <Button
                        size="icon"
                        variant="header"
                        onClick={() => setDefaultSectionOpen(false)}
                    >
                        <ChevronsDownUpIcon />
                    </Button>
                </div>
                <div className="grow" />
                <Button variant="header" size="sm" onClick={() => setShowValidationDrawer(false)}>
                    <XIcon className="size-4" />
                </Button>
            </div>
            <div className="overflow-y-auto p-2 grow">
                {!validationEnabled && (
                    <div className="flex justify-center flex-col gap-2">
                        <div className="flex justify-center text-muted-foreground text-xs p-4">
                            Validation is disabled.
                        </div>
                        <div className="flex justify-center">
                            <Button variant={"outline"} onClick={enableValidation}>
                                Enable Validation
                            </Button>
                        </div>
                    </div>
                )}
                {validationEnabled && validationResults.length === 0 && (
                    <div className="flex justify-center text-muted-foreground text-xs p-4">
                        No issues found.
                    </div>
                )}
                {validationEnabled &&
                    structuredResults.map((group) => (
                        <ValidationDrawerSection
                            {...group}
                            key={group.key}
                            defaultSectionOpen={defaultSectionOpen}
                            onSectionOpenChange={onSectionOpenChange}
                        />
                    ))}
            </div>
        </div>
    )
}
