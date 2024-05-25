"use client"

import { Library } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useEditorState } from "@/lib/state/editor-state"
import { useCallback, useState } from "react"
import { SpecificationModal } from "@/components/context/specification-modal"
import { CustomPairs } from "@/components/context/custom-pairs"

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
                    <Label>Specification</Label>
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
                </div>

                <CustomPairs />
            </div>
        </div>
    )
}
