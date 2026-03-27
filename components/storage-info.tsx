import { useCallback } from "react"
import useSWR from "swr"
import { Progress } from "@/components/ui/progress"
import prettyBytes from "pretty-bytes"
import { HardDrive } from "lucide-react"
import { useInterval } from "usehooks-ts"
import { Error } from "@/components/error"
import HelpTooltip from "@/components/help-tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { usePersistence } from "@/components/providers/persistence-provider"

export function StorageInfo() {
    const persistence = usePersistence()

    const fetcher = useCallback(async () => {
        const fileServiceQuota = persistence.getCrateService()?.getFileService()?.getStorageQuota()
        const repositoryServiceQuota = persistence.getRepositoryService()?.getStorageQuota()

        if (fileServiceQuota) {
            return await fileServiceQuota
        } else if (repositoryServiceQuota) {
            return await repositoryServiceQuota
        } else return null
    }, [persistence])

    const { data, mutate, error, isLoading } = useSWR("storage-info", fetcher)

    useInterval(mutate, 60000)

    if (isLoading) return <Skeleton className="w-full p-4 h-14 mb-2" />
    if (!data) return <div>Current persistence service does not provide storage information.</div>

    if (error) return <Error error={error} title={"Storage Info not available"} />

    return (
        <div className="space-y-1 p-4">
            <div className="flex items-center mb-2">
                <HardDrive className="size-4 mr-2" />{" "}
                <span>{data.persistent ? "" : "Temporary"} Storage</span>
                {!data.persistent && (
                    <HelpTooltip className="ml-2">
                        Your Crate data is only temporarily stored in NovaCrate. This is due to
                        browser restrictions. Make sure to export your Crate before closing
                        NovaCrate.
                    </HelpTooltip>
                )}
            </div>
            <Progress value={(data.usedSpace / data.totalSpace) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
                <div>Used: {prettyBytes(data.usedSpace)}</div>
                <div>Total: {prettyBytes(data.totalSpace)}</div>
            </div>
        </div>
    )
}
