"use client"

import { useChat } from "@ai-sdk/react"
import { Input } from "@/components/ui/input"
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, EyeIcon, LoaderCircle, PencilIcon, SquareStopIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Error } from "@/components/error"
import Markdown from "react-markdown"
import { ModelSelection } from "@/components/ai/model-selection"
import { ProviderConfiguration, useAIAssistantSettings } from "@/lib/state/ai-assistant-settings"
import { DefaultChatTransport, InferUITools, UIMessage } from "ai"
import type { tools } from "@/lib/ai/tools"

function withoutModels(
    config: ProviderConfiguration | undefined
): Omit<ProviderConfiguration, "models"> | undefined {
    if (!config) return undefined
    const copy: Omit<ProviderConfiguration, "models"> & { models?: any[] } = structuredClone(config)
    delete copy.models
    return copy
}

export default function AIPage() {
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
        clearError
    } = useChat({
        transport: new DefaultChatTransport<UIMessage<never, never, InferUITools<typeof tools>>>({
            api: "/api/ai/chat",
            body: () => ({
                config: withoutModels(settings.getActiveProvider())
            })
        })
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
        <div className="flex flex-col h-full pb-20">
            <div className="flex flex-col grow justify-end overflow-y-auto">
                {messages.map((m) => (
                    <div
                        className={`space-y-1 m-2 p-2 rounded-xl ${m.role === "user" ? "bg-accent self-end" : ""}`}
                        key={m.id}
                    >
                        {m.parts.map((part, i) => {
                            if (part.type === "text") {
                                return (
                                    <Markdown
                                        key={i}
                                        skipHtml
                                        components={{
                                            ul: (props: PropsWithChildren) => (
                                                <ul className="list-disc pl-4">{props.children}</ul>
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

                            if (part.type === "tool-readEntityTool") {
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

                            if (part.type === "tool-editEntityTool") {
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

            <div className="flex items-center gap-2 p-2">
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
    )
}
