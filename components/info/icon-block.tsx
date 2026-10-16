import React, { PropsWithChildren, useCallback } from "react"
import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function IconBlock({
    Icon,
    children,
    href,
    compact
}: PropsWithChildren<{
    Icon: LucideIcon
    href?: string
    compact?: boolean
}>) {
    const Element = href ? Link : "div"

    const anchorHandler = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
            if (href && href.startsWith("#")) {
                e.preventDefault()
                const element = document.getElementById(href.substring(1))
                if (element) element.scrollIntoView({ behavior: "smooth", block: "start" })
            }
        },
        [href]
    )

    return (
        <Element
            href={href!}
            onClick={anchorHandler}
            className={cn(
                "bg-white dark:bg-black flex drop-shadow-md dark:drop-shadow-none flex-col items-center justify-center p-4 border border-border rounded-lg transition-all",
                compact
                    ? "lg:gap-2 gap-2 lg:w-32 lg:h-28 w-28 h-24"
                    : "lg:gap-6 gap-4 lg:w-48 lg:h-40 w-30 h-30",
                Element !== "div"
                    ? "hover:drop-shadow-xl hover:border-foreground transition-all"
                    : ""
            )}
        >
            <div />
            <div>
                <Icon className={compact ? "lg:size-8 size-6" : "lg:size-12 size-8"} />
            </div>
            <div className={compact ? "text-center text-xs" : "text-center"}>{children}</div>
        </Element>
    )
}
