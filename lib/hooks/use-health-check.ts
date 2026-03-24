import { useCallback, useEffect } from "react"
import { useInterval } from "usehooks-ts"
import { toast } from "sonner"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"
import { operationState } from "@/lib/state/operation-state"

const HEALTH_CHECK_INTERVAL_MS = 10_000

/**
 * Polls the persistence layer's health check every 10 seconds and updates
 * the {@link operationState} store. Fires toast notifications only on state
 * transitions (healthy → unhealthy, or unhealthy → healthy).
 *
 * Should be called inside the `PersistenceProvider` so that health monitoring
 * runs as long as the persistence service is mounted — even when no crate is
 * open.
 */
export function useHealthCheck(persistence: IPersistenceService): void {
    const runHealthCheck = useCallback(async () => {
        const { healthStatus, setHealthStatus } = operationState.getState()
        try {
            await persistence.healthCheck()
            if (healthStatus === "unhealthy") {
                toast.info("Crate service has recovered")
            }
            setHealthStatus("healthy")
        } catch (e) {
            if (healthStatus !== "unhealthy") {
                toast.error("Crate service is no longer reachable")
            }
            setHealthStatus("unhealthy", e)
        }
    }, [persistence])

    // Run immediately on mount
    useEffect(() => {
        runHealthCheck()
    }, [runHealthCheck])

    // Poll every 10 seconds
    useInterval(runHealthCheck, HEALTH_CHECK_INTERVAL_MS)
}
