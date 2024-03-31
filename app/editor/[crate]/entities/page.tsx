import { Nav } from "@/components/nav"
import { EntityEditor } from "@/components/editor/entity-editor"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { EntityBrowser } from "@/components/entity-browser"

const DemoEntityData: IFlatEntity = {
    "@id": "http://localhost/max-mustermann",
    "@type": "Person",
    givenName: ["Max", '"Maxi"'],
    familyName: "Mustermann",
    follows: {
        "@id": "http://localhost/monika-musterfrau"
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
        <Nav>
            <ResizablePanelGroup direction={"horizontal"}>
                <ResizablePanel defaultSize={20} minSize={10}>
                    <div className="p-4">
                        <EntityBrowser />
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={80} minSize={40}>
                    <div className="h-full w-full overflow-auto">
                        <EntityEditor entityData={DemoEntityData} />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </Nav>
    )
}
