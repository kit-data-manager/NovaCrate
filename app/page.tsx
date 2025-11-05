"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RotatingText } from "@/components/ui/rotating-text"

export default function Home() {
    const router = useRouter()

    return (
        <div>
            <h1 className="text-6xl font-extrabold">NovaCrate</h1>
            <h2 className="text-2xl flex items-center gap-2">
                Web-based interactive editor for{" "}
                <RotatingText text={["creating", "editing", "visualizing", "validating"]} />
                research object crates.
            </h2>
            <Button>Open NovaCrate</Button>
        </div>
    )
}
