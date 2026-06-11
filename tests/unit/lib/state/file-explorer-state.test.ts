/**
 * @jest-environment jsdom
 */

import { ViewerType } from "@/lib/file-preview"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"

const TAB_HTML: IFilePreviewTab = {
    filePath: "index.html",
    fileName: "index.html",
    viewerType: ViewerType.TEXT
}
const TAB_JS: IFilePreviewTab = {
    filePath: "src/app.ts",
    fileName: "app.ts",
    viewerType: ViewerType.TEXT
}
const TAB_CSS: IFilePreviewTab = {
    filePath: "src/styles.css",
    fileName: "styles.css",
    viewerType: ViewerType.TEXT
}
interface IFilePreviewTab {
    filePath: string
    fileName: string
    viewerType: ViewerType
}

function resetStore() {
    useFileExplorerState.setState({
        filePreviewTabs: [],
        activeFilePreviewTabPath: undefined
    })
}

describe("useFileExplorerState", () => {
    beforeEach(() => {
        resetStore()
    })

    describe("initial state", () => {
        it("should have no tabs and no active tab", () => {
            const state = useFileExplorerState.getState()
            expect(state.filePreviewTabs).toEqual([])
            expect(state.activeFilePreviewTabPath).toBeUndefined()
        })
    })

    describe("openTab", () => {
        it("should add a new tab", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            const state = useFileExplorerState.getState()
            expect(state.filePreviewTabs).toHaveLength(1)
            expect(state.filePreviewTabs[0]).toEqual(TAB_HTML)
        })

        it("should not focus the tab by default when focus is not set", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            expect(useFileExplorerState.getState().activeFilePreviewTabPath).toBeUndefined()
        })

        it("should focus the tab when focus is true", () => {
            useFileExplorerState.getState().openTab(TAB_HTML, true)
            expect(useFileExplorerState.getState().activeFilePreviewTabPath).toBe(TAB_HTML.filePath)
        })

        it("should replace an existing tab with the same normalized path", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            const updated = { ...TAB_HTML, viewerType: ViewerType.TEXT }
            useFileExplorerState.getState().openTab(updated)
            const state = useFileExplorerState.getState()
            expect(state.filePreviewTabs).toHaveLength(1)
            expect(state.filePreviewTabs[0].viewerType).toBe(ViewerType.TEXT)
        })

        it("should treat paths with ./ prefix as equivalent", () => {
            useFileExplorerState.getState().openTab({
                filePath: "./index.html",
                fileName: "index.html",
                viewerType: ViewerType.TEXT
            })
            useFileExplorerState.getState().openTab(TAB_HTML)
            expect(useFileExplorerState.getState().filePreviewTabs).toHaveLength(1)
        })

        it("should allow tabs for different paths", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().openTab(TAB_JS)
            const state = useFileExplorerState.getState()
            expect(state.filePreviewTabs).toHaveLength(2)
        })
    })

    describe("focusTab", () => {
        it("should focus an existing tab", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().openTab(TAB_JS)
            useFileExplorerState.getState().focusTab(TAB_JS.filePath)
            expect(useFileExplorerState.getState().activeFilePreviewTabPath).toBe(TAB_JS.filePath)
        })

        it("should focus an existing tab using a normalized path", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().focusTab("./index.html")
            expect(useFileExplorerState.getState().activeFilePreviewTabPath).toBe("./index.html")
        })

        it("should warn and do nothing when tab does not exist", () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation()
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().focusTab("nonexistent.ts")
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("nonexistent.ts"))
            expect(useFileExplorerState.getState().activeFilePreviewTabPath).toBeUndefined()
            warnSpy.mockRestore()
        })
    })

    describe("closeTab", () => {
        it("should remove the tab from the list", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().closeTab(TAB_HTML.filePath)
            expect(useFileExplorerState.getState().filePreviewTabs).toHaveLength(0)
        })

        it("should remove a tab by a normalized path", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().closeTab("./index.html")
            expect(useFileExplorerState.getState().filePreviewTabs).toHaveLength(0)
        })

        it("should focus the tab to the left when closing a middle tab", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().openTab(TAB_JS, true)
            useFileExplorerState.getState().openTab(TAB_CSS)
            useFileExplorerState.getState().closeTab(TAB_JS.filePath)
            expect(useFileExplorerState.getState().activeFilePreviewTabPath).toBe(TAB_HTML.filePath)
        })

        it("should focus the tab to the right when closing the leftmost tab", () => {
            useFileExplorerState.getState().openTab(TAB_HTML, true)
            useFileExplorerState.getState().openTab(TAB_JS)
            useFileExplorerState.getState().openTab(TAB_CSS)
            useFileExplorerState.getState().closeTab(TAB_HTML.filePath)
            expect(useFileExplorerState.getState().activeFilePreviewTabPath).toBe(TAB_JS.filePath)
        })

        it("should set activeTab to undefined when closing the last tab", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().closeTab(TAB_HTML.filePath)
            expect(useFileExplorerState.getState().activeFilePreviewTabPath).toBeUndefined()
        })

        it("should be a no-op when closing a non-existent tab", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().closeTab("nonexistent.ts")
            expect(useFileExplorerState.getState().filePreviewTabs).toHaveLength(1)
        })
    })

    describe("closeOtherTabs", () => {
        it("should keep only the specified tab", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().openTab(TAB_JS)
            useFileExplorerState.getState().openTab(TAB_CSS)
            useFileExplorerState.getState().closeOtherTabs(TAB_JS.filePath)
            const state = useFileExplorerState.getState()
            expect(state.filePreviewTabs).toHaveLength(1)
            expect(state.filePreviewTabs[0].filePath).toBe(TAB_JS.filePath)
            expect(state.activeFilePreviewTabPath).toBe(TAB_JS.filePath)
        })

        it("should work with a normalized path", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().openTab(TAB_JS)
            useFileExplorerState.getState().closeOtherTabs("./src/app.ts")
            expect(useFileExplorerState.getState().filePreviewTabs).toHaveLength(1)
        })

        it("should keep no tabs when keeping a non-existent path", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().openTab(TAB_JS)
            useFileExplorerState.getState().closeOtherTabs("nonexistent.ts")
            expect(useFileExplorerState.getState().filePreviewTabs).toHaveLength(0)
        })
    })

    describe("closeAllTabs", () => {
        it("should close all tabs and clear the active tab", () => {
            useFileExplorerState.getState().openTab(TAB_HTML)
            useFileExplorerState.getState().openTab(TAB_JS)
            useFileExplorerState.getState().openTab(TAB_CSS)
            useFileExplorerState.getState().closeAllTabs()
            const state = useFileExplorerState.getState()
            expect(state.filePreviewTabs).toHaveLength(0)
            expect(state.activeFilePreviewTabPath).toBeUndefined()
        })
    })
})
