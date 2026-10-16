"use client"

import Image from "next/image"
import { addBasePath } from "next/dist/client/add-base-path"
import { PropsWithChildren, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Lightbulb } from "lucide-react"

export function ShowcaseBlock({
    id,
    imgLight,
    imgDark,
    title,
    alt,
    children,
    rtl,
    tip
}: PropsWithChildren<{
    id?: string
    imgLight: string
    imgDark: string
    title: string
    alt: string
    rtl?: boolean
    tip?: string
}>) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const text = (
        <div className="self-center justify-self-center">
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl mt-4">{title}</h3>
            <div className="mt-2 space-y-4">{children}</div>
            {tip && (
                <div className="mt-4 bg-data/10 border border-data/50 rounded-xl p-2 text-sm text-data">
                    <span className="font-bold">
                        <Lightbulb className="size-4 inline" /> Tip:
                    </span>{" "}
                    {tip}
                </div>
            )}
        </div>
    )

    return (
        <div
            id={id}
            className="grid md:grid-cols-2 gap-12 bg-card/50 backdrop-blur-sm border rounded-3xl p-12 overflow-hidden scroll-mt-20"
        >
            {rtl && text}
            <Image
                src={addBasePath(resolvedTheme === "dark" && mounted ? imgDark : imgLight)}
                className="shadow-2xl dark:shadow-black rounded-md justify-self-center self-center"
                alt={alt}
                width={1000}
                height={1000}
            />
            {!rtl && text}
        </div>
    )
}
