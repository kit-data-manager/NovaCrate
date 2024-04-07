import { EntityEditor } from "@/components/editor/entity-editor"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { EntityBrowser } from "@/components/entity-browser"
import { EntityEditorTabs } from "@/components/editor/entity-editor-tabs"

const DemoEntityData: IFlatEntity = {
    "@id": "#max-mustermann",
    "@type": "Person",
    givenName: ["Max", '"Maxi"'],
    familyName: "Mustermann",
    follows: {
        "@id": "#monika-musterfrau"
    },
    affiliation: {
        "@id": ""
    },
    birthPlace: {
        "@id": ""
    },
    children: {
        "@id": ""
    }
}

export default function Entities() {
    return (
        <ResizablePanelGroup direction={"horizontal"}>
            <ResizablePanel defaultSize={20} minSize={10}>
                <div className="h-full w-full overflow-auto">
                    <EntityBrowser />
                </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={80} minSize={40}>
                <div className="h-full w-full overflow-auto">
                    <EntityEditorTabs />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
