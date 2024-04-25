import { useContext, useMemo } from "react"
import { CrateEditorContext } from "@/components/crate-editor-provider"
import { toArray } from "@/lib/utils"
import { Warn } from "@/components/error"

export function UnknownTypeWarning({ entityType }: { entityType: string | string[] }) {
    const { crateContext } = useContext(CrateEditorContext)

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
            <Warn
                className="mt-4"
                text={
                    <div>
                        The following types of this entity could not be resolved in the current
                        context: {notResolvable.map((e) => e.type).join(", ")}. Some features will
                        be limited.
                    </div>
                }
            />
        )
}
