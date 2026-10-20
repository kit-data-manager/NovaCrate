"use client"

import { ChevronRight } from "lucide-react"
import React, { PropsWithChildren, ReactNode } from "react"

export function SectionTrigger({
    open,
    toggleOpen,
    triggerText,
    children,
    keepMounted = false
}: PropsWithChildren<{
    open: boolean
    toggleOpen(): void
    triggerText: ReactNode
    keepMounted?: boolean
}>) {
    return (
        <div className="shrink-0">
            <button
                type="button"
                aria-expanded={open}
                className="flex items-center gap-1 hover:bg-muted rounded w-full"
                onClick={toggleOpen}
            >
                <ChevronRight className={`shrink-0 size-4 m-2 ${open ? "rotate-90" : ""}`} />
                {triggerText}
            </button>
            <div className={`pl-4 flex flex-col ${keepMounted && !open ? "hidden" : ""}`}>
                {keepMounted || open ? children : null}
            </div>
        </div>
    )
}
