"use client"

import { useChat } from "@ai-sdk/react"
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CogIcon, LoaderCircle, SparklesIcon, TrashIcon, XIcon } from "lucide-react"
import { Error as ErrorDisplay } from "@/components/error"
import { ModelSelection } from "@/components/ai/model-selection"
import { ProviderConfiguration, useAIAssistantSettings } from "@/lib/state/ai-assistant-settings"
import {
    DefaultChatTransport,
    lastAssistantMessageIsCompleteWithToolCalls,
    lastAssistantMessageIsCompleteWithApprovalResponses
} from "ai"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLayoutState } from "@/lib/state/layout-state"
import { ChatInput } from "@/components/ai/input"
import { toast } from "sonner"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { SettingsPages } from "@/components/modals/settings/settings-modal"
import { addBasePath } from "next/dist/client/add-base-path"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Message } from "@/components/ai/message"
import { useFrontendToolHandler } from "@/lib/ai/use-frontend-tool-handler"
import type { NC_UIMessage } from "@/lib/ai/types"
import { useAIAssistantChats } from "@/lib/state/ai-assistant-chats"
import { usePersistence } from "@/components/providers/persistence-provider"

function withoutModels(
    config: ProviderConfiguration | undefined
): Omit<ProviderConfiguration, "models"> | undefined {
    if (!config) return undefined
    const copy: Omit<ProviderConfiguration, "models"> & { models?: any[] } = structuredClone(config)
    delete copy.models
    return copy
}

export default function AIAssistantChat() {
    const showAIAssistant = useLayoutState((s) => s.showAIAssistant)
    const setShowAIAssistant = useLayoutState((s) => s.setShowAIAssistant)
    const { showSettingsModal } = useContext(GlobalModalContext)
    const updateChat = useAIAssistantChats((s) => s.updateChat)
    const getChat = useAIAssistantChats((s) => s.getChat)
    const persistence = usePersistence()
    const crateId = persistence.getCrateId()

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

    const { handleToolCall } = useFrontendToolHandler()

    const {
        messages,
        sendMessage: _sendMessage,
        status,
        stop,
        error,
        clearError,
        addToolOutput,
        setMessages,
        regenerate
    } = useChat({
        transport: new DefaultChatTransport<NC_UIMessage>({
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
        onToolCall: (...args): Promise<void> =>
            handleToolCall(
                {
                    addToolOutput
                },
                ...args
            ),
        messages: crateId ? getChat(crateId)?.messages : undefined
    })

    useEffect(() => {
        if (!crateId) return
        if (status === "ready") {
            updateChat(crateId, messages)
        }
    }, [crateId, messages, status, updateChat])

    const resetChat = useCallback(() => {
        stop().catch(console.log)
        setMessages([])
    }, [setMessages, stop])

    const hasUnansweredToolCalls = useMemo(() => {
        return messages.some((m) =>
            m.parts.some(
                (p) =>
                    p.type.startsWith("tool-") && // Even though this is hard-typed for tool-deleteEntity, it works for all tool calls
                    (p as NC_UIMessage["parts"][number] & { type: "tool-deleteEntity" }).state ===
                        "input-available"
            )
        )
    }, [messages])

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
            if (status === "streaming" || status === "submitted") return false

            const activeProvider = settings.getActiveProvider()
            if (!activeProvider || !activeProvider.selectedModel) {
                toast.error("Please select a model first")
                return false
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

            return true
        },
        [_sendMessage, scrollChatToBottom, settings, status]
    )

    const editMessage = useCallback(
        (message: NC_UIMessage, newContent: string) => {
            const stopIndex = messages.findIndex((m) => m.id === message.id)
            if (stopIndex === -1) return
            const targetMessage = messages[stopIndex]
            const newMessages = messages.slice(0, stopIndex)
            newMessages.push({
                ...targetMessage,
                parts: [
                    {
                        type: "text",
                        text: newContent
                    }
                ]
            })
            setMessages(newMessages)
            regenerate().then()
        },
        [messages, regenerate, setMessages]
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

    const Header = useMemo(() => {
        return (
            <div className="pl-4 pr-2 border-b text-sm h-10 flex items-center gap-2 truncate shrink-0 bg-accent">
                <SparklesIcon className="size-4" /> AI Assistant <div className="grow" />
                <Popover>
                    <Tooltip delayDuration={500}>
                        <PopoverTrigger asChild>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" aria-label="Delete Chat">
                                    <TrashIcon />
                                </Button>
                            </TooltipTrigger>
                        </PopoverTrigger>
                        <TooltipContent>Delete Chat</TooltipContent>
                    </Tooltip>
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
                <Tooltip delayDuration={500}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAIAssistant(false)}
                            aria-label={"Close AI Assistant"}
                        >
                            <XIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close AI Assistant</TooltipContent>
                </Tooltip>
            </div>
        )
    }, [resetChat, setShowAIAssistant])

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
            {Header}
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
                    {messages.map((message) => (
                        <Message
                            message={message}
                            key={message.id}
                            editMessage={(newContent) => editMessage(message, newContent)}
                            addToolOutput={addToolOutput}
                        />
                    ))}
                </div>
            </div>

            {status === "submitted" && (
                <div className="flex items-center gap-1 p-2 py-0 text-muted-foreground animate-pulse">
                    Submitting your request...
                </div>
            )}
            {status === "streaming" && (
                <div className="flex items-center gap-1 p-2 py-0 text-muted-foreground animate-pulse">
                    Working...
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
                    hide={hasUnansweredToolCalls}
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
