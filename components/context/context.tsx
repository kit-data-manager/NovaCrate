"use client"

import { Library } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useEditorState } from "@/lib/state/editor-state"
import { useCallback, useContext, useState } from "react"
import { SpecificationModal } from "@/components/context/specification-modal"
import { CustomPairs } from "@/components/context/custom-pairs"
import { Error } from "@/components/error"
import HelpTooltip from "@/components/help-tooltip"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "@/components/Metadata"

export function ContextPage() {
    const context = useEditorState.useCrateContext()
    const { crateDataIsLoading, crateId } = useContext(CrateDataContext)

    const [specificationModalOpen, setSpecificationModalOpen] = useState(false)

    const onSpecificationModalOpenChange = useCallback((open: boolean) => {
        setSpecificationModalOpen(open)
    }, [])

    return (
        <div>
            <Metadata page={"Context"} />

            <SpecificationModal
                open={specificationModalOpen}
                onOpenChange={onSpecificationModalOpenChange}
            />

            <div className="pl-4 bg-accent text-sm h-10 flex items-center">
                <Library className="size-4 shrink-0 mr-2" /> Context
            </div>

            <div className="p-4 pt-0">
                <div className="my-4">
                    <Label>
                        Specification{" "}
                        <HelpTooltip>
                            Determines which RO-Crate Specification the current Crate should follow.
                            Currently, only RO-Crate v1.1 (https://w3id.org/ro/crate/1.1/contex) is
                            supported.
                        </HelpTooltip>
                    </Label>
                    <div className="mt-2 ml-2">
                        {crateDataIsLoading || !crateId ? (
                            <Skeleton className="w-32 h-6" />
                        ) : (
                            context.specification
                        )}
                    </div>

                    {!crateDataIsLoading && crateId && context.specification === "unknown" ? (
                        <Error
                            title="Invalid Context"
                            error="The RO-Crate Specification used in this crate could not be identified. Most Types and Properties will not be resolved. Please fix the issue in the JSON Editor by specifying a valid RO-Crate Specification"
                        />
                    ) : null}
                </div>

                <CustomPairs />
            </div>
        </div>
    )
}
