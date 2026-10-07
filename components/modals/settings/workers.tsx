import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import { Error } from "@/components/error"
import { Check, HardHat, Loader2, XIcon } from "lucide-react"
import { usePersistence } from "@/components/providers/persistence-provider"
import { BrowserPersistenceService } from "@/lib/persistence/browser/BrowserPersistenceService"

export function SuccessDisplay({ success }: { success?: boolean }) {
    return success === undefined ? (
        <span className="text-muted-foreground flex items-center">
            <Loader2 className="size-4" />
        </span>
    ) : success ? (
        <span className="text-success flex items-center">
            <Check className="size-4" />
        </span>
    ) : (
        <span className="text-error flex items-center">
            <XIcon className="size-4" />
        </span>
    )
}

export function WorkerSettings() {
    const [isSchemaWorkerActive, setIsSchemaWorkerActive] = useState<boolean | undefined>(undefined)
    const [schemaWorkerError, setSchemaWorkerError] = useState<unknown>()
    const [opfsWorkerHealthy, setOpfsWorkerHealthy] = useState<undefined | boolean>(undefined)
    const { worker, isUsingWebWorker } = useContext(SchemaWorker)
    const persistence = usePersistence()

    const hasOPFSWorker = useMemo(() => {
        return persistence instanceof BrowserPersistenceService
    }, [persistence])

    const fetchData = useCallback(async () => {
        const { workerActive } = await worker.executeUncached("getWorkerStatus")
        setIsSchemaWorkerActive(workerActive)
        if (hasOPFSWorker) {
            try {
                await persistence.healthCheck()
                setOpfsWorkerHealthy(true)
            } catch (e) {
                setOpfsWorkerHealthy(false)
            }
        }
    }, [hasOPFSWorker, persistence, worker])

    useEffect(() => {
        fetchData().then().catch(setSchemaWorkerError)
    }, [fetchData])

    return (
        <div className="overflow-auto min-h-0 max-h-full">
            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">Diagnostics</h3>
            <div className="p-4 border rounded mb-4 overflow-auto min-h-0">
                <Error title="Failed to get worker status" error={schemaWorkerError} />
                <div>
                    <h4 className="flex items-center">
                        <HardHat className="w-5 h-5 mr-2" /> Schema Worker
                    </h4>
                    <div className="text-sm text-muted-foreground mb-2">
                        Responsible for loading the schemas used in the crate context. Enables type
                        matching, comments, and autocomplete.
                    </div>
                    <div className="flex gap-2">
                        Worker Healthy: <SuccessDisplay success={isSchemaWorkerActive} />
                    </div>
                    <div className="flex gap-2">
                        Worker in Use: <SuccessDisplay success={isUsingWebWorker} />
                    </div>
                </div>
            </div>
            {hasOPFSWorker && (
                <div className="p-4 border rounded mb-4 overflow-auto min-h-0">
                    <div>
                        <h4 className="flex items-center">
                            <HardHat className="w-5 h-5 mr-2" /> File System Worker
                        </h4>
                        <div className="text-sm text-muted-foreground mb-2">
                            Responsible for storing RO-Crates and reading/writing files in the
                            RO-Crates.
                        </div>
                        <div className="flex gap-2">
                            Worker Healthy: <SuccessDisplay success={opfsWorkerHealthy} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
