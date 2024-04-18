import { ChangeEvent, memo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { TypeIcon } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"

export const TextField = memo(function TextField({
    value,
    onChange,
    propertyRange,
    onRemoveEntry
}: {
    value: string
    onChange: (value: string) => void
    propertyRange?: string[]
    onRemoveEntry: () => void
}) {
    const onInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value)
        },
        [onChange]
    )

    return (
        <div className="flex w-full relative">
            <TypeIcon className="w-4 h-4 absolute left-2.5 top-3 pointer-events-none text-muted-foreground" />
            <Input
                value={value}
                onChange={onInputChange}
                className="self-center rounded-r-none pl-9"
            />
            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
            />
        </div>
    )
})
