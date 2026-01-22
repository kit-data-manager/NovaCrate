"use client"

import { Button } from "@/components/ui/button"
import { RotatingText } from "@/components/ui/rotating-text"
import { ShowcaseBlock } from "@/components/info/showcase-block"
import Link from "next/link"
import { ArrowDown, ArrowRight, Moon, PackageIcon, Sun } from "lucide-react"
import { Footer } from "@/components/footer"
import { useTheme } from "next-themes"

export default function Home() {
    const theme = useTheme()

    return (
        <div>
            <div className="grid grid-cols-[1fr_minmax(400px,1600px)_1fr] max-w-full mb-16">
                <Button
                    size="lg"
                    variant="link"
                    className="col-start-2 rounded-none border-r-0 h-12"
                    onClick={() =>
                        theme.setTheme(theme.resolvedTheme === "light" ? "dark" : "light")
                    }
                    suppressHydrationWarning
                >
                    {theme.resolvedTheme === "light" ? (
                        <Sun className="w-6 h-6 mr-3 shrink-0" suppressHydrationWarning />
                    ) : (
                        <Moon className="w-6 h-6 mr-3 shrink-0" suppressHydrationWarning />
                    )}
                </Button>
                <div className="col-start-2 h-[calc(100vh-300px)] min-h-75 flex flex-col justify-center items-center gap-4">
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
                        imgLight={"/img/editor-light3.png"}
                        imgDark={"/img/editor-dark3.png"}
                        alt={"NovaCrate Editor capabilities showcase"}
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
                        imgLight={"/img/file-explorer-light3.png"}
                        imgDark={"/img/file-explorer-dark3.png"}
                        alt={"NovaCrate File Explorer capabilities showcase"}
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
                        imgLight={"/img/graph-light3.png"}
                        imgDark={"/img/graph-dark3.png"}
                        alt={"NovaCrate Graph capabilities showcase"}
                        tip={
                            "You can drag-and-drop new connections between entities or remove existing ones directly in the graph."
                        }
                    >
                        RO-Crates use JSON-LD as the underlying file type to describe their
                        metadata. This linked-data approach can naturally be visualized using a
                        graph. NovaCrate provides a graph view to make it easy to see the
                        relationships between your entities.
                    </ShowcaseBlock>
                    <div className="flex justify-center">
                        <Link href={"/editor"}>
                            <Button size="lg">
                                Open NovaCrate <ArrowRight />
                            </Button>
                        </Link>
                    </div>
                    <ShowcaseBlock
                        title={"Validation"}
                        imgLight={"/img/validation-light2.png"}
                        imgDark={"/img/validation-dark2.png"}
                        rtl
                        alt={"NovaCrate Validation capabilities showcase"}
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
                        imgLight={"/img/settings-light3.png"}
                        imgDark={"/img/settings-dark3.png"}
                        tip={"Schemas are loaded on-demand, only when they are needed."}
                        alt={"NovaCrate Configuration capabilities showcase"}
                    >
                        The underlying schemas used for type inference and validation can be
                        configured on the fly. By setting a download URL for a schema in the JSON-LD
                        or Turtle file format, the corresponding types directly become available in
                        the editor. Note that you have to take care of maintaining a proper JSON-LD
                        context in your crate by yourself - if you extend the default context.
                    </ShowcaseBlock>
                    <ShowcaseBlock
                        title={"Quickstart"}
                        imgLight={"/img/quickstart-light.png"}
                        imgDark={"/img/quickstart-dark.png"}
                        tip={"Feel free to bring your own RO-Crate to try out NovaCrate!"}
                        alt={"NovaCrate Quickstart capabilities showcase"}
                        rtl
                    >
                        Ready to try out NovaCrate? Simply use the Quickstart button at the top of
                        the main menu after opening NovaCrate.
                    </ShowcaseBlock>
                    <div className="flex justify-center">
                        <Link href={"/editor"}>
                            <Button size="lg">
                                Open NovaCrate <ArrowRight />
                            </Button>
                        </Link>
                    </div>
                    <div className="text-center text-muted-foreground text-sm">
                        RO-Crates used as examples on this page are{" "}
                        <Link
                            className="underline"
                            href={
                                "https://github.com/TheELNConsortium/TheELNFileFormat/tree/master/examples/elabftw"
                            }
                        >
                            eLabFTW examples
                        </Link>{" "}
                        (MIT license) as well as the{" "}
                        <Link
                            className="underline"
                            href={
                                "https://www.researchobject.org/ro-crate/specification/1.2/index.html"
                            }
                        >
                            RO-Crate Specification v1.2 JSON-LD
                        </Link>{" "}
                        (Apache-2.0 license)
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
