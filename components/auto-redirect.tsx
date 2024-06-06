"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

export function AutoRedirect() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        router.push(
            pathname
                .split("/")
                .filter((_, i) => i < 3)
                .join("/") + "/entities"
        )
    }, [pathname, router])

    return null
}
