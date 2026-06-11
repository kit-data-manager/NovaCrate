"use client"

import { useChat } from "@ai-sdk/react"
import { PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    BugIcon,
    ChevronRight,
    CogIcon,
    EyeIcon,
    LoaderCircle,
    PencilIcon,
    PlusIcon,
    SparklesIcon,
    TrashIcon,
    XIcon
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Error as ErrorDisplay } from "@/components/error"
import Markdown from "react-markdown"
import { ModelSelection } from "@/components/ai/model-selection"
import { ProviderConfiguration, useAIAssistantSettings } from "@/lib/state/ai-assistant-settings"
import {
    DefaultChatTransport,
    InferUITools,
    lastAssistantMessageIsCompleteWithToolCalls,
    lastAssistantMessageIsCompleteWithApprovalResponses,
    UIMessage
} from "ai"
import type { tools } from "@/lib/ai/tools"
import { editorState } from "@/lib/state/editor-state"
import { findEntity, toArray } from "@/lib/utils"
import remarkGfm from "remark-gfm"
import { useFileService } from "@/lib/hooks/use-persistence"
import { ToolCall } from "@/components/ai/tool-call"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLayoutState } from "@/lib/state/layout-state"
import { ChatInput } from "@/components/ai/input"
import { toast } from "sonner"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { SettingsPages } from "@/components/modals/settings/settings-modal"
import { useValidation } from "@/lib/validation/hooks"
import { useCore } from "@/components/providers/core-provider"
import { importOrganizationFromRor, importPersonFromOrcid } from "@/lib/entity-import"
import { addBasePath } from "next/dist/client/add-base-path"
import Link from "next/link"

function withoutModels(
    config: ProviderConfiguration | undefined
): Omit<ProviderConfiguration, "models"> | undefined {
    if (!config) return undefined
    const copy: Omit<ProviderConfiguration, "models"> & { models?: any[] } = structuredClone(config)
    delete copy.models
    return copy
}

