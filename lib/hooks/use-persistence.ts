import { usePersistence } from "@/components/providers/persistence-provider"
import { useEffect, useState } from "react"

export function useCrateService() {
    const persistence = usePersistence()

    const [crateService, setCrateService] = useState(() => persistence.getCrateService())

    useEffect(() => {
        // Eagerly update the crate service in case it has changed between hook mount and effect execution
        setCrateService((old) => {
            const _new = persistence.getCrateService()
            if (_new !== old) return _new
            else return old
        })

        const remove = persistence.events.addEventListener("crate-service-changed", (service) =>
            setCrateService(service)
        )
        return () => remove()
    }, [persistence])

    return crateService
}

export function useFileService() {
    const crateService = useCrateService()

    const [fileService, setFileService] = useState(() => crateService?.getFileService() ?? null)

    useEffect(() => {
        // Eagerly update the crate service in case it has changed between hook mount and effect execution
        setFileService((old) => {
            const _new = crateService?.getFileService() ?? null
            if (_new !== old) return _new
            else return old
        })

        if (crateService) {
            const remove = crateService.events.addEventListener("file-service-changed", (service) =>
                setFileService(service)
            )
            return () => remove()
        }
    }, [crateService])

    return fileService
}

export function useRepositoryService() {
    const persistence = usePersistence()

    const [repositoryService, setRepositoryService] = useState(() =>
        persistence.getRepositoryService()
    )

    useEffect(() => {
        // Eagerly update the repository service in case it has changed between hook mount and effect execution
        setRepositoryService((old) => {
            const _new = persistence.getRepositoryService()
            if (_new !== old) return _new
            else return old
        })

        const remove = persistence.events.addEventListener(
            "repository-service-changed",
            (service) => setRepositoryService(service)
        )
        return () => remove()
    }, [persistence])

    return repositoryService
}
