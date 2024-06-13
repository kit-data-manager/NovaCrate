import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { PropsWithChildren, ReactNode, useCallback, useState } from "react"

export function CollapsibleHint(props: PropsWithChildren<{ title: ReactNode }>) {
    const [isOpen, setIsOpen] = useState(false)

    const onOpenChange = useCallback((val: boolean) => {
        setIsOpen(val)
    }, [])

    return (
        <Collapsible className="border rounded-lg mb-2" open={isOpen} onOpenChange={onOpenChange}>
            <CollapsibleTrigger className="p-2 flex items-center w-full">
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                    <ChevronRight className="w-4 h-4 mr-2" />
                )}
                <div className="font-medium text-sm grow text-left">{props.title}</div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-2 pt-0 ml-6">{props.children}</CollapsibleContent>
        </Collapsible>
    )
}
