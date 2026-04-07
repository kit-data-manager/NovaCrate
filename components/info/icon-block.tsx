import { PropsWithChildren } from "react"
import { LucideIcon } from "lucide-react"
import Link from "next/link"

export function IconBlock({
    Icon,
    children,
    href
}: PropsWithChildren<{
    Icon: LucideIcon
    href?: string
}>) {
    const Element = href ? Link : "div"

    return (
        <Element
            href={href!}
            className="bg-white dark:bg-black flex drop-shadow-md dark:drop-shadow-none flex-col items-center justify-center lg:gap-6 gap-4 p-4 border border-border rounded-lg lg:w-48 lg:h-40 w-30 h-30"
        >
            <div />
            <div>
                <Icon className="lg:size-12 size-8" />
            </div>
            <div className="text-center">{children}</div>
        </Element>
    )
}
