import { ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, EllipsisVertical, Eraser, Trash, TypeIcon } from "lucide-react"
import TypeSelectDropdown from "@/components/editor/type-select-dropdown"

export function TextField({
    value,
    onChange,
    propertyRange
}: {
    value: string
    onChange: (value: ChangeEvent<HTMLInputElement>) => void
    propertyRange?: string[]
}) {
    return (
        <div className="flex w-full relative">
            <TypeIcon className="w-4 h-4 absolute left-2.5 top-3 pointer-events-none text-muted-foreground" />
            <Input value={value} onChange={onChange} className="self-center rounded-r-none pl-9" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-l-0 rounded-l-none px-2">
                        <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>
                        <Eraser className="w-4 h-4 mr-2" /> Clear
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <ArrowLeftRight className="w-4 h-4 mr-2" /> Change Type
                        </DropdownMenuSubTrigger>
                        <TypeSelectDropdown
                            sub
                            propertyRange={propertyRange}
                            onPropertyTypeSelect={() => {}}
                        />
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem>
                        <Trash className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
