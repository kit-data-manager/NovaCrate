"use client"

import { Joyride, EVENTS, STATUS, type EventHandler, type Options, type Step } from "react-joyride"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useIsEmbedded } from "@/lib/hooks/hooks"
import { useTourState } from "@/lib/state/tour-state"

const AI_ASSISTANT_ENABLED = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === "true"

/**
 * The main-menu segment ends at this step, which waits for the user to open
 * the Quickstart menu. Once the example item appears, the tour advances to
 * the step that highlights it.
 */
const AUTO_ADVANCE_TARGETS: Record<string, string> = {
    "menu-quickstart": '[data-tour="quickstart-example"]'
}

const sharedOptions: Partial<Options> = {
    disableFocusTrap: true,
    skipBeacon: true,
    arrowColor: "var(--primary)",
    backgroundColor: "var(--primary)",
    primaryColor: "var(--primary-foreground)",
    textColor: "var(--primary-foreground)",
    targetWaitTimeout: 100
}

const centeredStep = (id: string, title: string, content: React.ReactNode): Step => ({
    id,
    title,
    content,
    target: "body",
    placement: "center",
    skipBeacon: true
})

function buildMenuSteps(): Step[] {
    return [
        centeredStep(
            "menu-welcome",
            "Welcome to NovaCrate!",
            "New to NovaCrate? Take a look at some examples \u2014 the tour will continue in the editor."
        ),
        {
            id: "menu-quickstart",
            title: "Quickstart",
            content:
                "The Quickstart menu contains example crates you can explore. Click it and pick " +
                "\u201CAir Quality in Karlsruhe\u201D \u2014 the tour will continue in the editor.",
            target: '[data-tour="quickstart-button"]',
            placement: "bottom",
            buttons: ["close"]
        },
        {
            id: "menu-example",
            title: "Example Crate",
            content:
                "This example loads an example crate describing imaginary air quality measurements in Karlsruhe. " +
                "Click it to open the editor.",
            target: '[data-tour="quickstart-example"]',
            placement: "right",
            buttons: ["close"]
        },
        centeredStep(
            "menu-outro",
            "Your turn",
            "Pick an example from the Quickstart menu to continue the tour in the editor \u2014 or just explore on your own."
        )
    ]
}

function buildEditorSteps(overview: boolean): Step[] {
    const steps: Step[] = []

    // The welcome intro is shown only when the tour was started from inside the
    // editor. When continuing from the main menu, the editor walkthrough runs
    // without a separate intro step.
    if (overview) {
        steps.push(
            centeredStep(
                "editor-intro",
                "Welcome to the NovaCrate editor!",
                "Let's take a look around. We'll cover the header menus, the sidebar, and the entity editor."
            )
        )
    }

    steps.push(
        {
            id: "editor-crate-name",
            title: "Your Crate",
            content:
                "The name of the crate you are currently editing is always visible up here, next to the NovaCrate logo.",
            target: '[data-tour="crate-name"]',
            placement: "bottom",
            targetWaitTimeout: 15000
        },
        {
            id: "editor-menu",
            title: "Editor Menu",
            content:
                "The Editor menu contains global actions: the search, settings, the about dialog, and this guided tour.",
            target: '[data-tour="editor-menu"]',
            placement: "bottom"
        },
        {
            id: "editor-crate-menu",
            title: "Crate Menu",
            content:
                "The Crate menu lets you manage your crate: add entities, upload files, and export your crate as .zip, .eln or JSON.",
            target: '[data-tour="crate-menu"]',
            placement: "bottom"
        },
        {
            id: "editor-entity-menu",
            title: "Entity Menu",
            content:
                "The Entity menu acts on the entity you currently have open \u2014 save or revert changes, add properties, and more.",
            target: '[data-tour="entity-menu"]',
            placement: "bottom"
        },
        {
            id: "editor-search",
            title: "Global Search",
            content:
                "The global search finds anything in your crate \u2014 entities, properties, and files.",
            target: '[data-tour="search"]',
            placement: "bottom"
        },
        {
            id: "editor-nav-entities",
            title: "Entity Editor",
            content:
                "The Entity Editor is where the metadata entities of your crate live. It's the heart of NovaCrate.",
            target: '[data-tour="nav-entities"]',
            placement: "right"
        },
        {
            id: "editor-nav-file-explorer",
            title: "File Explorer",
            content:
                "The File Explorer shows the files and folders inside your crate. Double-click a file to preview it.",
            target: '[data-tour="nav-file-explorer"]',
            placement: "right"
        },
        {
            id: "editor-nav-graph",
            title: "Entity Graph",
            content:
                "The Entity Graph visualizes the references between your metadata entities. You can even create references by drag-and-drop.",
            target: '[data-tour="nav-graph"]',
            placement: "right"
        },
        {
            id: "editor-nav-json-editor",
            title: "JSON Editor",
            content:
                "For advanced users, the JSON Editor allows editing the raw JSON-LD of your crate.",
            target: '[data-tour="nav-json-editor"]',
            placement: "right"
        },
        {
            id: "editor-nav-context",
            title: "Profiles & Context",
            content:
                "Here you can manage schemas, profiles, and the JSON-LD context of your crate.",
            target: '[data-tour="nav-context"]',
            placement: "right"
        },
        {
            id: "editor-entity-browser",
            title: "Entity Browser",
            content:
                "The Entity Browser lists all entities in your crate. Click one to open it for editing.",
            target: '[data-tour="entity-browser"]',
            placement: "right"
        },
        {
            id: "editor-entity-editor",
            title: "Editing Entities",
            content:
                "This is where you edit the selected entity. Properties are validated as you type, and changes are highlighted.",
            target: '[data-tour="entity-editor"]',
            placement: "left"
        },
        {
            id: "editor-validation",
            title: "Live Validation",
            content:
                "NovaCrate continuously validates your crate. Open the drawer to see all validation issues at a glance.",
            target: '[data-tour="validation-drawer"]',
            placement: "right"
        }
    )

    if (AI_ASSISTANT_ENABLED) {
        steps.push({
            id: "editor-ai-assistant",
            title: "AI Assistant",
            content:
                "If you have an API key for one of the supported AI providers, the AI Assistant can help you create and edit metadata, import from ORCID and ROR, and more.",
            target: '[data-tour="ai-assistant"]',
            placement: "bottom"
        })
    }

    steps.push(
        centeredStep(
            "editor-outro",
            "That's it!",
            "All data stays on your device \u2014 NovaCrate stores everything locally in your browser. Have fun creating your own RO-Crates!"
        )
    )

    return steps
}

