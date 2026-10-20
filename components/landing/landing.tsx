"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import { addBasePath } from "next/dist/client/add-base-path"
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
    SparklesIcon,
    Sun,
    WrenchIcon
} from "lucide-react"
import { Footer } from "@/components/footer"
import { useTheme } from "next-themes"
import { LightRays } from "@/components/ui/light-rays"
import { IconBlock } from "@/components/info/icon-block"
import { FAQ } from "@/components/info/faq"
import { ChangelogModal } from "@/components/changelog-modal"
import { PrinciplesSection } from "@/components/landing/design-principles"
import { GITHUB_REPO } from "@/lib/legals"
import { Reveal } from "@/components/landing/reveal"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { FeedbackEmbed } from "@/components/FeedbackEmbed"

function StickyNav({
    theme,
    logoRef
}: {
    theme: ReturnType<typeof useTheme>
    logoRef: React.RefObject<HTMLHeadingElement | null>
}) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = logoRef.current
        if (!el) return
        const observer = new IntersectionObserver(([entry]) => {
            setVisible(!entry.isIntersecting)
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [logoRef])

    return (
        <AnimatePresence>
            {visible && (
                <motion.header
                    initial={{ y: -70, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -70, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md"
                >
                    <div className="grid grid-cols-[1fr_minmax(400px,1600px)_1fr] max-w-full lg:mx-16 mx-4">
                        <div className="col-start-2 flex h-14 items-center justify-between">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-sm font-semibold tracking-tight"
                            >
                                <PackageIcon className="size-5" /> NovaCrate
                            </Link>
                            <nav className="flex items-center gap-1" aria-label="Main">
                                <Link
                                    href={GITHUB_REPO}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="GitHub repository"
                                    className="rounded-md p-2 opacity-60 transition-opacity hover:opacity-100"
                                >
                                    <Image
                                        src={addBasePath("/github.svg")}
                                        alt=""
                                        width="18"
                                        height="18"
                                        className="dark:invert"
                                    />
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Toggle theme"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() =>
                                        theme.setTheme(
                                            theme.resolvedTheme === "light" ? "dark" : "light"
                                        )
                                    }
                                    suppressHydrationWarning
                                >
                                    {theme.resolvedTheme === "light" ? (
                                        <Moon className="size-5" suppressHydrationWarning />
                                    ) : (
                                        <Sun className="size-5" suppressHydrationWarning />
                                    )}
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href="/editor" className="ml-1">
                                        Open NovaCrate <ArrowRight />
                                    </Link>
                                </Button>
                            </nav>
                        </div>
                    </div>
                </motion.header>
            )}
        </AnimatePresence>
    )
}

type Feature = {
    href?: string
    icon: LucideIcon
    label: string
}

const FEATURES: Feature[] = [
    { href: "#entity-editor", icon: PackageSearch, label: "Entity Editor" },
    { href: "#file-explorer", icon: Folder, label: "File Explorer" },
    { href: "#metadata-graph", icon: GitFork, label: "Metadata Graph" },
    { href: "#ai-assistant", icon: SparklesIcon, label: "AI Assistant" },
    { icon: Braces, label: "JSON Editor" },
    { icon: Library, label: "Context Editor" },
    { icon: Notebook, label: "ELN Support" },
    { href: "#validation", icon: Bug, label: "Live Validation" },
    { href: "#configuration", icon: WrenchIcon, label: "Custom Schemas" },
    {
        href: "https://github.com/kit-data-manager/NovaCrate",
        icon: LockOpen,
        label: "Open Source"
    }
]

function FeatureCarousel() {
    const reducedMotion = useReducedMotion()

    if (reducedMotion) {
        return (
            <div className="flex flex-wrap justify-center gap-8">
                {FEATURES.map((feature) => (
                    <IconBlock key={feature.label} href={feature.href} Icon={feature.icon} compact>
                        {feature.label}
                    </IconBlock>
                ))}
            </div>
        )
    }

    return (
        <div className="group relative overflow-hidden py-4 mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max animate-marquee group-hover:paused">
                {[0, 1].map((half) => (
                    <div key={half} aria-hidden={half === 1} className="flex shrink-0 gap-8 pr-8">
                        {FEATURES.map((feature) => (
                            <IconBlock
                                key={feature.label}
                                href={feature.href}
                                Icon={feature.icon}
                                compact
                            >
                                {feature.label}
                            </IconBlock>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export function Landing() {
    const theme = useTheme()
    const reducedMotion = useReducedMotion()
    const heroLogoRef = useRef<HTMLHeadingElement>(null)

    return (
        <div className="scroll-smooth">
            <StickyNav theme={theme} logoRef={heroLogoRef} />
            <LightRays />
            <div className="grid grid-cols-[1fr_minmax(400px,1600px)_1fr] max-w-full mb-16 lg:mx-16 mx-4">
                <div className="relative col-start-2 h-screen min-h-75 flex flex-col justify-center items-center gap-4">
                    <h1
                        ref={heroLogoRef}
                        className="flex items-center gap-4 text-6xl font-extrabold"
                    >
                        <PackageIcon className="h-full w-auto aspect-square" /> NovaCrate
                    </h1>
                    <h2 className="text-2xl flex items-center gap-2">
                        Web-based editor for{" "}
                        <RotatingText
                            containerClassName="hidden lg:block"
                            text={
                                reducedMotion
                                    ? ["editing"]
                                    : ["creating", "editing", "visualizing", "validating"]
                            }
                        />
                        Research Object Crates
                    </h2>

                    <Button size="lg" asChild>
                        <Link href={"/editor"}>
                            Open NovaCrate <ArrowRight />
                        </Link>
                    </Button>

                    <div className="text-muted-foreground text-sm">
                        NovaCrate is free and open-source (Apache-2.0 license)
                    </div>
                    <div className="absolute bottom-0 mb-12 text-primary">
                        <ArrowDown className="size-12 not-motion-reduce:animate-bounce" />
                    </div>
                </div>
                <div className="col-start-2 space-y-24">
                    <PrinciplesSection />
                    <div className="pt-12 space-y-8">
                        <Reveal>
                            <div className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                Feature Overview
                            </div>
                            <FeatureCarousel />
                        </Reveal>
                    </div>

                    <div className="space-y-8">
                        <div className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Core Features of NovaCrate
                        </div>
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
                                    The main strength of NovaCrate is its usability-focused entity
                                    editing approach. The entity browser and the global search make
                                    it easy to find the entity you want to work on. The entities you
                                    are currently working on are displayed in a tabbed interface, so
                                    you can quickly switch between the entities you are working on.
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
                                    (only supported for some common file formats). The file explorer
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
                                <Button size="lg" asChild>
                                    <Link href={"/editor"}>
                                        Open NovaCrate <ArrowRight />
                                    </Link>
                                </Button>
                            </div>
                            <ShowcaseBlock
                                id={"ai-assistant"}
                                imgLight={"/img/ai-assistant-light.png"}
                                imgDark={"/img/ai-assistant-dark.png"}
                                title={"AI Assistant"}
                                alt={"NovaCrate AI Assistant capabilities showcase"}
                                tip={
                                    "Bring your own API Key - no subscription within NovaCrate required!"
                                }
                            >
                                <p>
                                    NovaCrate now includes an AI Assistant to help you with many
                                    different tasks in and around your RO-Crate. The AI Assistant
                                    can read and edit your metadata, read plain files (like .txt or
                                    .csv), import Person and Organization entities from ORCID and
                                    ROR and even run the NovaCrate metadata validation itself.
                                    Simply ask it any question, and it will try its best to answer
                                    it.
                                </p>
                                <p>
                                    This feature does not require a subscription within NovaCrate.
                                    Instead, you need to bring your own API Key for one of the
                                    supported AI providers. You will likely need a subscription with
                                    them. The following providers are supported: OpenAI (for
                                    ChatGPT), Anthropic (for Claude), OpenRouter (for a limited
                                    selection of free models), and OpenAI-Compatible (if you have
                                    access to an OpenAI-Compatible LLM Provider, such as Open WebUI)
                                </p>
                                <p>
                                    To get started, take a look at the{" "}
                                    <Link
                                        className={"underline"}
                                        href={
                                            "https://github.com/kit-data-manager/NovaCrate/blob/main/docs/ai-assistant-setup.md#setting-up-the-ai-assistant-within-novacrate"
                                        }
                                    >
                                        AI Assistant setup guide
                                    </Link>
                                </p>
                            </ShowcaseBlock>
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
                                    reported in a granular manner directly where they occur - either
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
                        <Button size="lg" asChild>
                            <Link href={"/editor"}>
                                Open NovaCrate <ArrowRight />
                            </Link>
                        </Button>
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
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Frequently Asked Questions
                            </h2>
                            <p className="mt-3 max-w-xl text-muted-foreground">
                                Everything you might want to know about NovaCrate, RO-Crates and
                                your data.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <FAQ question={"What is NovaCrate?"}>
                                NovaCrate is a web-based interactive editor for editing, visualizing
                                and validating Research Object Crates directly in the browser.
                                Easily create RO-Crates describing your research data and export to
                                a variety of file-formats. The integrated AI Assistant makes it
                                especially easy for beginners to get started. Check out some key
                                features of NovaCrate above.
                            </FAQ>
                            <FAQ question={"Where is my data stored?"}>
                                All data stays on your local device. Even though NovaCrate is served
                                through the web browser, your data never leaves your device.
                            </FAQ>
                            <FAQ question={"How does the AI integration work?"}>
                                NovaCrate has an integrated AI assistant that can help you with many
                                different tasks around your RO-Crate. However, NovaCrate does not
                                host its own AI models and does not require a subscription for using
                                the AI Assistant. Instead, you need to bring your own API Key for
                                any of the supported AI providers. Those are OpenAI (for ChatGPT),
                                Anthropic (for Claude), OpenRouter (for a limited selection of free
                                models), and OpenAI-Compatible (if you have access to an
                                OpenAI-Compatible LLM Provider, such as Open WebUI). See the{" "}
                                <Link
                                    className={"underline"}
                                    href={
                                        "https://github.com/kit-data-manager/NovaCrate/blob/main/docs/ai-assistant-setup.md#setting-up-the-ai-assistant-within-novacrate"
                                    }
                                >
                                    AI Assistant setup guide
                                </Link>{" "}
                                for more information.
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
                                . You can also reach out using the{" "}
                                <Dialog>
                                    <DialogTrigger className="text-primary underline">
                                        Feedback Form
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Feedback</DialogTitle>
                                            <DialogDescription>
                                                Give feedback using the form below. We highly
                                                appreciate your input!
                                            </DialogDescription>
                                        </DialogHeader>
                                        <FeedbackEmbed />
                                    </DialogContent>
                                </Dialog>
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
                                </Link>
                                ,{" "}
                                <Link href={"https://w3id.org/ro/crate/1.2"} className="underline">
                                    v1.2
                                </Link>{" "}
                                and{" "}
                                <Link href={"https://w3id.org/ro/crate/1.3"} className="underline">
                                    v1.3
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
                                , or build it from source. For more information, take a look at the{" "}
                                <Link
                                    href={
                                        "https://github.com/kit-data-manager/NovaCrate/blob/main/docs/deployment.md"
                                    }
                                    className={"underline"}
                                >
                                    Deployment Documentation
                                </Link>
                                .
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
