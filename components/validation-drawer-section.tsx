import { ValidationResult } from "@/lib/validation/validation-result"
import { ValidationResultLine } from "@/components/editor/validation/validation-result-line"
import React, { ReactNode, useCallback, useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DefaultSectionOpen } from "@/components/entity-browser/entity-browser-section"

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
        setOpen(!open)
        onSectionOpenChange()
    }, [onSectionOpenChange, open])

    const renderRequest = useCallback(() => {
        toggleOpen()
    }, [toggleOpen])

    return (
        <div>
            <div className="flex items-center gap-2 hover:bg-muted rounded">
                <Button size="icon" variant="ghost" className={`shrink-0`} onClick={toggleOpen}>
                    <ChevronRight className={`size-4 ${open ? "rotate-90" : ""}`} />
                </Button>
                <span className="text-sm">{header}</span>{" "}
                <span className="text-xs text-muted-foreground">({elements.length})</span>
            </div>
            <div className="pl-4">
                {elements.map((res) => (
                    <ValidationResultLine
                        result={res}
                        key={res.id}
                        showPropertyName
                        showEntityId
                        focusable
                        render={open}
                        renderRequest={renderRequest}
                    />
                ))}
            </div>
        </div>
    )
}
