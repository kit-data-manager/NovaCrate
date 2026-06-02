import { useCallback, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SendIcon, SquareStopIcon } from "lucide-react"
import { ChatStatus } from "ai"

export function ChatInput({
    sendMessage: _sendMessage,
    stop,
    status,
    disableSend
}: {
    sendMessage: (msg: string) => void
    stop: () => void
    status: ChatStatus
    disableSend?: boolean
}) {
    const [message, setMessage] = useState("")

    const sendMessage = useCallback(() => {
        setMessage("")
        _sendMessage(message)
    }, [_sendMessage, message])

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
                    <SquareStopIcon className="size-4" />
                </Button>
            )}
        </div>
    )
}
