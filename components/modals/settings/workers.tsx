import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { ProvisioningStatus } from "@/lib/schema-worker/SchemaGraph"
import { CrateVerifyContext } from "@/components/providers/crate-verify-provider"
import { Error } from "@/components/error"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, HardHat, Loader, Loader2, XIcon } from "lucide-react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { BrowserBasedCrateService } from "@/lib/backend/BrowserBasedCrateService"

function ProvisioningStatusDisplay({ isLoaded, error }: { isLoaded?: boolean; error: unknown }) {
    if (typeof isLoaded === "undefined" && !error)
        return <span className="text-muted">Waiting for worker response...</span>
    if (!isLoaded && !error)
        return (
            <span className="text-muted-foreground flex items-center">
                <Loader className="size-4 mr-2" /> Not required yet
            </span>
        )
    if (error)
        return (
            <div>
                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                        <span className="text-error flex items-center max-w-[100px]">
                            <XIcon className="size-4 mr-2" /> Failed
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <Error title="Provisioning failed" error={error} />
                    </TooltipContent>
                </Tooltip>
            </div>
        )
    if (isLoaded)
        return (
            <span className="text-success flex items-center">
                <Check className="size-4 mr-2" /> Loaded
            </span>
        )
}

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
    const [provisioningStatus, setProvisioningStatus] = useState<ProvisioningStatus | undefined>(
        undefined
    )
    const [schemaWorkerError, setSchemaWorkerError] = useState<unknown>()
    const { worker, isUsingWebWorker } = useContext(CrateVerifyContext)

    const { serviceProvider } = useContext(CrateDataContext)

    const hasServiceProviderWorker = useMemo(() => {
        return serviceProvider instanceof BrowserBasedCrateService
    }, [serviceProvider])

    const isServiceProviderWorkerHealthy = useMemo(() => {
        if (serviceProvider instanceof BrowserBasedCrateService) {
            return serviceProvider.isWorkerHealthy()
        } else return false
    }, [serviceProvider])

    const fetchData = useCallback(async () => {
        const { workerActive, provisionStatus } = await worker.execute("getProvisioningStatus")
        setIsSchemaWorkerActive(workerActive)
        setProvisioningStatus(provisionStatus)
    }, [worker])

    useEffect(() => {
        fetchData().then().catch(setSchemaWorkerError)
    }, [fetchData])

    return (
        <div>
            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">Workers</h3>
            <div className="p-4 border rounded mb-4">
                <Error title="Failed to get worker status" error={schemaWorkerError} />
                <div>
                    <h4 className="mb-2 text-lg font-bold flex items-center">
                        <HardHat className="w-5 h-5 mr-2" /> Schema Worker
                    </h4>
                    <div className="flex gap-2">
                        Worker Healthy: <SuccessDisplay success={isSchemaWorkerActive} />
                    </div>
                    <div className="flex gap-2">
                        Worker in Use: <SuccessDisplay success={isUsingWebWorker} />
                    </div>
                    <h4 className="mt-8 mb-2 text-lg font-medium">Provisioning Status</h4>
                    <div className="grid grid-cols-[1fr_3fr] gap-2">
                        <div>Schema.org:</div>
                        <ProvisioningStatusDisplay
                            isLoaded={provisioningStatus?.schemaOrgLoaded}
                            error={provisioningStatus?.schemaOrgError}
                        />

                        <div>Bioschemas.org:</div>
                        <ProvisioningStatusDisplay
                            isLoaded={provisioningStatus?.bioSchemaLoaded}
                            error={provisioningStatus?.bioSchemaError}
                        />

                        <div>Purl.org:</div>
                        <ProvisioningStatusDisplay
                            isLoaded={provisioningStatus?.purlLoaded}
                            error={provisioningStatus?.purlError}
                        />

                        <div>w3.org:</div>
                        <ProvisioningStatusDisplay
                            isLoaded={provisioningStatus?.w3Loaded}
                            error={provisioningStatus?.w3Error}
                        />
                    </div>
                </div>
            </div>

            {hasServiceProviderWorker ? (
                <div className="p-4 border rounded">
                    <div>
                        <h4 className="mb-2 text-lg font-bold flex items-center">
                            <HardHat className="w-5 h-5 mr-2" /> OPFS Worker
                        </h4>
                        <div className="flex gap-2">
                            Worker Healthy:{" "}
                            <SuccessDisplay success={isServiceProviderWorkerHealthy} />
                        </div>
                        <div className="flex gap-2">
                            Worker in Use: <SuccessDisplay success={true} />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
