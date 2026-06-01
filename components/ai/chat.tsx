"use client"

import { useChat } from "@ai-sdk/react"
import { Input } from "@/components/ui/input"
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    ChevronRight,
    EyeIcon,
    LoaderCircle,
    PencilIcon,
    PlusIcon,
    SparklesIcon,
    SquareStopIcon
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Error } from "@/components/error"
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

function withoutModels(
    config: ProviderConfiguration | undefined
): Omit<ProviderConfiguration, "models"> | undefined {
    if (!config) return undefined
    const copy: Omit<ProviderConfiguration, "models"> & { models?: any[] } = structuredClone(config)
    delete copy.models
    return copy
}

export default function AIAssistantChat() {
    const [message, setMessage] = useState("")

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
        addToolOutput
    } = useChat({
        transport: new DefaultChatTransport<UIMessage<never, never, InferUITools<typeof tools>>>({
            api: "/api/ai/chat",
            body: () => ({
                config: withoutModels(settings.getActiveProvider())
            })
        }),
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        onToolCall: ({ toolCall }) => {
            if (toolCall.dynamic) return

            switch (toolCall.toolName) {
                case "editEntity":
                    const result = editorState
                        .getState()
                        .editEntity(toolCall.input.entityId, toolCall.input.content)
                    addToolOutput({
                        tool: "editEntity",
                        toolCallId: toolCall.toolCallId,
                        output: result ?? undefined
                    })
                    return
                case "readEntity":
                    addToolOutput({
                        tool: "readEntity",
                        toolCallId: toolCall.toolCallId,
                        output: findEntity(editorState.getState().entities, toolCall.input.entityId)
                    })
                    return
                case "createEntity":
                    const created = editorState
                        .getState()
                        .addEntity(
                            toolCall.input.content["@id"],
                            toArray(toolCall.input.content["@type"]),
                            toolCall.input.content
                        )
                    addToolOutput({
                        tool: "createEntity",
                        toolCallId: toolCall.toolCallId,
                        output: created
                    })
                    return
                // TODO add missing tools
            }
        }
    })

    const sendMessage = useCallback(() => {
        _sendMessage({
            text: message
        }).catch(console.error)
        setMessage("")
    }, [_sendMessage, message])

    if (!show)
        return (
            <div className="flex h-full items-center justify-center">
                <LoaderCircle className="size-4 text-muted-foreground animate-spin" />
            </div>
        )

    return (
        <div className="flex flex-col h-full">
            <div className="pl-4 pr-2 border-b text-sm h-10 flex items-center gap-2 truncate shrink-0 bg-accent">
                <SparklesIcon className="size-4" /> AI Assistant
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
                                                )
                                            }}
                                        >
                                            {part.text}
                                        </Markdown>
                                    )
                                }

                                if (part.type === "tool-readEntity") {
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1 text-muted-foreground"
                                        >
                                            <EyeIcon className="size-4" /> Reading Entity{" "}
                                            {part.input?.entityId ?? "..."}
                                        </div>
                                    )
                                }

                                if (part.type === "tool-editEntity") {
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1 text-muted-foreground"
                                        >
                                            <PencilIcon className="size-4" /> Editing Entity{" "}
                                            {part.input?.entityId ?? "..."}
                                        </div>
                                    )
                                }

                                if (part.type === "tool-createEntity") {
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1 text-muted-foreground"
                                        >
                                            <PlusIcon className="size-4" /> Creating Entity{" "}
                                            {part.input?.content?.["@id"] ?? "..."}
                                        </div>
                                    )
                                }

                                if (part.type === "tool-getFilesList") {
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1 text-muted-foreground"
                                        >
                                            <EyeIcon className="size-4" /> Listing files in this
                                            RO-Crate
                                        </div>
                                    )
                                }

                                if (part.type === "tool-getMetadataSummary") {
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1 text-muted-foreground"
                                        >
                                            <EyeIcon className="size-4" /> Listing entities in this
                                            RO-Crate
                                        </div>
                                    )
                                }

                                if (part.type === "reasoning") {
                                    return (
                                        <Collapsible key={i}>
                                            <CollapsibleTrigger asChild>
                                                <button
                                                    key={i}
                                                    className="flex items-center gap-1 font-medium text-muted-foreground group"
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

                                return <div key={i}>{part.type}</div>
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {status === "submitted" && (
                <div className="flex items-center gap-1 p-2 text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" /> Submitting your request...
                </div>
            )}
            {status === "streaming" && (
                <div className="flex items-center gap-1 p-2 text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" /> Working...
                </div>
            )}
            {status === "error" && (
                <Error
                    title={"Your request to the AI Assistant failed"}
                    error={error}
                    onClear={clearError}
                />
            )}

            <div className="p-2">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Enter your request here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    {(status === "ready" || status === "error") && (
                        <Button onClick={sendMessage} disabled={!activeConfig}>
                            Send
                        </Button>
                    )}
                    {(status === "submitted" || status === "streaming") && (
                        <Button onClick={stop}>
                            <SquareStopIcon className="size-4" />
                        </Button>
                    )}
                </div>
                <ModelSelection />
            </div>
        </div>
    )
}
