import { useCallback, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SendIcon, SquareIcon } from "lucide-react"
import { ChatStatus } from "ai"

export function ChatInput({
    sendMessage: _sendMessage,
    stop,
    status,
    disableSend,
    hide
}: {
    sendMessage: (msg: string) => boolean
    stop: () => void
    status: ChatStatus
    disableSend?: boolean
    hide?: boolean
}) {
    const [message, setMessage] = useState("")

    const sendMessage = useCallback(() => {
        if (disableSend) return
        if (!message.trim()) return

        const result = _sendMessage(message)
        if (result) setMessage("")
    }, [_sendMessage, disableSend, message])

    if (hide) return null

    return (
        <div className="flex items-end gap-2">
            <Textarea
                placeholder="Enter your request here..."
                value={message}
                className="resize-none rounded-r-lg!"
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                    }
                }}
            ></Textarea>
            {(status === "ready" || status === "error") && (
                <Button className="" onClick={sendMessage} disabled={disableSend}>
                    <SendIcon className="size-4" />
                </Button>
            )}
            {(status === "submitted" || status === "streaming") && (
                <Button onClick={stop}>
                    <SquareIcon className="size-4 fill-background" />
                </Button>
            )}
        </div>
    )
}
