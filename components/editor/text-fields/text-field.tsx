import { ChangeEvent, memo, useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import { ChevronRight, TypeIcon } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PropertyType } from "@/lib/property"

export const TextField = memo(function TextField({
    value,
    onChange,
    onChangeType,
    propertyRange,
    onRemoveEntry
}: {
    value: string
    onChange: (value: string) => void
    onChangeType: (type: PropertyType) => void
    propertyRange?: SlimClass[]
    onRemoveEntry: () => void
}) {
    const [expanded, setExpanded] = useState((value + "").length > 100)

    const onInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
            onChange(e.target.value)
        },
        [onChange]
    )

    const toggleExpanded = useCallback(() => {
        setExpanded((v) => !v)
    }, [])

    return (
        <div className="flex w-full relative group/single-property-editor">
            <TypeIcon className="size-4 absolute left-2.5 top-2.5 pointer-events-none text-muted-foreground group-hover/single-property-editor:opacity-0 transition-opacity" />
            <Button
                className={`absolute left-0.5 top-0.5 text-muted-foreground opacity-0 group-hover/single-property-editor:opacity-100 px-1.5!`}
                size={"sm"}
                variant={"ghost"}
                onClick={toggleExpanded}
                id={"textarea-toggle"}
            >
                <ChevronRight className={`size-4 ${expanded ? "rotate-90" : ""}`} />
            </Button>

            {expanded ? (
                <Textarea
                    className="self-center mr-2 pl-9"
                    value={value}
                    onChange={onInputChange}
                    rows={4}
                />
            ) : (
                <Input
                    value={value}
                    onChange={onInputChange}
                    className="self-center rounded-r-none pl-9"
                />
            )}

            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
                propertyType={PropertyType.Text}
                triggerClassName={expanded ? "border-l rounded-l-lg" : ""}
            />
        </div>
    )
})
