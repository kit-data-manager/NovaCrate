import { Button } from "@/components/ui/button"
import { RotatingText } from "@/components/ui/rotating-text"
import { ShowcaseBlock } from "@/components/info/ShowcaseBlock"
import Link from "next/link"
import { ArrowDown, ArrowRight, PackageIcon } from "lucide-react"
import { Footer } from "@/components/footer"

export default function Home() {
    return (
        <div>
            <div className="grid grid-cols-[1fr_max(1200px)_1fr] mb-16">
                <div className="col-start-2 h-[calc(100vh-300px)] min-h-[300px] flex flex-col justify-center items-center gap-4">
                    <h1 className="flex items-center gap-4 text-6xl font-extrabold">
                        <PackageIcon className="h-full w-auto aspect-square" /> NovaCrate
                    </h1>
                    <h2 className="text-2xl flex items-center gap-2">
                        Web-based interactive editor for{" "}
                        <RotatingText text={["creating", "editing", "visualizing", "validating"]} />
                        RO-Crates.
                    </h2>
                    <Link href={"/editor"}>
                        <Button size="lg">
                            Open NovaCrate <ArrowRight />
                        </Button>
                    </Link>
                </div>
                <div className="col-start-2 space-y-24">
                    <div className="flex justify-center items-center flex-col gap-2">
                        Check out some key features of NovaCrate below
                        <ArrowDown className="size-6" />
                    </div>
                    <ShowcaseBlock
                        title={"Editor"}
                        imgLight={"/img/editor-light.png"}
                        imgDark={"/img/editor-dark.png"}
                        tip={
                            "While working on an entity, NovaCrate will show you which properties have been added, removed or modified using colored highlights."
                        }
                    >
                        The main strength of NovaCrate is it&apos;s usability-focused entity editing
                        approach. The entity browser and the global search make it easy to find the
                        entity you want to work on. The entities you are currently working on are
                        displayed in a tabbed interface, so you can quickly switch between the parts
                        you are working on. Property descriptions and type checking are also
                        provided.
                    </ShowcaseBlock>
                    <ShowcaseBlock
                        title={"File Explorer"}
                        imgLight={"/img/file-explorer-light.png"}
                        imgDark={"/img/file-explorer-dark.png"}
                        rtl
                        tip={
                            " You can view some supported file types directly in the editor, which can be very handy when manually extracting metadata from a PDF file for example."
                        }
                    >
                        The general purpose of an RO-Crate is to package research data together with
                        its metadata. To efficiently make use of RO-Crates, NovaCrate provides an
                        in-app file explorer to inspect and change the contents of your crate.
                    </ShowcaseBlock>
                    <ShowcaseBlock
                        title={"Graph"}
                        imgLight={"/img/graph-light.png"}
                        imgDark={"/img/graph-dark.png"}
                        tip={
                            "You can drag-and-drop new connections between entities or remove existing ones directly in the graph."
                        }
                    >
                        RO-Crates use JSON-LD as the underlying file type to describe their
                        metadata. This linked-data approach can naturally be visualized using a
                        graph. NovaCrate provides a graph view to make it easy to see the
                        relationships between your entities.
                    </ShowcaseBlock>
                    <ShowcaseBlock
                        title={"Validation"}
                        imgLight={"/img/validation-light.png"}
                        imgDark={"/img/validation-dark.png"}
                        rtl
                        tip={
                            "  Validation may be incomplete or inconsistent. You can disable the validation in the settings."
                        }
                    >
                        NovaCrate implements numerous validation rules to make sure the RO-Crate you
                        work on is conformant to the specification. While there are certainly many
                        more rules to add, the current set already allows catching some common
                        mistakes.
                    </ShowcaseBlock>
                    <ShowcaseBlock
                        title={"Configuration"}
                        imgLight={"/img/settings-light.png"}
                        imgDark={"/img/settings-dark.png"}
                        tip={"Schemas are loaded on-demand, only when they are needed."}
                    >
                        The underlying schemas used for type inference and validation can be
                        configured on the fly. By setting a download URL for a schema in the JSON-LD
                        or Turtle file format, the corresponding types directly become available in
                        the editor. Note that you have to take care of maintaining a proper JSON-LD
                        context in your crate by yourself - if you extend the default context.
                    </ShowcaseBlock>
                </div>
            </div>
            <Footer />
        </div>
    )
}
