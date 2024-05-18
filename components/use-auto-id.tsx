import { useMemo } from "react"
import { useEditorState } from "@/components/editor-state"

export function useAutoId(name: string) {
    const entities = useEditorState.useEntities()

    return useMemo(() => {
        let generated = "#" + encodeURIComponent(name.toLowerCase().trim().replaceAll(" ", "-"))
        let maxIterations = 10
        while (entities.has(generated)) {
            if (maxIterations-- < 0) throw "Could not generate a unique id after 10 attempts"
            generated += "-1"
        }
        return generated
    }, [entities, name])
}
