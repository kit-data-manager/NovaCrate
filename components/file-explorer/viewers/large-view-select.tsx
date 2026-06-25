import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { VIEWERS, ViewerType } from "@/lib/file-preview"

export function ViewSelectButton({
    label,
    type,
    setType
}: {
    label: string
    type: ViewerType
    setType: (type: ViewerType) => void
}) {
    return (
        <Button
            className="w-sm rounded-none first:rounded-t-lg last:rounded-b-lg border-b-0 last:border-b flex justify-between"
            variant="outline"
            onClick={() => setType(type)}
        >
            {label}
            <ArrowRight className="size-4" />
        </Button>
    )
}

export function LargeViewSelect({
    exclude,
    setType
}: {
    setType: (type: ViewerType) => void
    exclude?: ViewerType[]
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-8 h-full bg-background">
            How do you want to view this file?
            <div className="flex flex-col items-center">
                {VIEWERS.filter((v) => (exclude ? !exclude.includes(v.type) : true)).map((v) => (
                    <ViewSelectButton
                        key={v.type}
                        label={v.displayName + " " + (v.subtitle ?? "")}
                        type={v.type}
                        setType={setType}
                    />
                ))}
            </div>
            <div className="text-sm text-muted-foreground text-center">
                You can always change this using the menu that will appear at the bottom. <br />
                {exclude ? (
                    <>Some options were excluded as they are not viable for this file.</>
                ) : null}
            </div>
        </div>
    )
}
