import { useCallback, useState } from "react"
import { TypeIcon } from "@/components/type-icon"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { EllipsisVertical, Trash } from "lucide-react"
import { TypeSelectModal } from "@/components/modals/type-select-modal"
import { camelCaseReadable, findEntity, toArray } from "@/lib/utils"
import { useEditorState } from "@/lib/state/editor-state"
import { useShallow } from "zustand/react/shallow"

export function TypeField({
    value,
    onChange,
    onRemoveEntry,
    entityId
}: {
    value: string
    onChange: (value: string) => void
    onRemoveEntry: () => void
    entityId: string
}) {
    const [typeSelectModalOpen, setTypeSelectModalOpen] = useState(false)
    const entity = useEditorState(useShallow((s) => findEntity(s.getEntities(), entityId)))

    const onTypeSelect = useCallback(
        (newType: string) => {
            setTypeSelectModalOpen(false)
            onChange(newType)
        },
        [onChange]
    )

    return (
        <div className="flex grow">
            <TypeSelectModal
                onOpenChange={setTypeSelectModalOpen}
                onTypeSelect={onTypeSelect}
                open={typeSelectModalOpen}
            />

            <Button
                variant="outline"
                className="shrink grow rounded-r-none justify-start pl-2 truncate min-w-0"
                onClick={() => setTypeSelectModalOpen(true)}
            >
                <TypeIcon
                    type={value}
                    className="size-4 pointer-events-none text-muted-foreground mr-1"
                />
                {camelCaseReadable(value)}
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        id="type-dropdown-trigger"
                        className="shrink-0 border-l-0 rounded-l-none"
                    >
                        <EllipsisVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={onRemoveEntry}
                        disabled={entity && toArray(entity["@type"]).length === 1}
                    >
                        <Trash className="size-4 mr-2" /> Remove Entry
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
