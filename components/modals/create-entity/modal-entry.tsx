import { SlimClass } from "@/lib/schema-worker/helpers"
import { useEditorState } from "@/lib/state/editor-state"
import React, { useCallback, useMemo } from "react"
import { camelCaseReadable } from "@/lib/utils"
import { CommandItem } from "@/components/ui/command"
import { TypeIcon } from "@/components/type-icon"
import { MarkdownComment } from "@/components/markdown-comment"

export function CreateEntityModalEntry({
    slimClass,
    onSelect,
    common
}: {
    slimClass: SlimClass
    onSelect: (value: string) => void
    common?: boolean
}) {
    const crateContext = useEditorState((store) => store.crateContext)

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
            value={readableName + (common ? "-common" : "")}
        >
            <TypeIcon type={slimClass["@id"]} className="w-5 h-5 mr-3 ml-1 shrink-0" />
            <div className="flex flex-col max-w-full w-full py-1">
                <div className="flex justify-between">
                    <div>{readableName}</div>
                </div>
                <div className="line-clamp-1 text-xs">
                    <MarkdownComment comment={slimClass.comment} />
                </div>
            </div>
        </CommandItem>
    )
}
