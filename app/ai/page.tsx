"use client"

import { tool, DirectChatTransport, ToolLoopAgent } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { z } from "zod/mini"
import { useChat } from "@ai-sdk/react"
import { Input } from "@/components/ui/input"
import { PropsWithChildren, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, EyeIcon, LoaderCircle, PencilIcon, SquareStopIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Error } from "@/components/error"
import Markdown from "react-markdown"

const API_KEY = "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"

const readEntityTool = tool({
    description: "Read the metadata of a specific entity",
    inputSchema: z.object({
        entityId: z.string()
    }),
    execute: async ({ entityId }) => {
        return { "@id": entityId, "@type": "File", author: "#christopher", license: "Apache-2.0" }
    }
})

const editEntityTool = tool({
    description: "Edit a specific metadata entity",
    inputSchema: z.object({
        entityId: z.string(),
        content: z.json()
    }),
    execute: async ({ entityId, content }) => {
        console.log("edit entity executed", entityId, content)
    }
})

const openRouter = createOpenRouter({
    apiKey: API_KEY
})

const agent = new ToolLoopAgent({
    model: openRouter("openrouter/owl-alpha"),
    tools: {
        editEntityTool,
        readEntityTool
    },
    instructions:
        "You are a helpful assistant that can read and edit metadata entities. The metadata follows the JSON-LD format and is embedded in a Research Object Crate. Make sure to READ FIRST and WRITE SECOND, when changing metadata of entities. Always consider the request of the user as the HIGHEST PRIORITY"
})

export default function AIPage() {
    const [message, setMessage] = useState("")

    const {
        messages,
        sendMessage: _sendMessage,
        status,
        stop,
        error,
        clearError
    } = useChat({
        transport: new DirectChatTransport({
            agent
        })
    })

    const sendMessage = useCallback(() => {
        _sendMessage({
            text: message
        }).catch(console.error)
        setMessage("")
    }, [_sendMessage, message])

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
                {status === "ready" && <Button onClick={sendMessage}>Send</Button>}
                {(status === "submitted" || status === "streaming") && (
                    <Button onClick={stop}>
                        <SquareStopIcon className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
