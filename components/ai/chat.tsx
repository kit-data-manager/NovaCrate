"use client"

import { useChat } from "@ai-sdk/react"
import { PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
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
    const setShowAIAssistant = useLayoutState((s) => s.setShowAIAssistant)
    const { showSettingsModal } = useContext(GlobalModalContext)

    // Hidden at the start to prevent hydration issues
    const [show, setShow] = useState(false)

    useEffect(() => {
        setShow(true)
    }, [])

    const settings = useAIAssistantSettings()
    const activeConfig = useMemo(() => {
        return settings.getActiveProvider()
    }, [settings])

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
            api: "/api/ai/chat",
            body: () => ({
                config: withoutModels(settings.getActiveProvider())
            })
        }),
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        onToolCall: async ({ toolCall }) => {
            if (toolCall.dynamic) return

            switch (toolCall.toolName) {
                case "editEntity":
                    const result = editorState
                        .getState()
                        .editEntity(toolCall.input.entityId, toolCall.input.content)
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
                            errorText: `Could not edit the entity with id ${toolCall.input.entityId}. Does the entity even exist? If you tried to change the entity, does an entity with the target id already exist?`
                        })
                    }

                    return
                case "readEntity":
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
                case "createEntity":
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
                case "getFilesList":
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
                case "getMetadataSummary":
                    const entities = Array.from(editorState.getState().entities.values())
                    addToolOutput({
                        tool: "getMetadataSummary",
                        toolCallId: toolCall.toolCallId,
                        output: Object.fromEntries(entities.map((e) => [e["@id"], e["@type"]]))
                    })
                    return
                case "readFilePlainText":
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
            }
        }
    })

    const resetChat = useCallback(() => {
        setMessages([])
    }, [setMessages])

    const sendMessage = useCallback(
        (msg: string) => {
            _sendMessage({
                text: msg
            }).catch((err) => {
                toast.error(
                    "Failed to send message: " + (err instanceof Error)
                        ? err.message
                        : JSON.stringify(err)
                )
            })
        },
        [_sendMessage]
    )

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
            <div className="grow overflow-y-auto">
                <div className="flex flex-col min-h-full grow justify-end">
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
                                            Editing Entity {part.input?.entityId ?? "..."}
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
                    disableSend={!activeConfig || !activeConfig.selectedModel}
                    stop={stop}
                />
                <ModelSelection />
            </div>
        </div>
    )
}