export function NovaTour() {
    const pathname = usePathname()
    const isEmbedded = useIsEmbedded()
    const tourActive = useTourState((s) => s.tourActive)
    const hasSeenTour = useTourState((s) => s.hasSeenTour)
    const startTour = useTourState((s) => s.startTour)
    const finishTour = useTourState((s) => s.finishTour)

    const isMainMenu = pathname === "/editor"
    const isEditor = /^\/editor\/(full|iframe)\//.test(pathname)
    const origin = useTourState((s) => s.tourOrigin)

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const activeTargetRef = useRef<string | null>(null)

    const clearPoll = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }, [])

    /**
     * Auto-start the tour on the main menu for first-time visitors.
     */
    useEffect(() => {
        if (isEmbedded || hasSeenTour || !isMainMenu) return
        const timeout = setTimeout(() => {
            if (!useTourState.getState().tourActive) startTour("main-menu")
        }, 500)
        return () => clearTimeout(timeout)
    }, [hasSeenTour, isEmbedded, isMainMenu, startTour])

    /**
     * The editor segment waits until the editor chrome is actually rendered.
     */
    const [editorReady, setEditorReady] = useState(false)
    useEffect(() => {
        if (!isEditor || !tourActive) {
            setEditorReady(false)
            return
        }
        const interval = setInterval(() => {
            setEditorReady(Boolean(document.querySelector('[data-tour="crate-name"]')))
        }, 200)
        return () => clearInterval(interval)
    }, [isEditor, tourActive])

    const overview = origin === "editor"

    const steps = useMemo(() => {
        if (!tourActive) return []
        if (isMainMenu) return buildMenuSteps()
        if (isEditor && editorReady) return buildEditorSteps(overview)
        return []
    }, [editorReady, isEditor, isMainMenu, overview, tourActive])

    /**
     * Menu/dropdown entries only exist while their menu is open: when the tour
     * waits on such a step, advance automatically once the user opens it. This
     * handler also records the current spotlight target so clicks outside it
     * can be treated as abandoning the tour.
     */
    const handleEvent = useCallback<EventHandler>(
        (data, controls) => {
            if (data.type === EVENTS.TOOLTIP) {
                // Only spotlighted (non-centered) steps have a dismissable target.
                activeTargetRef.current =
                    data.step.placement === "center" ? null : String(data.step.target)
                const autoAdvanceTarget = AUTO_ADVANCE_TARGETS[data.step.id ?? ""]
                if (autoAdvanceTarget) {
                    clearPoll()
                    pollRef.current = setInterval(() => {
                        if (document.querySelector(autoAdvanceTarget)) {
                            clearPoll()
                            controls.next()
                        }
                    }, 150)
                }
            } else if (data.type === EVENTS.STEP_AFTER) {
                clearPoll()
            }
            if (data.status === STATUS.SKIPPED || data.status === STATUS.FINISHED) {
                clearPoll()
                finishTour()
            }
        },
        [clearPoll, finishTour]
    )

    /**
     * If the user clicks outside the current spotlight target (and outside the
     * tooltip), they are not following the tour — hide it completely instead of
     * leaving a dangling tooltip / spinner and advancing to the outro.
     */
    useEffect(() => {
        if (!tourActive || steps.length === 0) return
        const onPointerDown = (event: PointerEvent) => {
            const target = activeTargetRef.current
            if (!target) return // centered steps / no dismissable target
            const el = event.target as Element
            if (el.closest(".react-joyride__tooltip")) return // tooltip controls
            if (el.closest(target)) return // click inside the spotlight target
            finishTour()
        }
        document.addEventListener("pointerdown", onPointerDown)
        return () => document.removeEventListener("pointerdown", onPointerDown)
    }, [finishTour, steps.length, tourActive])

    useEffect(() => clearPoll, [clearPoll])

    if (isEmbedded || !tourActive || steps.length === 0) return null

    return (
        <Joyride
            key={isEditor ? "editor" : "menu"}
            run
            continuous
            steps={steps}
            options={{
                ...sharedOptions,
                showProgress: true,
                closeButtonAction: "skip"
            }}
            locale={{
                back: "Back",
                close: "Close",
                last: "Finish",
                next: "Next",
                skip: "Skip tour"
            }}
            onEvent={handleEvent}
        />
    )
}
