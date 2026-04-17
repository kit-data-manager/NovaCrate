"use client"

import { PropsWithChildren, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"

export function FAQ({ question, children }: PropsWithChildren<{ question: string }>) {
    const [open, setOpen] = useState(false)

    const Icon = open ? ChevronDown : ChevronRight

    return (
        <Collapsible
            className="w-full border border-border rounded-lg"
            open={open}
            onOpenChange={setOpen}
        >
            <CollapsibleTrigger
                className={`${open ? "border-b" : ""} border-border flex items-center gap-2 w-full p-2 hover:bg-accent`}
            >
                <Icon className="size-4" /> {question}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-2">{children}</CollapsibleContent>
        </Collapsible>
    )
}
