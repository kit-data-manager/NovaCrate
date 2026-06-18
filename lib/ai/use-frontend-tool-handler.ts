import { deepEqual, findEntity, toArray } from "@/lib/utils"
import { useCallback, useEffect, useRef } from "react"
import { editorState } from "@/lib/state/editor-state"
import type { ChatAddToolOutputFunction, ChatOnToolCallCallback } from "ai"
import { useFileService } from "@/lib/hooks/use-persistence"
import { useValidation } from "@/lib/validation/hooks"
import { useCore } from "@/components/providers/core-provider"
import { importOrganizationFromRor, importPersonFromOrcid } from "@/lib/entity-import"
import type { NC_UIMessage } from "@/lib/ai/types"
import { usePersistence } from "@/components/providers/persistence-provider"

type Callback = ChatOnToolCallCallback<NC_UIMessage>
type CallbackParameters = Parameters<Callback>

export function useFrontendToolHandler() {
    const core = useCore()
    const fileService = useFileService()
    const validation = useValidation()
    const persistence = usePersistence()

    const readEntitiesRef = useRef<{
        crateId: string | null
        readEntities: Map<string, IEntity>
    }>({
        crateId: persistence.getCrateId(),
        readEntities: new Map()
    })

    useEffect(() => {
        if (persistence.getCrateId() !== readEntitiesRef.current.crateId) {
            readEntitiesRef.current = {
                crateId: persistence.getCrateId(),
                readEntities: new Map()
            }
        }
    }, [persistence])

    const readEntities = readEntitiesRef.current.readEntities

    const handleToolCall: (
        passed: { addToolOutput: ChatAddToolOutputFunction<NC_UIMessage> },
        ...args: CallbackParameters
    ) => Promise<void> = useCallback(
        async ({ addToolOutput }, { toolCall }) => {
            if (toolCall.dynamic) return

            switch (toolCall.toolName) {
                case "editEntity": {
                    const initial = editorState
                        .getState()
                        .getEntities()
                        .get(toolCall.input.entityId)
                    if (!initial) {
                        addToolOutput({
                            tool: "editEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Could not edit the entity with id ${toolCall.input.entityId} because it does not exist.`
                        })
                        return
                    }
                    const read = readEntities.get(toolCall.input.entityId)
                    if (!read) {
                        addToolOutput({
                            tool: "editEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `You must read an entity before editing it. Use the readEntity tool first. This aims to prevent unintended data loss.`
                        })
                        return
                    }
                    if (!deepEqual(initial, read)) {
                        addToolOutput({
                            tool: "editEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `The entity has changed since you last read it. Read it again using the readEntity tool. This aims to prevent unintended data loss.`
                        })
                        return
                    }

                    if (toolCall.input.$set) {
                        if ("@id" in toolCall.input.$set) delete toolCall.input.$set["@id"] // Not allowed to be set. Must be changed using the rename tool to consistently rename references

                        editorState.getState().editEntity({
                            ...initial,
                            ...toolCall.input.$set
                        })
                    }

                    if (toolCall.input.$push) {
                        for (const [property, value] of Object.entries(toolCall.input.$push)) {
                            if (property === "@id") continue // not allowed to be pushed (can only have one value)

                            if (Array.isArray(value)) {
                                for (const v of value) {
                                    editorState
                                        .getState()
                                        .addPropertyEntry(toolCall.input.entityId, property, v)
                                }
                            } else {
                                editorState
                                    .getState()
                                    .addPropertyEntry(toolCall.input.entityId, property, value)
                            }
                        }
                    }

                    if (toolCall.input.$delete) {
                        for (const property of toolCall.input.$delete) {
                            if (property === "@id" || property === "@type") continue // not allowed to be removed
                            editorState.getState().removeProperty(toolCall.input.entityId, property)
                        }
                    }

                    const result = editorState.getState().getEntities().get(toolCall.input.entityId)

                    if (result) {
                        addToolOutput({
                            tool: "editEntity",
                            toolCallId: toolCall.toolCallId,
                            output: result
                        })
                        readEntities.set(result["@id"], result)
                    } else {
                        addToolOutput({
                            tool: "editEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText:
                                "The entity could not be found after the edit. Was it deleted in the meantime?"
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
                        readEntities.set(found["@id"], found)
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
                        readEntities.set(created["@id"], created)
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
                        ...Array.from(entities.values())
                            .map((entity) => {
                                return [
                                    validation
                                        .validateEntity(entity["@id"])
                                        .catch((e) =>
                                            console.error(
                                                `Entity validation failed on ${entity["@id"]}: `,
                                                e
                                            )
                                        ),
                                    ...Object.keys(entity).map((prop) => {
                                        return validation
                                            .validateProperty(entity["@id"], prop)
                                            .catch((e) =>
                                                console.error(
                                                    `Property validation failed on ${entity["@id"]} ${prop}: `,
                                                    e
                                                )
                                            )
                                    })
                                ]
                            })
                            .flat()
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
                        readEntities.delete(toolCall.input.entityId)
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
                        readEntities.delete(toolCall.input.newEntityId)
                        readEntities.delete(toolCall.input.currentEntityId)
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
                            readEntities.set(created["@id"], created)
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
                            readEntities.set(created["@id"], created)
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
        },
        [core, fileService, readEntities, validation]
    )

    return { handleToolCall }
}
