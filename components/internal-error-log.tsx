import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useOperationState } from "@/lib/state/operation-state"
import { useStore } from "zustand"
import { editorState } from "@/lib/state/editor-state"
import { useCallback, useContext, useState } from "react"
import { Button } from "@/components/ui/button"
import { CircleAlert } from "lucide-react"
import { Error } from "./error"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import { useInterval } from "usehooks-ts"

export function InternalErrorLog() {
    const saveErrors = useOperationState((s) => s.saveErrors)
    const clearSaveError = useOperationState((s) => s.clearSaveError)
    const healthTestError = useOperationState((s) => s.healthError)
    const loadError = useOperationState((s) => s.loadError)
    const crateContext = useStore(editorState, (s) => s.crateContext)
    const [schemaIssues, setSchemaIssues] = useState<Map<string, unknown>>(new Map())

    const schemaWorker = useContext(SchemaWorker)

    const updateSchemaWorkerIssues = useCallback(async () => {
        const status = await schemaWorker.worker.executeUncached("getWorkerStatus")
        setSchemaIssues((current) => {
            if (
                JSON.stringify(Array.from(current.entries())) !==
                JSON.stringify(Array.from(status.schemaStatus.schemaIssues.entries()))
            ) {
                return status.schemaStatus.schemaIssues
            } else return current
        })
    }, [schemaWorker.worker])

    useInterval(updateSchemaWorkerIssues, 2000)

    return loadError ||
        saveErrors.size > 0 ||
        healthTestError ||
        schemaIssues.size > 0 ||
        crateContext.errors.length > 0 ? (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="icon" className="animate-destructive-ping" variant="outline">
                    <CircleAlert className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-100 flex flex-col gap-2">
                <div className="text-sm font-bold">Internal Error Log</div>
                <Error title="Crate service is not reachable" error={healthTestError} />
                <Error title="Error while loading crate data" error={loadError} />
                {Array.from(saveErrors.entries()).map(([key, value]) => (
                    <Error
                        title={`Error while saving entity "${key}"`}
                        key={key}
                        error={value}
                        onClear={() => clearSaveError(key)}
                    />
                ))}
                {Array.from(schemaIssues.entries()).map(([key, value]) => (
                    <Error title={`Error while loading schema "${key}"`} key={key} error={value} />
                ))}
                {crateContext.errors.map((error, i) => (
                    <Error title={"Error while parsing crate context"} error={error} key={i} />
                ))}
            </PopoverContent>
        </Popover>
    ) : null
}
