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
            <h3 className="text-2xl font-bold mt-4">{title}</h3>
            <div className="mt-2 space-y-4">{children}</div>
            {tip && (
                <>
                    <br />
                    <p>
                        <span className="font-bold">
                            <Lightbulb className="size-4 inline" /> Tip:
                        </span>{" "}
                        {tip}
                    </p>
                </>
            )}
        </div>
    )

    return (
        <div id={id} className="grid md:grid-cols-2 gap-8 border border-border rounded-lg p-8 overflow-hidden">
            {rtl && text}
            <Image
                src={addBasePath(resolvedTheme === "dark" && mounted ? imgDark : imgLight)}
                className="shadow-lg rounded-md justify-self-center self-center"
                alt={alt}
                width={1000}
                height={1000}
            />
            {!rtl && text}
        </div>
    )
}
