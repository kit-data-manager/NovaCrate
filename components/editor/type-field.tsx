import { useCallback, useState } from "react"
import { useTypeIcon } from "@/components/type-icon"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { EllipsisVertical, Trash } from "lucide-react"
import { TypeSelectModal } from "@/components/modals/type-select-modal"

export function TypeField({
    value,
    onChange,
    onRemoveEntry
}: {
    value: string
    onChange: (value: string) => void
    onRemoveEntry: () => void
}) {
    const Icon = useTypeIcon(value)

    const [typeSelectModalOpen, setTypeSelectModalOpen] = useState(false)

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
                <Icon className="size-4 pointer-events-none text-muted-foreground mr-1" />
                {value}
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
                <DropdownMenuContent onClick={onRemoveEntry}>
                    <DropdownMenuItem variant="destructive">
                        <Trash className="size-4 mr-2" /> Remove Entry
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
