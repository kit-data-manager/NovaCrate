import { ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    ArrowLeftRight,
    EllipsisVertical,
    Eraser,
    Text,
    TextIcon,
    Trash,
    TypeIcon
} from "lucide-react"

export function TextField({
    value,
    onChange
}: {
    value: string
    onChange: (value: ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <div className="flex w-full relative">
            <TypeIcon className="w-4 h-4 absolute left-2.5 top-3 pointer-events-none text-muted-foreground" />
            <Input value={value} onChange={onChange} className="self-center rounded-r-none pl-9" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-l-0 rounded-l-none">
                        <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>
                        <Eraser className="w-4 h-4 mr-2" /> Clear
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <ArrowLeftRight className="w-4 h-4 mr-2" /> Change Type
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Trash className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
