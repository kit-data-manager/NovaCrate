"use client"

import { Library } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useEditorState } from "@/lib/state/editor-state"
import { useCallback, useState } from "react"
import { SpecificationModal } from "@/components/context/specification-modal"
import { CustomPairs } from "@/components/context/custom-pairs"
import { Error } from "@/components/error"
import HelpTooltip from "@/components/help-tooltip"

export function ContextPage() {
    const context = useEditorState.useCrateContext()

    const [specificationModalOpen, setSpecificationModalOpen] = useState(false)

    const onSpecificationModalOpenChange = useCallback((open: boolean) => {
        setSpecificationModalOpen(open)
    }, [])

    return (
        <div>
            <SpecificationModal
                open={specificationModalOpen}
                onOpenChange={onSpecificationModalOpenChange}
            />

            <div className="pl-4 bg-accent text-sm h-10 flex items-center">
                <Library className="w-4 h-4 shrink-0 mr-2" /> Context
            </div>

            <div className="p-4">
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
                        {context.specification}
                        {/*<Button
                            size="icon"
                            variant="secondary"
                            className="ml-2"
                            onClick={() => onSpecificationModalOpenChange(true)}
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>*/}
                    </div>

                    {context.specification === "unknown" ? (
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
