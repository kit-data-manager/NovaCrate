import { ValidationResult } from "@/lib/validation/validation-result"
import { ValidationResultLine } from "@/components/editor/validation/validation-result-line"
import React, { ReactNode, useCallback, useEffect, useState } from "react"
import type { DefaultSectionOpen } from "@/components/entity-browser/entity-browser-section"
import { SectionTrigger } from "@/components/ui/section-trigger"

export function ValidationDrawerSection({
    header,
    elements,
    defaultSectionOpen,
    onSectionOpenChange
}: {
    header: ReactNode
    elements: ValidationResult[]
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const [open, setOpen] = useState(
        defaultSectionOpen !== "indeterminate" ? defaultSectionOpen : true
    )

    useEffect(() => {
        if (defaultSectionOpen !== "indeterminate") setOpen(defaultSectionOpen)
    }, [defaultSectionOpen])

    const toggleOpen = useCallback(() => {
        setOpen((v) => !v)
        onSectionOpenChange()
    }, [onSectionOpenChange])

    const renderRequest = useCallback(() => {
        toggleOpen()
    }, [toggleOpen])

    return (
        <SectionTrigger
            open={open}
            toggleOpen={toggleOpen}
            keepMounted
            triggerText={
                <>
                    <span className="text-sm">{header}</span>{" "}
                    <span className="text-xs text-muted-foreground">({elements.length})</span>
                </>
            }
        >
            {elements.map((res) => (
                <ValidationResultLine
                    result={res}
                    key={res.id}
                    showPropertyName
                    showEntityId
                    focusable
                    render={open}
                    renderRequest={renderRequest}
                    truncate={false}
                />
            ))}
        </SectionTrigger>
    )
}
