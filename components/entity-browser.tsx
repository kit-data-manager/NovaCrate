import { Skeleton } from "@/components/ui/skeleton"

export function EntityBrowser() {
    return (
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-60 ml-6" />
            <Skeleton className="h-4 w-60 ml-6" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-60 ml-6" />
            <Skeleton className="h-4 w-60 ml-6" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-60 ml-6" />
            <Skeleton className="h-4 w-60 ml-6" />
        </div>
    )
}
