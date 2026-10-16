"use client"

import React, { useEffect, useRef, useState, type ReactNode, useCallback } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { addBasePath } from "next/dist/client/add-base-path"
import {
    Archive,
    ArrowRight,
    Braces,
    Building2,
    Cloud,
    Database,
    FileText,
    Folder,
    GitFork,
    Library,
    LockOpen,
    Moon,
    Notebook,
    PackageIcon,
    Send,
    ShieldCheck,
    SparklesIcon,
    Sun,
    Tags,
    Upload,
    User,
    Waypoints,
    WrenchIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { GITHUB_REPO } from "@/lib/legals"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type AccentClass = {
    text: string
    bg: string
    border: string
    dot: string
    hover: string
}

const DATA: AccentClass = {
    text: "text-data",
    bg: "bg-data/10",
    border: "border-data/30",
    dot: "bg-data",
    hover: "hover:border-data/40"
}

const ROOT: AccentClass = {
    text: "text-root",
    bg: "bg-root/10",
    border: "border-root/30",
    dot: "bg-root",
    hover: "hover:border-root/40"
}

const CONTEXTUAL: AccentClass = {
    text: "text-contextual",
    bg: "bg-contextual/10",
    border: "border-contextual/30",
    dot: "bg-contextual",
    hover: "hover:border-contextual/40"
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
    const reducedMotion = useReducedMotion()
    if (reducedMotion) {
        return <div className={className}>{children}</div>
    }
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}

function TopBar({ theme }: { theme: ReturnType<typeof useTheme> }) {
    return (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
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
                            theme.setTheme(theme.resolvedTheme === "light" ? "dark" : "light")
                        }
                        suppressHydrationWarning
                    >
                        {theme.resolvedTheme === "light" ? (
                            <Moon className="size-5" suppressHydrationWarning />
                        ) : (
                            <Sun className="size-5" suppressHydrationWarning />
                        )}
                    </Button>
                    <Link href="/editor" className="ml-1">
                        <Button size="sm">
                            Open NovaCrate <ArrowRight />
                        </Button>
                    </Link>
                </nav>
            </div>
        </header>
    )
}

type LifecycleNode = {
    id: string
    label: string
    icon: LucideIcon
    anchor: { x: number; y: number }
}

const LIFECYCLE_NODES: LifecycleNode[] = [
    {
        id: "dataset",
        label: "dataset.zip",
        icon: Database,
        anchor: { x: 0.26, y: 0.24 }
    },
    {
        id: "csv",
        label: "readings.csv",
        icon: FileText,
        anchor: { x: 0.74, y: 0.2 }
    },
    {
        id: "person",
        label: "J. Doe",
        icon: User,
        anchor: { x: 0.16, y: 0.6 }
    },
    {
        id: "lab",
        label: "My Lab",
        icon: Building2,
        anchor: { x: 0.72, y: 0.64 }
    },
    {
        id: "readme",
        label: "README.md",
        icon: Folder,
        anchor: { x: 0.44, y: 0.86 }
    }
]

const LIFECYCLE_EDGES: [string, string][] = [
    ["dataset", "csv"],
    ["dataset", "person"],
    ["dataset", "lab"],
    ["person", "lab"],
    ["dataset", "readme"],
    ["csv", "readme"]
]

const DESTINATIONS: { icon: LucideIcon; label: string; anchor: { x: number; y: number } }[] = [
    { icon: Cloud, label: "Repository", anchor: { x: 0.88, y: 0.28 } },
    { icon: Send, label: "Journal", anchor: { x: 0.88, y: 0.52 } },
    { icon: Waypoints, label: "Collaborators", anchor: { x: 0.88, y: 0.76 } }
]

const DESCRIBE_MS = 3600
const PACKAGE_MS = 2200
const EXCHANGE_MS = 3000
const CYCLE_MS = DESCRIBE_MS + PACKAGE_MS + EXCHANGE_MS

const STEP_META = [
    {
        caption: "1 · Describe — add files, describe them, connect them",
        dot: DATA.dot
    },
    {
        caption: "2 · Package — one crate, everything included",
        dot: ROOT.dot
    },
    {
        caption: "3 · Exchange — export anywhere, share with anyone",
        dot: CONTEXTUAL.dot
    }
]

