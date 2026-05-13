"use client"

import { LoaderCircleIcon } from "lucide-react"
import { useTimeout } from "usehooks-ts"
import { useState } from "react"
import { Error } from "@/components/error"

export function LoadingHero() {
    const [isTimedOut, setIsTimedOut] = useState(false)

    useTimeout(() => setIsTimedOut(true), 10000)

    return (
        <div className="w-screen h-screen flex items-center justify-center flex-col gap-4 text-muted-foreground">
            <LoaderCircleIcon className={"size-6 animate-spin"} />
            <span>NovaCrate is getting ready...</span>
            {isTimedOut && (
                <Error
                    warn
                    title={"This doesn't look right..."}
                    error={
                        "It seems like NovaCrate is unable to open the selected RO-Crate. Try to reload the page or return to the main menu."
                    }
                />
            )}
        </div>
    )
}
