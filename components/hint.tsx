import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useLocalStorage } from "usehooks-ts"
import { PropsWithChildren, useCallback, useState } from "react"

export type HintShowBehaviour = number | false

export function showHint(showBehaviour: HintShowBehaviour) {
    if (typeof showBehaviour === "number") {
        return Date.now() > showBehaviour
    } else return false
}

export function Hint({
    children,
    name,
    className
}: PropsWithChildren<{ name: string; className?: string }>) {
    const [showBehaviour, setShowBehaviour] = useLocalStorage<HintShowBehaviour>(
        "hint-behaviour-" + name,
        0
    )
    const [hideForever, setHideForever] = useState(false)

    const onHideClick = useCallback(() => {
        if (hideForever) {
            setShowBehaviour(false)
        } else {
            setShowBehaviour(Date.now() + 86400000)
        }
    }, [hideForever, setShowBehaviour])

    if (children && showHint(showBehaviour)) {
        return (
            <Alert className={className}>
                {children}
                <div className="flex justify-end items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hideForever"
                            checked={hideForever}
                            onCheckedChange={(e) => setHideForever(!!e)}
                        />
                        <label htmlFor="hideForever" className="text-sm">
                            Don&apos;t show again
                        </label>
                    </div>
                    <Button variant="secondary" size="sm" onClick={onHideClick}>
                        Close Hint
                    </Button>
                </div>
            </Alert>
        )
    } else return null
}
