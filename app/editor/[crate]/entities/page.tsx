import { Nav } from "@/components/nav"
import { EntityEditor } from "@/components/entity-editor"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

const DemoEntityData: IFlatEntity = {
    "@id": "MaxMustermann",
    "@type": "Person",
    givenName: ["Max", "Maxi", "Maximal"],
    additionalName: "Mustermann",
    follows: {
        "@id": "MonikaMusterfrau"
    }
}

export default function Entities() {
    return (
        <Nav>
            <ResizablePanelGroup direction={"horizontal"}>
                <ResizablePanel defaultSize={20} minSize={10}>
                    <div className="p-4">Entity Browser</div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={80} minSize={40}>
                    <div className="p-4">
                        <EntityEditor entityData={DemoEntityData} />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </Nav>
    )
}
