import { editorState } from "@/lib/state/editor-state"

type NovaCrateDebugTools = { [index: string]: () => unknown }

declare global {
    interface Window {
        NovaCrate: NovaCrateDebugTools
    }
}

window.NovaCrate = {
    getEditorState: () => {
        return editorState.getState()
    }
}