function LifecycleChip({
    node,
    index,
    visible
}: {
    node: LifecycleNode
    index: number
    visible: boolean
}) {
    const Icon = node.icon
    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.anchor.x * 100}%`, top: `${node.anchor.y * 100}%` }}
        >
            <motion.div
                className="flex items-center gap-2 rounded-lg border bg-card/90 py-1.5 pl-1.5 pr-2.5 shadow-sm backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={
                    visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.4, y: -18 }
                }
                transition={{
                    duration: 0.45,
                    delay: visible ? 0.15 + index * 0.14 : 0,
                    ease: "easeOut"
                }}
            >
                <span
                    className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md",
                        DATA.bg,
                        DATA.text
                    )}
                >
                    <Icon className="size-3.5" />
                </span>
                <span className="whitespace-nowrap text-xs font-medium text-foreground">
                    {node.label}
                </span>
            </motion.div>
        </div>
    )
}

function useLifecyclePhase(): number {
    const reducedMotion = useReducedMotion()
    const [phase, setPhase] = useState(0)

    useEffect(() => {
        if (reducedMotion) return
        const timers: ReturnType<typeof setTimeout>[] = []
        const advance = (next: number, delay: number) => {
            timers.push(
                setTimeout(() => {
                    setPhase(next)
                }, delay)
            )
        }
        const runCycle = () => {
            setPhase(0)
            advance(1, DESCRIBE_MS)
            advance(2, DESCRIBE_MS + PACKAGE_MS)
        }
        runCycle()
        timers.push(setTimeout(runCycle, CYCLE_MS))
        const interval = setInterval(runCycle, CYCLE_MS)
        return () => {
            timers.forEach((t) => clearTimeout(t))
            clearInterval(interval)
        }
    }, [reducedMotion])

    return reducedMotion ? -1 : phase
}

export function CrateLifecycle({ phase }: { phase: number }) {
    const reducedMotion = useReducedMotion()
    const boxRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState<{ w: number; h: number } | null>(null)

    useEffect(() => {
        const el = boxRef.current
        if (!el) return
        const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const crateSize = Math.min(112, Math.max(84, (size?.w ?? 300) * 0.17))
    const crateStart = { x: (size?.w ?? 0) / 2, y: (size?.h ?? 0) / 2 }
    const crateEnd = { x: (size?.w ?? 0) * 0.66, y: (size?.h ?? 0) / 2 }

    const showNodes = reducedMotion || phase === 0
    const showCrate = reducedMotion || phase >= 1
    const showDestinations = reducedMotion ? false : phase === 2

    const nodeCenter = (id: string) => {
        const spec = LIFECYCLE_NODES.find((n) => n.id === id)!
        return { x: spec.anchor.x * (size?.w ?? 0), y: spec.anchor.y * (size?.h ?? 0) }
    }

    const staticCaption = reducedMotion ? "Describe → Package → Exchange" : null

    return (
        <div className="relative grow">
            <div ref={boxRef} aria-hidden className="relative aspect-[4/3] w-full">
                {size && (
                    <svg className="absolute inset-0 h-full w-full" width={size.w} height={size.h}>
                        {LIFECYCLE_EDGES.map(([a, b], i) => {
                            const pa = nodeCenter(a)
                            const pb = nodeCenter(b)
                            return (
                                <motion.line
                                    key={`${a}-${b}`}
                                    x1={pa.x}
                                    y1={pa.y}
                                    x2={pb.x}
                                    y2={pb.y}
                                    stroke="var(--data)"
                                    strokeWidth={1.25}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={
                                        showNodes
                                            ? { pathLength: 1, opacity: 0.4 }
                                            : { pathLength: 1, opacity: 0 }
                                    }
                                    transition={{
                                        pathLength: {
                                            duration: 0.6,
                                            delay: showNodes ? 0.8 + i * 0.16 : 0,
                                            ease: "easeOut"
                                        },
                                        opacity: { duration: 0.4 }
                                    }}
                                />
                            )
                        })}
                        {showDestinations &&
                            DESTINATIONS.map((d, i) => {
                                const from = {
                                    x: crateEnd.x,
                                    y: crateEnd.y
                                }
                                const to = {
                                    x: d.anchor.x * size.w,
                                    y: d.anchor.y * size.h
                                }
                                return (
                                    <motion.line
                                        key={`dest-${i}`}
                                        x1={from.x}
                                        y1={from.y}
                                        x2={to.x}
                                        y2={to.y}
                                        stroke="var(--contextual)"
                                        strokeWidth={1.25}
                                        strokeDasharray="3 5"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.45 }}
                                        transition={{
                                            pathLength: {
                                                duration: 0.5,
                                                delay: 0.5 + i * 0.12,
                                                ease: "easeOut"
                                            },
                                            opacity: { duration: 0.3 }
                                        }}
                                    />
                                )
                            })}
                    </svg>
                )}

                {LIFECYCLE_NODES.map((node, i) => (
                    <LifecycleChip key={node.id} node={node} index={i} visible={showNodes} />
                ))}

                <motion.div
                    className="absolute left-0 top-0"
                    style={{ width: crateSize, height: crateSize }}
                    initial={{
                        x: crateStart.x - crateSize / 2,
                        y: crateStart.y - crateSize / 2,
                        opacity: 0,
                        scale: 0.3
                    }}
                    animate={
                        showCrate
                            ? {
                                  x: (showDestinations ? crateEnd.x : crateStart.x) - crateSize / 2,
                                  y: crateStart.y - crateSize / 2,
                                  opacity: 1,
                                  scale: 1
                              }
                            : {
                                  x: crateStart.x - crateSize / 2,
                                  y: crateStart.y - crateSize / 2,
                                  opacity: 0,
                                  scale: 0.3
                              }
                    }
                    transition={{
                        x: { duration: 0.9, ease: "easeInOut" },
                        scale: { type: "spring", stiffness: 260, damping: 20 },
                        opacity: { duration: 0.3 }
                    }}
                >
                    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl border bg-gradient-to-br from-card via-secondary to-muted shadow-xl">
                        <Archive className="size-1/2 text-root" strokeWidth={1.5} />
                        <span className="absolute bottom-1.5 rounded bg-root/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-root">
                            RO-Crate
                        </span>
                    </div>
                </motion.div>

                {DESTINATIONS.map((d, i) => {
                    const Icon = d.icon
                    return (
                        <div
                            key={d.label}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: `${d.anchor.x * 100}%`,
                                top: `${d.anchor.y * 100}%`
                            }}
                        >
                            <motion.div
                                className="flex flex-col items-center gap-1 rounded-lg border bg-card/90 p-2 shadow-sm backdrop-blur-sm"
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={
                                    showDestinations
                                        ? { opacity: 1, scale: 1 }
                                        : { opacity: 0, scale: 0.6 }
                                }
                                transition={{
                                    duration: 0.35,
                                    delay: showDestinations ? 0.3 + i * 0.14 : 0,
                                    ease: "easeOut"
                                }}
                            >
                                <Icon
                                    className={cn("size-4", CONTEXTUAL.text)}
                                    strokeWidth={1.75}
                                />
                                <span className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                                    {d.label}
                                </span>
                            </motion.div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-5 flex flex-col items-center gap-3">
                <div className="flex gap-1.5" aria-hidden>
                    {STEP_META.map((step, i) => (
                        <span
                            key={i}
                            className={cn(
                                "size-1.5 rounded-full transition-colors duration-300",
                                staticCaption
                                    ? "first:bg-data bg-muted-foreground/25"
                                    : i === phase
                                      ? step.dot
                                      : "bg-muted-foreground/25"
                            )}
                        />
                    ))}
                </div>
                {staticCaption ? (
                    <p className="h-5 text-sm text-muted-foreground">{staticCaption}</p>
                ) : (
                    <div className="relative h-5 w-full text-center text-sm text-muted-foreground">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={phase}
                                className="absolute inset-0"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3 }}
                            >
                                {STEP_META[phase]?.caption}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}

function Hero() {
    const phase = useLifecyclePhase()
    return (
        <section className="relative overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(circle at 70% 15%, color-mix(in srgb, var(--data) 9%, transparent), transparent 55%), radial-gradient(circle at 15% 85%, color-mix(in srgb, var(--root) 9%, transparent), transparent 50%), radial-gradient(circle at 85% 80%, color-mix(in srgb, var(--contextual) 8%, transparent), transparent 50%)"
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black_30%,transparent_85%)]"
            />
            <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
                <Reveal>
                    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
                        <SparklesIcon className="size-3.5 text-primary" />
                        Web-based RO-Crate editor — runs entirely in your browser
                    </span>
                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
                        <span className="text-data">Describe.</span>{" "}
                        <span className="text-root">Package.</span>{" "}
                        <span className="text-contextual">Exchange.</span>
                    </h1>
                    <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                        NovaCrate is the web-based editor for Research Object Crates. Describing
                        your research data is where it excels — and it carries you all the way to a
                        portable, shareable crate.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link href="/editor">
                            <Button size="lg">
                                Open NovaCrate <ArrowRight />
                            </Button>
                        </Link>
                        <Link href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline">
                                View on GitHub
                            </Button>
                        </Link>
                    </div>
                    <p className="mt-6 text-sm text-muted-foreground">
                        Free &amp; open-source (Apache-2.0) · Your data never leaves your device
                    </p>
                </Reveal>
                <Reveal className="w-full max-w-md justify-self-center lg:justify-self-end">
                    <CrateLifecycle phase={phase} />
                </Reveal>
            </div>
        </section>
    )
}

type DescribeStep = {
    icon: LucideIcon
    title: string
    copy: string
    poweredBy: string
    anchor: string
}

const DESCRIBE_STEPS: DescribeStep[] = [
    {
        icon: Upload,
        title: "Add files",
        copy: "Drop in datasets, folders or a whole project. Upload, organize and preview files directly in your browser.",
        poweredBy: "The File Explorer",
        anchor: "#file-explorer"
    },
    {
        icon: Tags,
        title: "Describe files",
        copy: "Guided forms, type inference and rich property descriptions make metadata entry easy even for beginners.",
        poweredBy: "The Entity Editor",
        anchor: "#entity-editor"
    },
    {
        icon: Waypoints,
        title: "Connect files",
        copy: "Link people, organizations and datasets with drag & drop, and watch your crate's graph come alive.",
        poweredBy: "The Metadata Graph",
        anchor: "#metadata-graph"
    }
]

function PrincipleBadge({
    number,
    label,
    accent
}: {
    number: string
    label: string
    accent: AccentClass
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                accent.border,
                accent.bg,
                accent.text
            )}
        >
            {number} · {label}
        </span>
    )
}

export function PrinciplesSection() {
    const phase = useLifecyclePhase()
    const anchorHandler = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>, href: string) => {
            if (href && href.startsWith("#")) {
                e.preventDefault()
                const element = document.getElementById(href.substring(1))
                if (element) element.scrollIntoView({ behavior: "smooth", block: "start" })
            }
        },
        []
    )

    return (
        <div>
            <Reveal>
                <div className="max-w-2xl">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        The RO-Crate principles
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        Every Research Object Crate follows the same idea: describe your data,
                        package it as one unit, exchange it with anyone. NovaCrate is built around
                        exactly this workflow.
                    </p>
                </div>
            </Reveal>

            <div className="mt-12 space-y-6">
                                <div className="flex items-center gap-6 items-stretch">
                    <Reveal>
                        <div className="flex items-center justify-center rounded-3xl border bg-card/50 p-5 shadow-sm backdrop-blur-sm sm:p-6 w-full h-full min-w-md max-w-lg">
                            <CrateLifecycle phase={phase} />
                        </div>
                    </Reveal>
                    <Reveal>
                        <article className="relative overflow-hidden rounded-3xl border bg-card/50 backdrop-blur-sm p-6 sm:p-10">
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute right-6 top-4 hidden select-none text-6xl font-black leading-none transition-colors duration-500 sm:block",
                                    phase === 0 ? DATA.text : "text-muted-foreground/10"
                                )}
                            >
                                01
                            </span>
                            <h3 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                                Describe
                            </h3>
                            <p className="mt-3 max-w-2xl text-muted-foreground">
                                A crate is only as good as its metadata. NovaCrate makes describing
                                research data easy, all the way from the first uploaded file to a
                                fully connected knowledge graph.
                            </p>
                            <div className="mt-8 grid gap-4 md:grid-cols-3">
                                {DESCRIBE_STEPS.map((step) => {
                                    const Icon = step.icon
                                    return (
                                        <div
                                            key={step.title}
                                            className={cn(
                                                "rounded-2xl border bg-background p-5 transition-colors",
                                                DATA.hover
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "flex size-9 items-center justify-center rounded-lg",
                                                    DATA.bg,
                                                    DATA.text
                                                )}
                                            >
                                                <Icon className="size-4.5" />
                                            </span>
                                            <h4 className="mt-4 font-semibold">{step.title}</h4>
                                            <p className="mt-1.5 text-sm text-muted-foreground">
                                                {step.copy}
                                            </p>
                                            <p
                                                className={cn(
                                                    "mt-4 text-xs font-medium text-muted-foreground"
                                                )}
                                            >
                                                Powered by{" "}
                                                <a
                                                    href={step.anchor}
                                                    onClick={(e) => anchorHandler(e, step.anchor)}
                                                    className={cn("hover:underline", DATA.text)}
                                                >
                                                    {step.poweredBy}
                                                </a>
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </article>
                    </Reveal>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Reveal>
                        <article className="relative h-full overflow-hidden rounded-3xl border bg-card/50 backdrop-blur-sm p-6 sm:p-8">
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute right-6 top-4 hidden select-none text-6xl font-black leading-none transition-colors duration-500 sm:block",
                                    phase === 1 ? ROOT.text : "text-muted-foreground/10"
                                )}
                            >
                                02
                            </span>
                            <h3 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
                                Package
                            </h3>
                            <p className="mt-3 text-muted-foreground">
                                Your files and metadata become a single, spec-conformant crate: a
                                plain folder with a metadata file at the heart. No databases, no
                                lock-in, no loose ends.
                            </p>
                        </article>
                    </Reveal>
                    <Reveal>
                        <article className="relative h-full overflow-hidden rounded-3xl border bg-card/50 backdrop-blur-sm p-6 sm:p-8">
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute right-6 top-4 hidden select-none text-6xl font-black leading-none transition-colors duration-500 sm:block",
                                    phase === 2 ? CONTEXTUAL.text : "text-muted-foreground/10"
                                )}
                            >
                                03
                            </span>
                            <h3 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
                                Exchange
                            </h3>
                            <p className="mt-3 text-muted-foreground">
                                Export your crate and hand it to repositories, journals, archives or
                                collaborators. FAIR by construction, not by afterthought. RO-Crates
                                can be used with many different libraries and tools, such as
                                NovaCrate.
                            </p>
                        </article>
                    </Reveal>
                </div>
            </div>
        </div>
    )
}

function Principles() {
    return (
        <section id="principles" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
            <PrinciplesSection />
        </section>
    )
}

const CAPABILITIES: { icon: LucideIcon; label: string }[] = [
    { icon: SparklesIcon, label: "AI Assistant" },
    { icon: ShieldCheck, label: "Live Validation" },
    { icon: GitFork, label: "Metadata Graph" },
    { icon: Braces, label: "JSON Editor" },
    { icon: Library, label: "Context Editor" },
    { icon: Notebook, label: "ELN Support" },
    { icon: WrenchIcon, label: "Custom Schemas" },
    { icon: LockOpen, label: "Local-first data" }
]

function Capabilities() {
    return (
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
            <Reveal>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    And everything around it
                </h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                    Describing is where NovaCrate excels — but it has your whole workflow covered.
                </p>
            </Reveal>
            <Reveal className="mt-8">
                <ul className="flex flex-wrap gap-3">
                    {CAPABILITIES.map((capability) => {
                        const Icon = capability.icon
                        return (
                            <li
                                key={capability.label}
                                className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:border-foreground/30"
                            >
                                <Icon className="size-4 text-primary" />
                                {capability.label}
                            </li>
                        )
                    })}
                </ul>
            </Reveal>
        </section>
    )
}

function CtaBand() {
    return (
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
            <Reveal>
                <div className="relative overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center sm:py-20">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--data) 8%, transparent), transparent 50%), radial-gradient(circle at 70% 80%, color-mix(in srgb, var(--root) 8%, transparent), transparent 50%)"
                        }}
                    />
                    <div className="relative">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Ready to describe your research?
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                            Open NovaCrate in your browser — no account, no upload, no install.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link href="/editor">
                                <Button size="lg">
                                    Open NovaCrate <ArrowRight />
                                </Button>
                            </Link>
                            <Link href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                                <Button size="lg" variant="outline">
                                    View on GitHub
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-6 text-xs text-muted-foreground">
                            Free &amp; open-source (Apache-2.0) · Your data never leaves your device
                        </p>
                    </div>
                </div>
            </Reveal>
        </section>
    )
}

export function DesignPrinciples() {
    const theme = useTheme()
    return (
        <div className="flex min-h-screen flex-col scroll-smooth">
            <TopBar theme={theme} />
            <main className="flex-1">
                <Hero />
                <Principles />
                <Capabilities />
                <CtaBand />
            </main>
            <Footer />
        </div>
    )
}
