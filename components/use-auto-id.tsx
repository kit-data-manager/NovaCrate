import { useMemo } from "react"
import { useEditorState } from "@/components/editor-state"
import { encodeFilePath } from "@/lib/utils"

export function useAutoId(name: string, contextual: boolean) {
    const entities = useEditorState.useEntities()

    return useMemo(() => {
        let generated = contextual
            ? "#" + encodeURIComponent(name.toLowerCase().trim().replaceAll(" ", "-"))
            : "" + encodeFilePath(name)
        let maxIterations = 10
        while (entities.has(generated)) {
            if (maxIterations-- < 0) throw "Could not generate a unique id after 10 attempts"
            generated += "-1"
        }
        return generated
    }, [entities, name])
}
