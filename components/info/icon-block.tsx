import React, { PropsWithChildren, useCallback } from "react"
import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function IconBlock({
    Icon,
    children,
    href
}: PropsWithChildren<{
    Icon: LucideIcon
    href?: string
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
                "bg-white dark:bg-black flex drop-shadow-md dark:drop-shadow-none flex-col items-center justify-center lg:gap-6 gap-4 p-4 border border-border rounded-lg lg:w-48 lg:h-40 w-30 h-30 transition-all",
                Element !== "div"
                    ? "hover:drop-shadow-xl hover:border-foreground transition-all"
                    : ""
            )}
        >
            <div />
            <div>
                <Icon className="lg:size-12 size-8" />
            </div>
            <div className="text-center">{children}</div>
        </Element>
    )
}
