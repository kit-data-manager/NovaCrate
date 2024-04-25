import { useContext, useMemo } from "react"
import { CrateEditorContext } from "@/components/crate-editor-provider"

export function useAutoId(name: string) {
    const { getEntity } = useContext(CrateEditorContext)

    return useMemo(() => {
        let generated = "#" + encodeURIComponent(name.toLowerCase().trim().replaceAll(" ", "-"))
        let maxIterations = 10
        while (getEntity(generated)) {
            if (maxIterations-- < 0) throw "Could not generate a unique id after 10 attempts"
            generated += "-1"
        }
        return generated
    }, [getEntity, name])
}
