import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Rocket, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function GithubDiscontinuationWarning(props: { className?: string }) {
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (window.location.hostname === "kit-data-manager.github.io") setShow(true)
    }, [])

    if (!show) return null

    return (
        <Alert className={cn("border-warn", props.className)}>
            <TriangleAlert className="stroke-warn" />
            <AlertTitle className="text-warn">NovaCrate is moving</AlertTitle>
            <AlertDescription className="flex justify-between items-center gap-2">
                <div>
                    Please navigate to the new home of NovaCrate at{" "}
                    <Link
                        className="text-blue-500 underline"
                        href={"https://novacrate.datamanager.kit.edu/editor"}
                    >
                        novacrate.datamanager.kit.edu
                    </Link>
                    . Make sure to take your RO-Crates with you by downloading them here first. The
                    instance hosted here on GitHub Pages will be shut down soon.
                </div>
                <Link href={"https://novacrate.datamanager.kit.edu/editor"}>
                    <Button variant="outline" className="text-foreground">
                        <Rocket /> Go
                    </Button>
                </Link>
            </AlertDescription>
        </Alert>
    )
}
