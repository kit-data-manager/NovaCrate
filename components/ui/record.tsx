import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusIcon, TrashIcon } from "lucide-react"

export function RecordInput(props: {
    value: [string, string][]
    onValueChange?: (value: [string, string][]) => void
    exampleKey?: string
    exampleValue?: string
    itemName?: string
}) {
    const update = useCallback(
        (cb: (prev: [string, string][]) => [string, string][]) => {
            if (props.onValueChange) props.onValueChange(cb(props.value))
        },
        [props]
    )

    const addPair = useCallback(() => {
        update((prev) => [...prev, ["", ""]])
    }, [update])

    const removePair = useCallback(
        (index: number) => {
            update((prev) => prev.filter((_, i) => i !== index))
        },
        [update]
    )

    const updateKey = useCallback(
        (index: number, value: string) => {
            update((prev) => prev.map((h, i) => (i === index ? [value, h[1]] : h)))
        },
        [update]
    )

    const updateValue = useCallback(
        (index: number, value: string) => {
            update((prev) => prev.map((h, i) => (i === index ? [h[0], value] : h)))
        },
        [update]
    )

    return (
        <div>
            <div className="space-y-2 mb-2 max-h-50 overflow-y-auto border rounded-lg p-1">
                {props.value.map(([key, value], i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Input
                            value={key}
                            onChange={(e) => updateKey(i, e.target.value)}
                            placeholder={props.exampleKey}
                        />
                        <Input
                            value={value}
                            onChange={(e) => updateValue(i, e.target.value)}
                            placeholder={props.exampleValue}
                        />
                        <Button variant="destructive" onClick={() => removePair(i)}>
                            <TrashIcon className="size-4" />
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPair}>
                    <PlusIcon className="size-4" /> Add {props.itemName || "Item"}
                </Button>
            </div>
        </div>
    )
}
