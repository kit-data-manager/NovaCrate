import { useMemo } from "react"
import { toArray } from "@/lib/utils"
import { useEditorState } from "@/components/editor-state"
import { Error } from "@/components/error"

export function UnknownTypeWarning({ entityType }: { entityType: string | string[] }) {
    const crateContext = useEditorState.useCrateContext()

    const notResolvable = useMemo(() => {
        const arr = toArray(entityType)
        return arr
            .map((type) => {
                return { type, resolved: crateContext.resolve(type) }
            })
            .filter((e) => e.resolved === null)
    }, [crateContext, entityType])

    if (notResolvable.length === 0) return null
    else
        return (
            <Error
                warn
                className="mt-4"
                error={
                    <div>
                        The following types of this entity could not be resolved in the current
                        context: {notResolvable.map((e) => e.type).join(", ")}. Some features will
                        be limited. Please try to specify a valid type using the JSON Editor or add
                        the missing type to your context in the Context tab.
                    </div>
                }
            />
        )
}
