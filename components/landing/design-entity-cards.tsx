"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { motion } from "motion/react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import {
    Archive,
    ArrowDown,
    ArrowRight,
    Braces,
    Bug,
    Building2,
    Cloud,
    Database,
    Folder,
    FileText,
    GitFork,
    Library,
    LockOpen,
    Moon,
    Notebook,
    PackageIcon,
    PackageSearch,
    Send,
    SparklesIcon,
    Sun,
    User,
    WrenchIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { RotatingText } from "@/components/ui/rotating-text"
import { IconBlock } from "@/components/info/icon-block"
import { ShowcaseBlock } from "@/components/info/showcase-block"
import { FAQ } from "@/components/info/faq"
import { Footer } from "@/components/footer"
import { ChangelogModal } from "@/components/changelog-modal"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type EntityCardSpec = {
    id: string
    label: string
    sublabel: string
    icon: LucideIcon
    // Resting position of the card's center as a fraction of hero width/height.
    anchor: { x: number; y: number }
    // Small bobbing motion applied while the cards are in the "linked" stage.
    bob: {
        y: [number, number]
        rotate: [number, number]
        duration: number
        delay: number
    }
}

const ENTITY_CARDS: EntityCardSpec[] = [
    {
        id: "dataset",
        label: "dataset.zip",
        sublabel: "Dataset",
        icon: Database,
        anchor: { x: 0.16, y: 0.22 },
        bob: { y: [-14, 14], rotate: [-5, 5], duration: 7, delay: 0.2 }
    },
    {
        id: "person",
        label: "Julia Doe",
        sublabel: "Person",
        icon: User,
        anchor: { x: 0.84, y: 0.2 },
        bob: { y: [-10, 12], rotate: [4, -4], duration: 6, delay: 0.8 }
    },
    {
        id: "organization",
        label: "My Lab",
        sublabel: "Organization",
        icon: Building2,
        anchor: { x: 0.8, y: 0.62 },
        bob: { y: [12, -12], rotate: [-3, 4], duration: 8, delay: 1.4 }
    },
    {
        id: "readme",
        label: "README.md",
        sublabel: "File",
        icon: FileText,
        anchor: { x: 0.15, y: 0.64 },
        bob: { y: [-8, 14], rotate: [4, -5], duration: 5.5, delay: 0.4 }
    },
    {
        id: "collection",
        label: "collection.csv",
        sublabel: "File",
        icon: Folder,
        anchor: { x: 0.46, y: 0.82 },
        bob: { y: [10, -10], rotate: [-5, 3], duration: 7.5, delay: 1.1 }
    }
]

// Pairs of entity cards whose connection we want to draw in the hero,
// evoking the linked-data (metadata graph) principle.
const LINKS: [string, string][] = [
    ["dataset", "person"],
    ["dataset", "organization"],
    ["dataset", "readme"],
    ["dataset", "collection"],
    ["person", "organization"],
    ["readme", "collection"]
]

// Fixed layout dimensions used to compute card positions from their anchor.
const CARD_W = 160
const CARD_H = 56

function cardCenter(id: string, w: number, h: number): Point {
    const spec = ENTITY_CARDS.find((c) => c.id === id)!
    return { x: spec.anchor.x * w, y: spec.anchor.y * h }
}

// Sample a quadratic bezier from p0 (control p1) to p2 into n+1 points, giving a
// smooth curved trajectory that can be traversed with x/y keyframes.
function sampleBezier(p0: Point, p1: Point, p2: Point, n: number): Point[] {
    const pts: Point[] = []
    for (let i = 0; i <= n; i++) {
        const t = i / n
        const it = 1 - t
        pts.push({
            x: it * it * p0.x + 2 * it * t * p1.x + t * t * p2.x,
            y: it * it * p0.y + 2 * it * t * p1.y + t * t * p2.y
        })
    }
    return pts
}

function EntityCard({
    spec,
    target,
    stage,
    armed
}: {
    spec: EntityCardSpec
    target: { x: number; y: number }
    stage: Stage
    armed: boolean
}) {
    const Icon = spec.icon
    const linked = armed && stage === "link"

    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-10 hidden origin-center select-none sm:block"
            style={{ width: CARD_W, height: CARD_H }}
            // Mount directly at the rest position: cards grow in place, they never
            // travel across the hero.
            initial={{ opacity: 0, scale: 0.6, x: target.x, y: target.y }}
            animate={{
                x: target.x,
                y: target.y,
                opacity: linked ? 1 : 0,
                scale: linked ? 1 : 0.12
            }}
            transition={{ duration: stage === "link" ? 0.6 : 0.9, ease: "easeInOut" }}
        >
            <motion.div
                className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card/90 p-3 shadow-xl backdrop-blur-sm"
                animate={
                    linked
                        ? { y: [...spec.bob.y], rotate: [...spec.bob.rotate] }
                        : { y: 0, rotate: 0 }
                }
                transition={
                    linked
                        ? {
                              y: {
                                  duration: spec.bob.duration,
                                  delay: spec.bob.delay,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  ease: "easeInOut"
                              },
                              rotate: {
                                  duration: spec.bob.duration * 1.15,
                                  delay: spec.bob.delay,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  ease: "easeInOut"
                              }
                          }
                        : { duration: 0.3 }
                }
            >
                <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-foreground">{spec.label}</div>
                        <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                            {spec.sublabel}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function ThemeToggle({ theme }: { theme: ReturnType<typeof useTheme> }) {
    return (
        <Button
            size="lg"
            variant="link"
            className="col-start-2 justify-self-start rounded-none border-r-0 h-12 px-0"
            onClick={() =>
                theme.setTheme(theme.resolvedTheme === "light" ? "dark" : "light")
            }
            suppressHydrationWarning
        >
            {theme.resolvedTheme === "light" ? (
                <Sun className="w-6 h-6 shrink-0" suppressHydrationWarning />
            ) : (
                <Moon className="w-6 h-6 shrink-0" suppressHydrationWarning />
            )}
        </Button>
    )
}

type Point = { x: number; y: number }

function LinkLine({ from, to, delay }: { from: Point; to: Point; delay: number }) {
    const len = Math.hypot(to.x - from.x, to.y - from.y)
    return (
        <g>
            <motion.line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--primary)"
                strokeOpacity={0.22}
                strokeWidth={1}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            />
            <motion.circle
                r={2.5}
                fill="var(--primary)"
                initial={{ cx: from.x, cy: from.y, opacity: 0 }}
                animate={{
                    cx: [from.x, to.x, from.x],
                    cy: [from.y, to.y, from.y],
                    opacity: [0, 1, 0]
                }}
                transition={{
                    duration: 2 + len / 90,
                    delay: 0.9 + delay,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                }}
            />
        </g>
    )
}

function LinkLayer({ hero, visible }: { hero: { w: number; h: number }; visible: boolean }) {
    if (hero.w <= 0) return null

    return (
        <motion.svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
            width={hero.w}
            height={hero.h}
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
        >
            {LINKS.map(([a, b], i) => {
                const pa = cardCenter(a, hero.w, hero.h)
                const pb = cardCenter(b, hero.w, hero.h)
                return <LinkLine key={i} from={pa} to={pb} delay={i * 0.4} />
            })}
        </motion.svg>
    )
}

type Stage = "link" | "pack" | "fly" | "exchange" | "done"

type Watermark =
    | "1. Linked data"
    | "2. Package into one crate"
    | "3. Exchange anywhere"

const STAGE_WATERMARK: Record<Exclude<Stage, "link">, Watermark> = {
    pack: "2. Package into one crate",
    fly: "3. Exchange anywhere",
    exchange: "3. Exchange anywhere",
    done: "3. Exchange anywhere"
}

function Crate({ size, path, flying }: { size: number; path: Point[]; flying: boolean }) {
    // Path holds the crate's *centre* positions; we offset by half the size so the
    // box itself (left-0/top-0 origin) rides along the sampled curve.
    const ptsX = path.map((p) => p.x - size / 2)
    const ptsY = path.map((p) => p.y - size / 2)
    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-[15] origin-center"
            style={{ width: size, height: size }}
            initial={{ x: ptsX[0], y: ptsY[0], scale: 0.3, opacity: 0, rotate: -5 }}
            animate={
                flying
                    ? { x: ptsX, y: ptsY, scale: [0.3, 1.06, 1], opacity: 1, rotate: 0 }
                    : { x: ptsX[0], y: ptsY[0], scale: 0.3, opacity: 0, rotate: -5 }
            }
            // Scale-up and travel share one easing so the crate forms while it arcs.
            transition={{ duration: flying ? 1.5 : 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-card via-secondary to-muted shadow-2xl">
                <Archive className="size-1/2 text-primary" strokeWidth={1.5} />
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-primary/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                    RO-Crate
                </span>
            </div>
        </motion.div>
    )
}

function ExchangeTarget({
    Icon,
    label,
    size,
    point,
    visible
}: {
    Icon: LucideIcon
    label: string
    size: number
    point: { x: number; y: number }
    visible: boolean
}) {
    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute z-[15] flex flex-col items-center gap-2"
            style={{ width: size, left: point.x, top: point.y }}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -24 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <span className="flex items-center justify-center rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-sm">
                <Icon className="size-8 text-accent-foreground" strokeWidth={1.5} />
            </span>
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {label}
            </span>
        </motion.div>
    )
}

export function DesignEntityCards() {
    const theme = useTheme()
    const heroRef = useRef<HTMLDivElement>(null)

    // Measured layout of the hero (used to compute card/line/crate positions).
    const [hero, setHero] = useState<{ w: number; h: number } | null>(null)
    const [stage, setStage] = useState<Stage>("link")

    // Measure hero size.
    useEffect(() => {
        const el = heroRef.current
        if (!el) return
        const update = () => setHero({ w: el.clientWidth, h: el.clientHeight })
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        window.addEventListener("resize", update)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", update)
        }
    }, [])

    const armed = !!hero

    // Drive the choreography once the hero is measurable.
    useEffect(() => {
        if (!armed) return
        let cancelled = false
        const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
        ;(async () => {
            setStage("link")
            await sleep(2100)
            if (cancelled) return
            setStage("pack")
            await sleep(1000)
            if (cancelled) return
            setStage("fly")
            await sleep(1400)
            if (cancelled) return
            setStage("exchange")
            await sleep(1100)
            if (cancelled) return
            setStage("done")
        })()
        return () => {
            cancelled = true
        }
    }, [armed])

    const cardTarget = (spec: EntityCardSpec): { x: number; y: number } => {
        const heroW = hero?.w ?? 0
        const heroH = hero?.h ?? 0
        const center = cardCenter(spec.id, heroW, heroH)
        const rest = { x: center.x - CARD_W / 2, y: center.y - CARD_H / 2 }
        if (stage === "link") return rest
        // Cards converge into the crate at the hero center.
        return {
            x: heroW / 2 - CARD_W / 2,
            y: heroH / 2 - CARD_H / 2
        }
    }

    const crateSize = Math.min(140, Math.max(96, (hero?.w ?? 0) * 0.14))
    const crateStart = { x: (hero?.w ?? 0) / 2, y: (hero?.h ?? 0) / 2 }
    const crateEnd = { x: (hero?.w ?? 0) * 0.82, y: (hero?.h ?? 0) / 2 }
    const bulge = Math.min(180, (hero?.h ?? 0) * 0.35)
    const crateMid = {
        x: (crateStart.x + crateEnd.x) / 2,
        y: crateStart.y - bulge
    }
    // Quadratic bezier: starts at the pack centre, arcs up, lands further right.
    const cratePath = sampleBezier(crateStart, crateMid, crateEnd, 26)
    const crateFlying = stage === "fly" || stage === "exchange" || stage === "done"
    const targetsVisible = stage === "exchange" || stage === "done"
    const watermark = STAGE_WATERMARK[stage as Exclude<Stage, "link">]

    return (
        <div className="scroll-smooth">
            <div className="grid grid-cols-[1fr_minmax(400px,1600px)_1fr] max-w-full mb-16 lg:mx-16 mx-4">
                <ThemeToggle theme={theme} />
                <div className="col-start-2">
                    <div
                        ref={heroRef}
                        className="relative h-[calc(100vh-300px)] min-h-75 flex flex-col justify-center items-center gap-4 overflow-hidden rounded-b-3xl"
                    >
                        {/* Glow / gradient backdrop */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0"
                            style={
                                {
                                    background:
                                        "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 55%), radial-gradient(circle at 12% 80%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 50%), radial-gradient(circle at 88% 75%, color-mix(in srgb, var(--data) 14%, transparent), transparent 50%)"
                                } as CSSProperties
                            }
                        />

                        {/* Full-hero shine sweep */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <motion.div
                                aria-hidden
                                className="absolute inset-y-[-60%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5"
                                initial={{ left: "-45%" }}
                                animate={{ left: "125%" }}
                                transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                            />
                        </div>

                        {/* Floating entity cards */}
                        {armed &&
                            hero &&
                            ENTITY_CARDS.map((spec) => (
                                <EntityCard
                                    key={spec.id}
                                    spec={spec}
                                    target={cardTarget(spec)}
                                    stage={stage}
                                    armed={armed}
                                />
                            ))}

                        {/* Linking edges for the "linked data" stage */}
                        {hero && (
                            <LinkLayer
                                hero={hero}
                                visible={armed && stage === "link"}
                            />
                        )}

                        {/* Single packaged crate; curves and flies right as it forms */}
                        <Crate size={crateSize} path={cratePath} flying={crateFlying} />

                        {/* Exchange targets on the left, revealed at the end */}
                        <ExchangeTarget
                            Icon={Cloud}
                            label="Platform"
                            size={96}
                            point={{ x: (hero?.w ?? 0) * 0.2 - 48, y: (hero?.h ?? 0) * 0.32 }}
                            visible={targetsVisible}
                        />
                        <ExchangeTarget
                            Icon={Send}
                            label="Share"
                            size={96}
                            point={{ x: (hero?.w ?? 0) * 0.16 - 48, y: (hero?.h ?? 0) * 0.64 }}
                            visible={targetsVisible}
                        />

                        {/* Step caption */}
                        {watermark && (
                            <motion.div
                                aria-hidden
                                className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {watermark}
                            </motion.div>
                        )}

                        <motion.div
                            className="relative z-20 flex flex-col items-center gap-4 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                        >
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
                        </motion.div>
                    </div>
                </div>
                <div className="col-start-2 space-y-24">
                    <div className="flex justify-center items-center flex-col gap-8">
                        <div className="max-w-175 text-center">
                            NovaCrate is a web-based interactive editor for editing, visualizing and
                            validating Research Object Crates directly in the browser. Easily create
                            RO-Crates describing your research data and export to a variety of
                            file-formats. The integrated AI Assistant makes it especially easy for
                            beginners to get started. Check out some key features of NovaCrate
                            below.
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
                            <IconBlock href={"#ai-assistant"} Icon={SparklesIcon}>
                                AI Assistant
                            </IconBlock>
                            <IconBlock Icon={Braces}>JSON Editor</IconBlock>
                            <IconBlock Icon={Library}>Context Editor</IconBlock>
                            <IconBlock Icon={Notebook}>ELN Support</IconBlock>
                            <IconBlock href="#validation" Icon={Bug}>
                                Live Validation
                            </IconBlock>
                            <IconBlock href={"#configuration"} Icon={WrenchIcon}>
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
                                <Link href={"/editor"}>
                                    <Button size="lg">
                                        Open NovaCrate <ArrowRight />
                                    </Button>
                                </Link>
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
