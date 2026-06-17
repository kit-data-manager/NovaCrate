import { CheckIcon, CopyIcon, PencilIcon, XIcon } from "lucide-react"
import type { NC_UIMessage } from "@/lib/ai/types"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "usehooks-ts"
import { useCallback, useState } from "react"
import { Textarea } from "@/components/ui/textarea"

export function UserMessage({
    message: m,
    editMessage
}: {
    message: NC_UIMessage
    editMessage: (text: string) => void
}) {
    const [editing, setEditing] = useState(false)
    const [editingContent, setEditingContent] = useState("")
    const [copied, setCopied] = useState(false)
    const [, copy] = useCopyToClipboard()

    const copyMessage = useCallback(() => {
        copy(m.parts.map((p) => (p.type === "text" ? p.text : "")).join("\n")).then()
        setCopied(true)
        setTimeout(() => setCopied(false), 1000)
    }, [copy, m.parts])

    const startEditing = useCallback(() => {
        setEditing(true)
        setEditingContent(m.parts.map((p) => (p.type === "text" ? p.text : "")).join("\n"))
    }, [m.parts])

    const confirmEdit = useCallback(() => {
        editMessage(editingContent)
        setEditing(false)
    }, [editMessage, editingContent])

    const cancelEdit = useCallback(() => {
        setEditing(false)
    }, [])

    return (
        <div className="self-end w-[70%] m-2 mb-0 group">
            <div
                className={`rounded-xl bg-accent p-4 py-3 overflow-x-auto overflow-y-hidden shrink-0`}
            >
                {editing ? (
                    <div>
                        <Textarea
                            autoFocus
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                        />
                        <div className="flex gap-2 pt-2">
                            <Button className="grow" onClick={cancelEdit}>
                                <XIcon /> Cancel
                            </Button>
                            <Button className="grow" onClick={confirmEdit}>
                                <CheckIcon /> Confirm
                            </Button>
                        </div>
                    </div>
                ) : (
                    m.parts.map((p) => p.type === "text" && p.text)
                )}
            </div>
            {!editing && (
                <div className="pt-1 flex gap-1 justify-end group-hover:opacity-100 delay-300 opacity-0 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={startEditing}>
                        <PencilIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={copyMessage}>
                        {copied ? (
                            <CheckIcon className="size-4" />
                        ) : (
                            <CopyIcon className="size-4" />
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