export default function AIAssistantChat() {
    const fileService = useFileService()
    const core = useCore()
    const showAIAssistant = useLayoutState((s) => s.showAIAssistant)
    const setShowAIAssistant = useLayoutState((s) => s.setShowAIAssistant)
    const { showSettingsModal } = useContext(GlobalModalContext)
    const validation = useValidation()

    // Hidden at the start to prevent hydration issues
    const [show, setShow] = useState(false)

    useEffect(() => {
        setShow(true)
    }, [])

    // Auto-close if AI Assistant is disabled
    useEffect(() => {
        if (showAIAssistant && process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED !== "true") {
            console.warn("Closing AI Assistant because it is disabled in the environment")
            setShowAIAssistant(false)
        }
    }, [setShowAIAssistant, showAIAssistant])

    const settings = useAIAssistantSettings()

    const {
        messages,
        sendMessage: _sendMessage,
        status,
        stop,
        error,
        clearError,
        addToolOutput,
        setMessages
    } = useChat({
        transport: new DefaultChatTransport<UIMessage<never, never, InferUITools<typeof tools>>>({
            api: addBasePath("/api/ai/chat"),
            body: () => {
                return {
                    config: withoutModels(settings.getActiveProvider())
                }
            }
        }),
        sendAutomaticallyWhen: (p) =>
            lastAssistantMessageIsCompleteWithApprovalResponses(p) ||
            lastAssistantMessageIsCompleteWithToolCalls(p),
        onToolCall: async ({ toolCall }) => {
            if (toolCall.dynamic) return

            switch (toolCall.toolName) {
                case "editEntity": {
                    const result = editorState.getState().editEntity(toolCall.input.content)
                    if (result) {
                        addToolOutput({
                            tool: "editEntity",
                            toolCallId: toolCall.toolCallId,
                            output: result
                        })
                    } else {
                        addToolOutput({
                            tool: "editEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Could not edit the entity with id ${toolCall.input.content["@id"]}. Does the entity even exist? If you tried to change the entity, does an entity with the target id already exist?`
                        })
                    }

                    return
                }
                case "readEntity": {
                    const found = findEntity(
                        editorState.getState().entities,
                        toolCall.input.entityId
                    )
                    if (found) {
                        addToolOutput({
                            tool: "readEntity",
                            toolCallId: toolCall.toolCallId,
                            output: found
                        })
                    } else {
                        addToolOutput({
                            tool: "readEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Could not find an entity with id ${toolCall.input.entityId}`
                        })
                    }

                    return
                }
                case "createEntity": {
                    const created = editorState
                        .getState()
                        .addEntity(
                            toolCall.input.content["@id"],
                            toArray(toolCall.input.content["@type"]),
                            toolCall.input.content
                        )
                    if (created) {
                        addToolOutput({
                            tool: "createEntity",
                            toolCallId: toolCall.toolCallId,
                            output: created
                        })
                    } else {
                        addToolOutput({
                            tool: "createEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Failed to create the entity with id ${toolCall.input.content["@id"]}. Does an entity with the same identifier already exist?`
                        })
                    }
                    return
                }
                case "getFilesList": {
                    if (!fileService) {
                        addToolOutput({
                            tool: "getFilesList",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText:
                                "The file service is not available. The user is probably running the software in an environment that does not implement a file service."
                        })
                    } else {
                        const filesList = await fileService.getContentList()
                        addToolOutput({
                            tool: "getFilesList",
                            toolCallId: toolCall.toolCallId,
                            output: filesList.map((f) => f.path)
                        })
                    }
                    return
                }
                case "getMetadataSummary": {
                    const entities = Array.from(editorState.getState().entities.values())
                    addToolOutput({
                        tool: "getMetadataSummary",
                        toolCallId: toolCall.toolCallId,
                        output: Object.fromEntries(entities.map((e) => [e["@id"], e["@type"]]))
                    })
                    return
                }
                case "readFilePlainText": {
                    if (!fileService) {
                        addToolOutput({
                            tool: "readFilePlainText",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText:
                                "The file service is not available. The user is probably running the software in an environment that does not implement a file service."
                        })
                    } else {
                        try {
                            const blob = await fileService.getFile(toolCall.input.path)
                            const slice = blob.slice(
                                toolCall.input.offset,
                                toolCall.input.offset + toolCall.input.limit
                            )
                            const text = await slice.text()
                            addToolOutput({
                                tool: "readFilePlainText",
                                toolCallId: toolCall.toolCallId,
                                output: text
                            })
                        } catch (e) {
                            addToolOutput({
                                tool: "readFilePlainText",
                                toolCallId: toolCall.toolCallId,
                                state: "output-error",
                                errorText: `File read failed with the following error: ${e instanceof Error ? e.message : JSON.stringify(e)}`
                            })
                        }
                    }
                    return
                }
                case "getValidationResults": {
                    const entities = editorState.getState().getEntities()
                    const promises = [
                        validation
                            .validateCrate()
                            .catch((e) => console.error("Crate validation failed: ", e)),
                        Array.from(entities.values()).map((entity) => {
                            return Promise.allSettled([
                                validation
                                    .validateEntity(entity["@id"])
                                    .catch((e) =>
                                        console.error(
                                            `Entity validation failed on ${entity["@id"]}: `,
                                            e
                                        )
                                    ),
                                Object.keys(entity).map((prop) => {
                                    return validation
                                        .validateProperty(entity["@id"], prop)
                                        .catch((e) =>
                                            console.error(
                                                `Property validation failed on ${entity["@id"]} ${prop}: `,
                                                e
                                            )
                                        )
                                })
                            ])
                        })
                    ]

                    await Promise.allSettled(promises)

                    addToolOutput({
                        tool: "getValidationResults",
                        toolCallId: toolCall.toolCallId,
                        output: validation.resultStore.getState().results
                    })

                    return
                }
                case "deleteEntity": {
                    try {
                        await core.deleteEntity(toolCall.input.entityId, toolCall.input.deleteData)
                        addToolOutput({
                            tool: "deleteEntity",
                            toolCallId: toolCall.toolCallId,
                            output: {}
                        })
                    } catch (e) {
                        addToolOutput({
                            tool: "deleteEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Failed to delete entity. ${e instanceof Error ? e.message : JSON.stringify(e)}`
                        })
                    }
                    return
                }
                case "moveEntity": {
                    try {
                        await core.moveEntity(
                            toolCall.input.currentEntityId,
                            toolCall.input.newEntityId
                        )
                        addToolOutput({
                            tool: "moveEntity",
                            toolCallId: toolCall.toolCallId,
                            output: {}
                        })
                    } catch (e) {
                        addToolOutput({
                            tool: "moveEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Failed to move entity. ${e instanceof Error ? e.message : JSON.stringify(e)}`
                        })
                    }
                    return
                }
                case "importPersonFromORCID": {
                    try {
                        const entity = await importPersonFromOrcid(toolCall.input.identifier)
                        const created = editorState
                            .getState()
                            .addEntity(entity["@id"], toArray(entity["@type"]), entity)
                        if (created) {
                            addToolOutput({
                                tool: "importPersonFromORCID",
                                toolCallId: toolCall.toolCallId,
                                output: created
                            })
                        } else {
                            addToolOutput({
                                tool: "importPersonFromORCID",
                                toolCallId: toolCall.toolCallId,
                                state: "output-error",
                                errorText: `Failed to write imported entity. Does an entity with the same identifier already exist? (identifier: ${entity["@id"]})`
                            })
                        }
                    } catch (e) {
                        addToolOutput({
                            tool: "importPersonFromORCID",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Failed to import Person entity from ORCID. ${e instanceof Error ? e.message : JSON.stringify(e)}`
                        })
                    }
                    return
                }
                case "importOrganizationFromROR": {
                    try {
                        const entity = await importOrganizationFromRor(toolCall.input.identifier)
                        const created = editorState
                            .getState()
                            .addEntity(entity["@id"], toArray(entity["@type"]), entity)
                        if (created) {
                            addToolOutput({
                                tool: "importOrganizationFromROR",
                                toolCallId: toolCall.toolCallId,
                                output: created
                            })
                        } else {
                            addToolOutput({
                                tool: "importOrganizationFromROR",
                                toolCallId: toolCall.toolCallId,
                                state: "output-error",
                                errorText: `Failed to write imported entity. Does an entity with the same identifier already exist? (identifier: ${entity["@id"]})`
                            })
                        }
                    } catch (e) {
                        addToolOutput({
                            tool: "importOrganizationFromROR",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Failed to import Organization entity from ROR. ${e instanceof Error ? e.message : JSON.stringify(e)}`
                        })
                    }
                    return
                }
            }
        }
    })

    const resetChat = useCallback(() => {
        setMessages([])
    }, [setMessages])

    const chatContainer = useRef<HTMLDivElement>(null)
    const chatContent = useRef<HTMLDivElement>(null)
    const stickToBottom = useRef(true)

    const scrollChatToBottom = useCallback(() => {
        const cc = chatContainer.current
        cc?.scrollTo({
            top: cc.scrollHeight - cc.clientHeight,
            behavior: "instant"
        })
    }, [])

    const sendMessage = useCallback(
        (msg: string) => {
            const activeProvider = settings.getActiveProvider()
            if (!activeProvider || !activeProvider.selectedModel) {
                toast.error("Please select a model first")
                return
            }

            scrollChatToBottom()
            _sendMessage({
                text: msg
            }).catch((err) => {
                toast.error(
                    "Failed to send message: " +
                        (err instanceof Error ? err.message : JSON.stringify(err))
                )
            })
        },
        [_sendMessage, scrollChatToBottom, settings]
    )

    useEffect(() => {
        if (!chatContainer.current) return
        const cc = chatContainer.current
        const content = chatContent.current

        const onScroll = () => {
            if (cc.scrollHeight < cc.clientHeight) {
                stickToBottom.current = true
            } else {
                stickToBottom.current = cc.scrollTop + cc.clientHeight >= cc.scrollHeight
            }
        }

        const observer = new MutationObserver(() => {
            if (stickToBottom.current) {
                scrollChatToBottom()
            }
        })

        if (content) observer.observe(content, { childList: true, subtree: true })
        cc.addEventListener("scroll", onScroll)
        return () => {
            cc.removeEventListener("scroll", onScroll)
            observer.disconnect()
        }
    }, [show, settings, scrollChatToBottom])

    if (!show)
        return (
            <div className="flex h-full items-center justify-center">
                <LoaderCircle className="size-4 text-muted-foreground animate-spin" />
            </div>
        )

    if (settings.providers.length === 0)
        return (
            <div className="flex flex-col h-full items-center justify-center gap-2 text-center p-4">
                <SparklesIcon /> <div className="text-2xl font-black mb-4">AI Assistant</div>
                <div className="text-sm mb-4">
                    Connect your first LLM Provider to NovaCrate to use the AI Assistant. The AI
                    Assistant is an Agentic AI driven by an LLM of your choice. It can view and edit
                    your metadata, read your files, and generate new entities.
                </div>
                <Button onClick={() => showSettingsModal(SettingsPages.AI_ASSISTANT)}>
                    <CogIcon /> Configure in Settings
                </Button>
                <Button variant="secondary" onClick={() => setShowAIAssistant(false)}>
                    Close AI Assistant
                </Button>
                <div className="text-xs text-muted-foreground font-light mt-4">
                    Need help? View the{" "}
                    <Link
                        className="underline"
                        target="_blank"
                        href={
                            "https://github.com/kit-data-manager/NovaCrate/blob/main/docs/ai-assistant-setup.md"
                        }
                    >
                        Documentation
                    </Link>
                    .
                </div>
            </div>
        )

    return (
        <div className="flex flex-col h-full">
            <div className="pl-4 pr-2 border-b text-sm h-10 flex items-center gap-2 truncate shrink-0 bg-accent">
                <SparklesIcon className="size-4" /> AI Assistant <div className="grow" />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <TrashIcon />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <div>
                            Do you want to reset the chat? This will delete all messages and start a
                            new conversation.
                        </div>
                        <Button className="w-full mt-2" variant="destructive" onClick={resetChat}>
                            Delete Chat
                        </Button>
                    </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={() => setShowAIAssistant(false)}>
                    <XIcon />
                </Button>
            </div>
            <div className="grow overflow-y-auto" ref={chatContainer}>
                <div className="flex flex-col min-h-full grow justify-end" ref={chatContent}>
                    {messages.length === 0 && (
                        <div className="p-4 text-muted-foreground font-light">
                            What can I help you with today? To get started, here are some prompt
                            ideas:
                            <ul className="list-disc pl-4 mb-4">
                                <li>Explain this RO-Crate to me</li>
                                <li>Create a new Person entity describing me as an author</li>
                                <li>
                                    Find undescribed files in this RO-Crate and extract metadata for
                                    them
                                </li>
                                <li>Find all unused contextual entities in this RO-Crate</li>
                                <li>Please check if every Data Entity has an author</li>
                            </ul>
                            Furthermore, I can do the following things:
                            <ul className="list-disc pl-4">
                                <li>Edit metadata (Create, Read, Update, Delete)</li>
                                <li>Read plain files (like TXT or CSV)</li>
                                <li>Rename entities and move files</li>
                                <li>
                                    Search through entities and files and explain their
                                    relationships
                                </li>
                                <li>Answer questions about your RO-Crate or RO-Crate in general</li>
                            </ul>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div
                            className={`space-y-1 m-2 p-2 rounded-xl ${m.role === "user" ? "w-[70%] bg-accent self-end p-4 py-3" : ""} overflow-x-auto overflow-y-hidden shrink-0`}
                            key={m.id}
                        >
                            {m.parts.map((part, i) => {
                                if (part.type === "text") {
                                    return (
                                        <Markdown
                                            key={i}
                                            skipHtml
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                ul: (props: PropsWithChildren) => (
                                                    <ul className="list-disc pl-4">
                                                        {props.children}
                                                    </ul>
                                                ),
                                                ol: (props: PropsWithChildren) => (
                                                    <ol className="list-decimal pl-4">
                                                        {props.children}
                                                    </ol>
                                                ),
                                                table: (props: PropsWithChildren) => (
                                                    <Table>{props.children}</Table>
                                                ),
                                                tr: (props: PropsWithChildren) => (
                                                    <TableRow>{props.children}</TableRow>
                                                ),
                                                th: (props: PropsWithChildren) => (
                                                    <TableHead className="font-bold">
                                                        {props.children}
                                                    </TableHead>
                                                ),
                                                td: (props: PropsWithChildren) => (
                                                    <TableCell>{props.children}</TableCell>
                                                ),
                                                tbody: (props: PropsWithChildren) => (
                                                    <TableBody>{props.children}</TableBody>
                                                ),
                                                thead: (props: PropsWithChildren) => (
                                                    <TableHeader>{props.children}</TableHeader>
                                                ),
                                                h1: (props: PropsWithChildren) => (
                                                    <h1 className="text-2xl font-bold mt-4">
                                                        {props.children}
                                                    </h1>
                                                ),
                                                h2: (props: PropsWithChildren) => (
                                                    <h2 className="text-xl font-bold mt-3">
                                                        {props.children}
                                                    </h2>
                                                ),
                                                h3: (props: PropsWithChildren) => (
                                                    <h3 className="text-lg font-bold mt-2">
                                                        {props.children}
                                                    </h3>
                                                ),
                                                h4: (props: PropsWithChildren) => (
                                                    <h4 className="font-bold mt-1">
                                                        {props.children}
                                                    </h4>
                                                ),
                                                pre: (props: PropsWithChildren) => (
                                                    <pre className="border rounded-lg p-2 text-sm">
                                                        {props.children}
                                                    </pre>
                                                )
                                            }}
                                        >
                                            {part.text}
                                        </Markdown>
                                    )
                                }

                                if (part.type === "tool-readEntity") {
                                    return (
                                        <ToolCall key={i} part={part} icon={EyeIcon}>
                                            Reading Entity {part.input?.entityId ?? "..."}
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-editEntity") {
                                    return (
                                        <ToolCall key={i} part={part} icon={PencilIcon}>
                                            Editing Entity {part.input?.content?.["@id"] ?? "..."}
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-createEntity") {
                                    return (
                                        <ToolCall key={i} part={part} icon={PlusIcon}>
                                            Creating Entity {part.input?.content?.["@id"] ?? "..."}
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-getFilesList") {
                                    return (
                                        <ToolCall key={i} part={part} icon={EyeIcon}>
                                            Listing files in this RO-Crate
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-getMetadataSummary") {
                                    return (
                                        <ToolCall key={i} part={part} icon={EyeIcon}>
                                            Listing entities in this RO-Crate
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-readFilePlainText") {
                                    return (
                                        <ToolCall key={i} part={part} icon={EyeIcon}>
                                            Reading File {part.input?.path ?? "..."}
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-getValidationResults") {
                                    return (
                                        <ToolCall key={i} part={part} icon={BugIcon}>
                                            Validating RO-Crate
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-moveEntity") {
                                    return (
                                        <ToolCall key={i} part={part} icon={PencilIcon}>
                                            Rename Entity {part.input?.currentEntityId ?? "..."} to{" "}
                                            {part.input?.newEntityId ?? "..."}
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-deleteEntity") {
                                    return (
                                        <ToolCall key={i} part={part} icon={TrashIcon}>
                                            Delete Entity {part.input?.entityId ?? "..."}
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-importPersonFromORCID") {
                                    return (
                                        <ToolCall key={i} part={part} icon={PlusIcon}>
                                            Import Person from ORCID:{" "}
                                            {part.output?.["@id"] ?? "..."}
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "tool-importOrganizationFromROR") {
                                    return (
                                        <ToolCall key={i} part={part} icon={PlusIcon}>
                                            Import Organization from ROR:{" "}
                                            {part.output?.["@id"] ?? "..."}
                                        </ToolCall>
                                    )
                                }

                                if (part.type === "reasoning") {
                                    return (
                                        <Collapsible key={i}>
                                            <CollapsibleTrigger asChild>
                                                <button
                                                    key={i}
                                                    className="flex items-center gap-1 text-muted-foreground group"
                                                >
                                                    {part.state === "streaming" ? (
                                                        <LoaderCircle className="size-4 animate-spin" />
                                                    ) : (
                                                        <ChevronRight className="size-4 group-aria-expanded:rotate-90" />
                                                    )}
                                                    Reasoning
                                                </button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className={"pl-2 mb-3"}>
                                                {part.text}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )
                                }

                                if (part.type === "step-start") return null

                                return <div key={i}>[{part.type}]</div>
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {status === "submitted" && (
                <div className="flex items-center gap-1 p-2 py-0 text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" /> Submitting your request...
                </div>
            )}
            {status === "streaming" && (
                <div className="flex items-center gap-1 p-2 py-0 text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" /> Working...
                </div>
            )}
            {status === "error" && (
                <ErrorDisplay
                    title={"Your request to the AI Assistant failed"}
                    error={error}
                    onClear={clearError}
                />
            )}

            <div className="p-2">
                <ChatInput
                    sendMessage={sendMessage}
                    status={status}
                    disableSend={
                        !settings.activeProvider || !settings.getActiveProvider()?.selectedModel
                    }
                    stop={stop}
                />
                <ModelSelection />
                <div className="text-xs font-light text-center text-muted-foreground p-2 pb-0">
                    AI Assistant can make mistakes. Use it responsibly and review your RO-Crate
                    before publishing.
                </div>
            </div>
        </div>
    )
}
