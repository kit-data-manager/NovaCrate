"use client"

import { Button } from "@/components/ui/button"
import { RotatingText } from "@/components/ui/rotating-text"
import { ShowcaseBlock } from "@/components/info/showcase-block"
import Link from "next/link"
import {
    ArrowDown,
    ArrowRight,
    Braces,
    Bug,
    Folder,
    GitFork,
    Library,
    LockOpen,
    Moon,
    Notebook,
    PackageIcon,
    PackageSearch,
    Sparkle,
    Sun
} from "lucide-react"
import { Footer } from "@/components/footer"
import { useTheme } from "next-themes"
import { LightRays } from "@/components/ui/light-rays"
import { IconBlock } from "@/components/info/icon-block"
import { FAQ } from "@/components/info/faq"
import { ChangelogModal } from "@/components/changelog-modal"

export default function Home() {
    const theme = useTheme()

    return (
        <div className="scroll-smooth">
            <LightRays />
            <div className="grid grid-cols-[1fr_minmax(400px,1600px)_1fr] max-w-full mb-16 lg:mx-16 mx-4">
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
                        Web-based editor for{" "}
                        <RotatingText
                            containerClassName="hidden lg:block"
                            text={["creating", "editing", "visualizing", "validating"]}
                        />
                        Research Object Crates
                    </h2>
                    <Link href={"/editor"}>
                        <Button size="lg">
                            Open NovaCrate <ArrowRight />
                        </Button>
                    </Link>
                    <div className="text-muted-foreground text-sm">
                        NovaCrate is free and open-source (Apache-2.0 license)
                    </div>
                </div>
                <div className="col-start-2 space-y-24">
                    <div className="flex justify-center items-center flex-col gap-8">
                        <div className="max-w-175 text-center">
                            NovaCrate is a web-based interactive editor for editing, visualizing and
                            validating Research Object Crates directly in the browser. Easily create
                            RO-Crates describing your research data and export to a variety of
                            file-formats. Check out some key features of NovaCrate below.
                        </div>
                        <ArrowDown className="size-8 animate-bounce" />
                    </div>
                    <div className="pt-12 space-y-8">
                        <div className="text-4xl font-bold">Feature Overview</div>
                        <div className="flex justify-center gap-8 flex-wrap">
                            <IconBlock href={"#entity-editor"} Icon={PackageSearch}>
                                Entity Editor
                            </IconBlock>
                            <IconBlock href="#file-explorer" Icon={Folder}>
                                File Explorer
                            </IconBlock>
                            <IconBlock href="#metadata-graph" Icon={GitFork}>
                                Metadata Graph
                            </IconBlock>
                            <IconBlock Icon={Braces}>JSON Editor</IconBlock>
                            <IconBlock Icon={Library}>Context Editor</IconBlock>
                            <IconBlock Icon={Notebook}>ELN Support</IconBlock>
                            <IconBlock href="#validation" Icon={Bug}>
                                Live Validation
                            </IconBlock>
                            <IconBlock href={"#configuration"} Icon={Sparkle}>
                                Custom Schemas
                            </IconBlock>
                            <IconBlock
                                href={"https://github.com/kit-data-manager/NovaCrate"}
                                Icon={LockOpen}
                            >
                                Open Source
                            </IconBlock>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="text-4xl font-bold">Core Features of NovaCrate</div>
                        <div className="space-y-12">
                            <ShowcaseBlock
                                id={"entity-editor"}
                                title={"Entity Editor"}
                                imgLight={"/img/editor-light3.png"}
                                imgDark={"/img/editor-dark3.png"}
                                alt={"NovaCrate Editor capabilities showcase"}
                                tip={
                                    "While working on an entity, NovaCrate will show you which properties have been added, removed or modified using colored highlights."
                                }
                            >
                                <p>
                                    The main strength of NovaCrate is it&apos;s usability-focused
                                    entity editing approach. The entity browser and the global
                                    search make it easy to find the entity you want to work on. The
                                    entities you are currently working on are displayed in a tabbed
                                    interface, so you can quickly switch between the entities you
                                    are working on.
                                </p>

                                <p>
                                    To ease the learning curve for beginners, rich property
                                    descriptions and type checks are included. Each property
                                    provides input fields that match their expected value.
                                    Referential properties automatically restrict the reference to
                                    matching target entities.
                                </p>

                                <p>
                                    While describing your research data, you can open a preview of
                                    any file in the crate on the right side of the editor, allowing
                                    you to easily integrate information already present in your
                                    research data.
                                </p>
                            </ShowcaseBlock>
                            <ShowcaseBlock
                                id={"file-explorer"}
                                title={"Integrated File Explorer"}
                                imgLight={"/img/file-explorer-light3.png"}
                                imgDark={"/img/file-explorer-dark3.png"}
                                alt={"NovaCrate File Explorer capabilities showcase"}
                                rtl
                                tip={
                                    " You can view some supported file types directly in the editor, which can be very handy when manually extracting metadata from, e.g., a PDF file."
                                }
                            >
                                <p>
                                    NovaCrate provides an in-app file explorer that lets you view
                                    the contents of your Research Object Crate through a file-tree.
                                    You can preview files in your RO-Crate through a double-click
                                    (only supported for some common file formats) The file explorer
                                    allows easily uploading new files to the crate, as well as
                                    renaming or removing files and folders in the crate in case of
                                    errors or mistakes.
                                </p>
                                <p>
                                    To help you keep track of your metadata, a toggle at the top of
                                    the file explorer allows displaying the links between your
                                    research data and associated metadata. This way, you can
                                    directly see which metadata entities correspond to your research
                                    files and folders, while also allowing you to directly create
                                    matching metadata entities for files or folders that are not
                                    described yet.
                                </p>
                            </ShowcaseBlock>
                            <ShowcaseBlock
                                id={"metadata-graph"}
                                title={"Metadata Graph"}
                                imgLight={"/img/graph-light3.png"}
                                imgDark={"/img/graph-dark3.png"}
                                alt={"NovaCrate Graph capabilities showcase"}
                                tip={
                                    "You can drag-and-drop new connections between entities or remove existing ones directly in the graph."
                                }
                            >
                                <p>
                                    As the metadata within a Research Object Crate is organised in
                                    the JSON Linked Data format, the references between metadata
                                    entities are of great importance. NovaCrate provides a
                                    graph-visualization of the references between the metadata
                                    entities of your crate. This allows you to instantly understand
                                    the structure of your metadata, and find possible issues or
                                    potential for reuse.
                                </p>
                                <p>
                                    Furthermore, the Metadata Graph is interactive. By simply
                                    dragging-and-dropping between the connection ports of the
                                    metadata entities, you can create new references or edit
                                    existing ones. You can also add new properties to your metadata
                                    entities, matching the reference that you draw between metadata
                                    entities.
                                </p>
                            </ShowcaseBlock>
                            <div className="flex justify-center">
                                <Link href={"/editor"}>
                                    <Button size="lg">
                                        Open NovaCrate <ArrowRight />
                                    </Button>
                                </Link>
                            </div>
                            <ShowcaseBlock
                                id={"validation"}
                                title={"Validation"}
                                imgLight={"/img/validation-light2.png"}
                                imgDark={"/img/validation-dark2.png"}
                                rtl
                                alt={"NovaCrate Validation capabilities showcase"}
                                tip={
                                    "  Validation may be incomplete or inconsistent. You can disable the validation in the settings."
                                }
                            >
                                <p>
                                    NovaCrate implements numerous validation rules to make sure the
                                    Research Object Crate you work on is conformant to the current
                                    specification and follows best practices. Validation issues are
                                    reported in a granular manner directly where the occur - either
                                    on Crate-level, Entity-level or Property-level, removing the
                                    need for guessing where an issue has occurred.
                                </p>
                                <p>
                                    In addition to the best-practice-validation, NovaCrate also
                                    validates if the references between your metadata entities are
                                    valid, and if there are any properties present with invalid
                                    values.
                                </p>
                            </ShowcaseBlock>
                            <ShowcaseBlock
                                id={"configuration"}
                                title={"Configuration"}
                                imgLight={"/img/settings-light3.png"}
                                imgDark={"/img/settings-dark3.png"}
                                tip={"Schemas are loaded on-demand, only when they are needed."}
                                alt={"NovaCrate Configuration capabilities showcase"}
                            >
                                The underlying schemas used for type inference and validation can be
                                configured on the fly. By setting a download URL for a schema in the
                                JSON-LD or Turtle file format, the corresponding types directly
                                become available in the editor. Note that you have to take care of
                                maintaining a proper JSON-LD context in your crate by yourself - if
                                you extend the default context.
                            </ShowcaseBlock>
                            <ShowcaseBlock
                                title={"Quickstart"}
                                imgLight={"/img/quickstart-light.png"}
                                imgDark={"/img/quickstart-dark.png"}
                                tip={"Feel free to bring your own RO-Crate to try out NovaCrate!"}
                                alt={"NovaCrate Quickstart capabilities showcase"}
                                rtl
                            >
                                Ready to try out NovaCrate? Take a look at some of the examples in
                                the main menu, by clicking the Quickstart button. NovaCrate is
                                open-source and free to use, licensed under the Apache-2.0 license.
                                All data stays on your device.
                            </ShowcaseBlock>
                        </div>
                    </div>

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

                    <div className="space-y-8">
                        <div className="text-4xl font-bold">Frequently Asked Questions</div>
                        <div className="space-y-4">
                            <FAQ question={"Where is my data stored?"}>
                                All data stays on your local device. Even though NovaCrate is server
                                through the web browser, your data never leaves your device.
                            </FAQ>
                            <FAQ question={"What has changed in the last update?"}>
                                A changelog is available in the main menu of the editor, as well as
                                through this button:
                                <div className="inline-block pl-2">
                                    <ChangelogModal />
                                </div>
                            </FAQ>
                            <FAQ question={"How can I get in contact?"}>
                                Issues and suggestions can be reported using the GitHub Repository.
                                Also feel free to directly contact the author and maintainer at{" "}
                                <Link
                                    href={"mailto:christopher.raquet@kit.edu"}
                                    className="underline"
                                >
                                    christopher.raquet@kit.edu
                                </Link>
                            </FAQ>
                            <FAQ
                                question={"Who is developing, maintaining, and hosting NovaCrate?"}
                            >
                                NovaCrate is in development at the department of Data Exploitation
                                Methods of the Scientific Computing Center at Karlsruhe Institute of
                                Technology since April of 2024.
                            </FAQ>
                            <FAQ
                                question={
                                    "Which Research Object Crate versions does NovaCrate support?"
                                }
                            >
                                NovaCrate supports the{" "}
                                <Link href={"https://w3id.org/ro/crate/1.1"} className="underline">
                                    v1.1
                                </Link>{" "}
                                and{" "}
                                <Link href={"https://w3id.org/ro/crate/1.2"} className="underline">
                                    v1.2
                                </Link>{" "}
                                version of the Research Object Crate specification. You can extend
                                NovaCrate with custom schemas (JSON-LD, TTL) to support any
                                additional entity types and property types you need.
                            </FAQ>
                            <FAQ question={"Can I host NovaCrate on my own server?"}>
                                Yes, NovaCrate is open-source and can be hosted on any server. You
                                can either use the Docker Images distributed through the{" "}
                                <Link
                                    href={"https://github.com/kit-data-manager/NovaCrate"}
                                    className="underline"
                                >
                                    NovaCrate GitHub Repository
                                </Link>
                                , or build it from source.
                            </FAQ>
                            <FAQ question={"Is NovaCrate extensible?"}>
                                You can integrate custom schemas (JSON-LD, TTL) to define your own
                                entity types and property types. While there is no plugin mechanism
                                implemented, you can fork NovaCrate and change the implementation
                                according to your needs. The code is well-structured and can be
                                adapted to many different usage scenarios.
                            </FAQ>
                            <FAQ
                                question={
                                    "Can I integrate NovaCrate into my application/workflow/repository?"
                                }
                            >
                                Yes, you can use NovaCrate as permitted by the Apache-2.0 license.
                                Feel free to get in contact for assistance, or to integrate your
                                Research Object Crate repository directly into NovaCrate.
                            </FAQ>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
