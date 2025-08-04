import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CircleAlert, InfoIcon, TriangleAlert } from "lucide-react"
import React, { useMemo } from "react"
import { useValidationStore } from "@/lib/validation/ValidationProvider"
import { useStore } from "zustand/index"
import { useShallow } from "zustand/react/shallow"

export function SinglePropertyValidation({
    propertyName,
    entityId
}: {
    propertyName: string
    entityId: string
}) {
    const validationStore = useValidationStore()
    const validationResults = useStore(
        validationStore,
        useShallow((s) =>
            s.results.filter(
                (res) => res.entityId === entityId && res.propertyName === propertyName
            )
        )
    )

    const highestResultType = useMemo(() => {
        if (validationResults.find((res) => res.resultType === "error")) return "error"
        if (validationResults.find((res) => res.resultType === "warning")) return "warning"
        if (validationResults.find((res) => res.resultType === "soft-warning"))
            return "soft-warning"
        if (validationResults.find((res) => res.resultType === "info")) return "info"
    }, [validationResults])

    const icon = useMemo(() => {
        if (highestResultType === "error") return <CircleAlert className="size-4 stroke-error" />
        if (highestResultType === "warning") return <TriangleAlert className="size-4 stroke-warn" />
        if (highestResultType === "soft-warning")
            return <TriangleAlert className="size-4 stroke-warn opacity-40" />
        if (highestResultType === "info") return <InfoIcon className="size-4 stroke-info" />
        return <InfoIcon className="size-4 stroke-info" />
    }, [highestResultType])

    return (
        <div
            className={`p-1 ${validationResults.length > 0 ? "" : "opacity-0 pointer-events-none"}`}
        >
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"ghost"}>{icon}</Button>
                </PopoverTrigger>
                <PopoverContent className="p-2">
                    <div className="text-xs font-medium p-1 mb-1">Issues</div>
                    {validationResults.map((res, i) => (
                        <div key={i} className="flex gap-2 p-1 text-sm hover:bg-muted rounded-sm">
                            <div className="grow">{res.resultTitle}</div>
                            <div className="flex gap-2">
                                {res.actions
                                    ?.filter((a) => "dispatch" in a)
                                    .map((action, j) => (
                                        <Button
                                            className="p-0 m-0 h-auto"
                                            variant="link"
                                            key={j}
                                            onClick={action.dispatch}
                                        >
                                            {action.displayName}
                                        </Button>
                                    ))}
                            </div>
                        </div>
                    ))}
                </PopoverContent>
            </Popover>
        </div>
    )
}
