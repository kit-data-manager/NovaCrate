import { SlimClass } from "@/lib/crate-verify/helpers"
import { useEditorState } from "@/components/editor-state"
import React, { useCallback, useMemo } from "react"
import { camelCaseReadable } from "@/lib/utils"
import { CommandItem } from "@/components/ui/command"

export function CreateEntityModalEntry({
    slimClass,
    onSelect
}: {
    slimClass: SlimClass
    onSelect: (value: string) => void
}) {
    const crateContext = useEditorState.useCrateContext()

    const readableName = useMemo(() => {
        return camelCaseReadable(crateContext.reverse(slimClass["@id"]) || slimClass["@id"])
    }, [crateContext, slimClass])

    const onLocalSelect = useCallback(() => {
        onSelect(crateContext.reverse(slimClass["@id"]) || slimClass["@id"])
    }, [crateContext, onSelect, slimClass])

    return (
        <CommandItem
            className="text-md"
            key={slimClass["@id"]}
            onSelect={onLocalSelect}
            value={readableName}
        >
            <div className="flex flex-col max-w-full w-full py-1">
                <div className="flex justify-between">
                    <div>{readableName}</div>
                </div>
                <div className="truncate text-xs">
                    <span>{slimClass.comment + ""}</span>
                </div>
            </div>
        </CommandItem>
    )
}
