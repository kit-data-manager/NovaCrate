"use client"

import { PropsWithChildren, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function FAQ({ question, children }: PropsWithChildren<{ question: string }>) {
    const [open, setOpen] = useState(false)

    return (
        <Collapsible
            className={cn(
                "w-full rounded-2xl border bg-card/50 backdrop-blur-sm transition-colors",
                open ? "border-foreground/20" : "hover:border-foreground/30"
            )}
            open={open}
            onOpenChange={setOpen}
        >
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-5 text-left font-medium">
                {question}
                <ChevronDown
                    className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        open && "rotate-180"
                    )}
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
