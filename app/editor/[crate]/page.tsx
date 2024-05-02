"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function Home() {
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

    return <Link href={"entities"}>View Entities</Link>
}
