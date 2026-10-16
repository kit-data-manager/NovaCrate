"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { LucideIcon } from "lucide-react"
import {
    Archive,
    Building2,
    Cloud,
    Database,
    FileText,
    Folder,
    Send,
    Tags,
    Upload,
    User,
    Waypoints
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/landing/reveal"

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

const CONTEXTUAL: AccentClass = {
    text: "text-contextual",
    bg: "bg-contextual/10",
    border: "border-contextual/30",
    dot: "bg-contextual",
    hover: "hover:border-contextual/40"
}

type LifecycleNode = {
    id: string
    label: string
    icon: LucideIcon
    anchor: { x: number; y: number }
    accent: AccentClass
}

const LIFECYCLE_NODES: LifecycleNode[] = [
    {
        id: "dataset",
        label: "dataset.zip",
        icon: Database,
        anchor: { x: 0.26, y: 0.24 },
        accent: DATA
    },
    {
        id: "csv",
        label: "readings.csv",
        icon: FileText,
        anchor: { x: 0.74, y: 0.2 },
        accent: DATA
    },
    {
        id: "person",
        label: "J. Doe",
        icon: User,
        anchor: { x: 0.16, y: 0.6 },
        accent: CONTEXTUAL
    },
    {
        id: "lab",
        label: "My Lab",
        icon: Building2,
        anchor: { x: 0.72, y: 0.64 },
        accent: CONTEXTUAL
    },
    {
        id: "readme",
        label: "README.md",
        icon: Folder,
        anchor: { x: 0.44, y: 0.86 },
        accent: DATA
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
    { icon: Cloud, label: "Repository", anchor: { x: 0.5, y: 0.18 } },
    { icon: Send, label: "Journal", anchor: { x: 0.18, y: 0.8 } },
    { icon: Waypoints, label: "Collaborators", anchor: { x: 0.82, y: 0.8 } }
]

const DESCRIBE_MS = 3600
const PACKAGE_MS = 2200
const EXCHANGE_MS = 3000
const CYCLE_MS = DESCRIBE_MS + PACKAGE_MS + EXCHANGE_MS

const STEP_META = [
    {
        caption: "1 · Describe — add files, describe them, connect them",
        dot: "bg-foreground"
    },
    {
        caption: "2 · Package — one crate, everything included",
        dot: "bg-foreground"
    },
    {
        caption: "3 · Exchange — export anywhere, share with anyone",
        dot: "bg-foreground"
    }
]

function LifecycleChip({
    node,
    index,
    visible,
    flyOffset
}: {
    node: LifecycleNode
    index: number
    visible: boolean
    flyOffset: { x: number; y: number }
}) {
    const Icon = node.icon
    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.anchor.x * 100}%`, top: `${node.anchor.y * 100}%` }}
        >
            <motion.div
                className="flex items-center gap-2 rounded-lg border bg-card/90 py-1.5 pl-1.5 pr-2.5 shadow-sm backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                animate={
                    visible
                        ? { opacity: 1, scale: 1, x: 0, y: 0 }
                        : { opacity: 0, scale: 0.25, x: flyOffset.x, y: flyOffset.y }
                }
                transition={{
                    x: {
                        duration: 0.5,
                        delay: visible ? 0 : 0.05 + index * 0.07,
                        ease: "easeInOut"
                    },
                    y: {
                        duration: 0.5,
                        delay: visible ? 0 : 0.05 + index * 0.07,
                        ease: "easeInOut"
                    },
                    scale: {
                        duration: 0.5,
                        delay: visible ? 0.15 + index * 0.14 : 0.05 + index * 0.07,
                        ease: "easeInOut"
                    },
                    opacity: {
                        duration: 0.45,
                        delay: visible ? 0.15 + index * 0.14 : 0.15 + index * 0.07
                    }
                }}
            >
                <span
                    className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md",
                        node.accent.bg,
                        node.accent.text
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

    const showNodes = reducedMotion || phase === 0
    const showCrate = reducedMotion || phase >= 1
    const showDestinations = reducedMotion ? false : phase === 2

    const nodeCenter = (id: string) => {
        const spec = LIFECYCLE_NODES.find((n) => n.id === id)!
        return { x: spec.anchor.x * (size?.w ?? 0), y: spec.anchor.y * (size?.h ?? 0) }
    }

    const flyOffset = (node: LifecycleNode) => ({
        x: (0.5 - node.anchor.x) * (size?.w ?? 0),
        y: (0.5 - node.anchor.y) * (size?.h ?? 0)
    })

    const staticCaption = reducedMotion ? "Describe → Package → Exchange" : null

    return (
        <div className="relative grow">
            <div ref={boxRef} aria-hidden className="relative aspect-4/3 w-full">
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
                                    stroke="var(--foreground)"
                                    strokeWidth={1.25}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={
                                        showNodes
                                            ? { pathLength: 1, opacity: 0.4 }
                                            : { pathLength: 0, opacity: 0 }
                                    }
                                    transition={{
                                        pathLength: showNodes
                                            ? {
                                                  duration: 0.6,
                                                  delay: 0.8 + i * 0.16,
                                                  ease: "easeOut"
                                              }
                                            : { duration: 0, delay: 0.4 },
                                        opacity: { duration: 0.4 }
                                    }}
                                />
                            )
                        })}
                    </svg>
                )}

                {LIFECYCLE_NODES.map((node, i) => (
                    <LifecycleChip
                        key={node.id}
                        node={node}
                        index={i}
                        visible={showNodes}
                        flyOffset={flyOffset(node)}
                    />
                ))}

                <motion.div
                    className="absolute left-0 top-0 z-10"
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
                                  x: crateStart.x - crateSize / 2,
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
                        scale: showCrate
                            ? { type: "spring", stiffness: 260, damping: 20, delay: 0.45 }
                            : { duration: 0.3 },
                        opacity: showCrate ? { duration: 0.3, delay: 0.45 } : { duration: 0.3 }
                    }}
                >
                    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl border bg-linear-to-br from-card via-secondary to-muted shadow-xl">
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
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={
                                    showDestinations
                                        ? { opacity: 1, scale: 1 }
                                        : { opacity: 0, scale: 0.6 }
                                }
                                transition={{
                                    duration: 0.35,
                                    delay: showDestinations ? 0.15 + i * 0.2 : 0,
                                    ease: "easeOut"
                                }}
                            >
                                <motion.div
                                    animate={
                                        showDestinations ? { scale: [1, 1.18, 1] } : { scale: 1 }
                                    }
                                    transition={{
                                        duration: 0.35,
                                        delay: showDestinations ? 1.2 + i * 0.35 : 0
                                    }}
                                    className="flex flex-col items-center gap-1 rounded-lg border bg-card/90 p-2 shadow-sm backdrop-blur-sm"
                                >
                                    <Icon className="size-4 text-foreground" strokeWidth={1.75} />
                                    <span className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                                        {d.label}
                                    </span>
                                </motion.div>
                            </motion.div>
                        </div>
                    )
                })}

                {DESTINATIONS.map((d, i) => {
                    const dx = (d.anchor.x - 0.5) * (size?.w ?? 0)
                    const dy = (d.anchor.y - 0.5) * (size?.h ?? 0)
                    return (
                        <motion.div
                            key={`copy-${d.label}`}
                            aria-hidden
                            className="absolute left-1/2 top-1/2"
                            style={{ width: 34, height: 34, marginLeft: -17, marginTop: -17 }}
                            animate={
                                showDestinations
                                    ? { x: dx, y: dy, scale: 1 }
                                    : { x: 0, y: 0, scale: 0.5 }
                            }
                            transition={
                                showDestinations
                                    ? {
                                          duration: 0.4,
                                          delay: 0.8 + i * 0.35,
                                          ease: "easeInOut"
                                      }
                                    : {
                                          x: { duration: 0 },
                                          y: { duration: 0 },
                                          scale: { duration: 0 }
                                      }
                            }
                        >
                            <motion.div
                                className="h-full w-full"
                                animate={
                                    showDestinations
                                        ? { opacity: 0, scale: 0.7 }
                                        : { opacity: 1, scale: 1 }
                                }
                                transition={
                                    showDestinations
                                        ? {
                                              duration: 0.25,
                                              delay: 1.2 + i * 0.35,
                                              ease: "easeInOut"
                                          }
                                        : { duration: 0 }
                                }
                            >
                                <motion.div
                                    className="flex h-full w-full items-center justify-center rounded-lg border bg-card shadow-md"
                                    animate={showDestinations ? { opacity: 1 } : { opacity: 0 }}
                                    transition={
                                        showDestinations
                                            ? { duration: 0.12, delay: 0.8 + i * 0.35 }
                                            : { duration: 0.15 }
                                    }
                                >
                                    <Archive className="size-4.5 text-root" strokeWidth={1.75} />
                                </motion.div>
                            </motion.div>
                        </motion.div>
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
                                    ? "first:bg-foreground bg-muted-foreground/25"
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
                <div className="flex gap-6 items-stretch">
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
                                    phase === 0 ? "text-foreground" : "text-muted-foreground/10"
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
                                    phase === 1 ? "text-foreground" : "text-muted-foreground/10"
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
                                    phase === 2 ? "text-foreground" : "text-muted-foreground/10"
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
