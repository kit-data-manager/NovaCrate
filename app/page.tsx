"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
    const router = useRouter()

    useEffect(() => {
        router.push("/editor")
    }, [router])

    return <Link href={"/editor"}>Open Editor</Link>
}
