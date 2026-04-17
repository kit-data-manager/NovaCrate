import { LoaderCircleIcon } from "lucide-react"

export function LoadingHero() {
    return (
        <div className="w-screen h-screen flex items-center justify-center flex-col gap-4 text-muted-foreground">
            <LoaderCircleIcon className={"size-6 animate-spin"} />
        </div>
    )
}
