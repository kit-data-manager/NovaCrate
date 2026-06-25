import type { NC_UIMessage } from "@/lib/ai/types"
import { LoaderCircle, TrashIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToolCall } from "@/components/ai/tool-call"
import { useCallback, useState } from "react"
import { ChatAddToolOutputFunction } from "ai"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCore } from "@/components/providers/core-provider"
import { EntityIcon } from "@/components/entity/entity-icon"
import { useEditorState } from "@/lib/state/editor-state"
import { useShallow } from "zustand/react/shallow"
import { findEntity, getEntityDisplayName } from "@/lib/utils"
import { useGoToEntityEditor } from "@/lib/hooks/hooks"

export function DeleteEntityTool({
    addToolOutput,
    part
}: {
    part: NC_UIMessage["parts"][number] & { type: "tool-deleteEntity" } // a message part of type tool-deleteEntity
    addToolOutput: ChatAddToolOutputFunction<NC_UIMessage>
}) {
    const core = useCore()
    const entity = useEditorState(
        useShallow((store) =>
            part.input?.entityId ? findEntity(store.getEntities(), part.input.entityId) : undefined
        )
    )
    const goToEntity = useGoToEntityEditor(entity)

    const respondWithError = useCallback(
        (e: unknown) => {
            addToolOutput({
                tool: "deleteEntity",
                toolCallId: part.toolCallId,
                state: "output-error",
                errorText:
                    typeof e === "string" ? e : e instanceof Error ? e.message : JSON.stringify(e)
            })
        },
        [addToolOutput, part.toolCallId]
    )

    const respondWithSuccess = useCallback(() => {
        addToolOutput({
            tool: "deleteEntity",
            toolCallId: part.toolCallId,
            state: "output-available",
            output: {}
        })
    }, [addToolOutput, part.toolCallId])

    const [isDeleting, setIsDeleting] = useState(false)
    const onDeleteEntityClick = useCallback(
        (part: NC_UIMessage["parts"][number] & { type: "tool-deleteEntity" }) => {
            if (isDeleting) return
            if (!part.input || !part.input.entityId) {
                respondWithError(
                    "Tool call incomplete. Either the input is completely missing, or the entityId is missing."
                )
                return
            }

            setIsDeleting(true)
            // We directly call the core-level method here to forward error messages to the AI instead of the UI
            // deleteEntity from crate mutations would catch the error and display it to UI
            core.deleteEntity(part.input.entityId, part.input.deleteData ?? false)
                .then(() => {
                    respondWithSuccess()
                })
                .catch((e: unknown) => {
                    console.error("Failed to delete file", e)
                    respondWithError(e)
                })
                .finally(() => {
                    setIsDeleting(false)
                })
        },
        [core, isDeleting, respondWithError, respondWithSuccess]
    )

    const onDeleteDenyClick = useCallback(
        (part: NC_UIMessage["parts"][number] & { type: "tool-deleteEntity" }) => {
            if (!part.input) {
                respondWithError("Tool call incomplete. The input is missing.")
                return
            }

            respondWithError("The user has denied the delete operation")
        },
        [respondWithError]
    )

    if (part.state === "input-available") {
        return (
            <Alert>
                {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <TrashIcon />}
                <AlertTitle>Confirmation required</AlertTitle>
                <AlertDescription>
                    The AI Assistant wants to delete the following entity:
                    <div className="p-1 pl-2">
                        <Button onClick={() => goToEntity()} variant="outline" className="px-2">
                            <EntityIcon entity={entity} />
                            {entity && getEntityDisplayName(entity, true)}
                        </Button>
                    </div>
                    {part.input.deleteData &&
                        "The referenced files/folders and any contained files/folders will also irreversibly be deleted."}
                    <div className="flex items-center gap-2 justify-end pt-2">
                        <Button
                            variant={"secondary"}
                            onClick={() => onDeleteDenyClick(part)}
                            disabled={isDeleting}
                        >
                            <XIcon /> Abort
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => onDeleteEntityClick(part)}
                            disabled={isDeleting}
                        >
                            <TrashIcon /> Delete
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        )
    } else {
        return (
            <ToolCall part={part} icon={TrashIcon}>
                Delete Entity {part.input?.entityId ?? "..."}
            </ToolCall>
        )
    }
}
