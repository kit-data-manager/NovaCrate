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
import { checkEntityConformance } from "@/lib/core/profiles/impl/util/entity-rule-conformance"
import {
    describeConformanceIssue,
    getRuleName
} from "@/lib/core/profiles/impl/util/describe-conformance-issue"
import { findReferencingPropertyRules } from "@/lib/core/profiles/impl/util/find-referencing-property-rules"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"

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
        // Check once if the id matches before attaching the listener. It is possible that the crate id has changed since the last time the listener was attached.
        if (persistence.getCrateId() !== readEntitiesRef.current.crateId) {
            readEntitiesRef.current = {
                crateId: persistence.getCrateId(),
                readEntities: new Map()
            }
        }

        return persistence.events.addEventListener("crate-id-changed", (newId) => {
            if (newId !== readEntitiesRef.current.crateId) {
                readEntitiesRef.current = {
                    crateId: newId,
                    readEntities: new Map()
                }
            }
        })
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
                    const initial = findEntity(
                        editorState.getState().getEntities(),
                        toolCall.input.entityId
                    )

                    if (!initial) {
                        addToolOutput({
                            tool: "editEntity",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Could not edit the entity with id ${toolCall.input.entityId} because it does not exist.`
                        })
                        return
                    }

                    const read = readEntities.get(initial["@id"])
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
                                        .addPropertyEntry(initial["@id"], property, v)
                                }
                            } else {
                                editorState
                                    .getState()
                                    .addPropertyEntry(initial["@id"], property, value)
                            }
                        }
                    }

                    if (toolCall.input.$delete) {
                        for (const property of toolCall.input.$delete) {
                            if (property === "@id" || property === "@type") continue // not allowed to be removed
                            editorState.getState().removeProperty(initial["@id"], property)
                        }
                    }

                    const result = editorState.getState().getEntities().get(initial["@id"])

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
                        try {
                            const filesList = await fileService.getContentList()
                            addToolOutput({
                                tool: "getFilesList",
                                toolCallId: toolCall.toolCallId,
                                output: filesList.map((f) => f.path)
                            })
                        } catch (e) {
                            addToolOutput({
                                tool: "getFilesList",
                                toolCallId: toolCall.toolCallId,
                                state: "output-error",
                                errorText: `The file service returned an error: ${e instanceof Error ? e.message : JSON.stringify(e)}`
                            })
                        }
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
                case "getActiveProfiles": {
                    const profileService = core.getProfileService()
                    const profiles = profileService
                        .getProfileHandlers()
                        .filter((handler) => handler.getIsReady() && handler.getDefinition())
                        .map((handler) => {
                            const definition = handler.getDefinition()!
                            return {
                                profileId: definition["@id"],
                                profileName: definition.name,
                                entityRules: definition.entityRules.map((rule) => ({
                                    ruleId: rule["@id"],
                                    name: getRuleName(rule),
                                    types: rule.specializationOf
                                })),
                                propertyRules: definition.propertyRules.map((propertyRule) => ({
                                    label: propertyRule.label,
                                    appliesToEntityRules: propertyRule.appliesToEntityRules,
                                    minCount: propertyRule.minCount,
                                    maxCount: propertyRule.maxCount
                                }))
                            }
                        })

                    addToolOutput({
                        tool: "getActiveProfiles",
                        toolCallId: toolCall.toolCallId,
                        output: profiles
                    })
                    return
                }
                case "getProfileMapping": {
                    const profileService = core.getProfileService()
                    const entityId = toolCall.input.entityId
                    const assignments = []

                    for (const handler of profileService.getProfileHandlers()) {
                        const definition = handler.getDefinition()
                        if (!definition) continue
                        const mapping = handler.getEntityMapping()
                        for (const [mappedEntityId, ruleId] of mapping) {
                            if (entityId && mappedEntityId !== entityId) continue
                            const rule = handler.getEntityRule(ruleId)
                            if (!rule) continue
                            assignments.push({
                                entityId: mappedEntityId,
                                profileId: definition["@id"],
                                profileName: definition.name,
                                ruleId,
                                ruleName: getRuleName(rule)
                            })
                        }
                    }

                    addToolOutput({
                        tool: "getProfileMapping",
                        toolCallId: toolCall.toolCallId,
                        output: assignments
                    })
                    return
                }
                case "checkEntityConformance": {
                    const profileService = core.getProfileService()
                    const entity = findEntity(
                        editorState.getState().getEntities(),
                        toolCall.input.entityId
                    )

                    if (!entity) {
                        addToolOutput({
                            tool: "checkEntityConformance",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: `Could not find an entity with id ${toolCall.input.entityId}`
                        })
                        return
                    }

                    const handlers = profileService.getProfileHandlers()

                    // When no rule is specified, fall back to the rule the entity is currently
                    // assigned to in the profile mapping.
                    let rule: EntityRule | undefined = undefined
                    let handler: IProfileHandler | undefined = undefined
                    if (toolCall.input.ruleId) {
                        for (const candidate of handlers) {
                            const found = candidate.getEntityRule(toolCall.input.ruleId)
                            if (found) {
                                rule = found
                                handler = candidate
                                break
                            }
                        }
                    } else {
                        for (const candidate of handlers) {
                            const ruleId = candidate.getEntityMapping().get(entity["@id"])
                            if (!ruleId) continue
                            const found = candidate.getEntityRule(ruleId)
                            if (found) {
                                rule = found
                                handler = candidate
                                break
                            }
                        }
                    }

                    if (!rule || !handler) {
                        addToolOutput({
                            tool: "checkEntityConformance",
                            toolCallId: toolCall.toolCallId,
                            state: "output-error",
                            errorText: toolCall.input.ruleId
                                ? `Could not find an entity rule with id ${toolCall.input.ruleId} in the active profiles. Use the getActiveProfiles tool to list the available rules.`
                                : `The entity ${entity["@id"]} is not assigned to any profile entity rule. Pass a ruleId to check the conformance against a specific rule.`
                        })
                        return
                    }

                    const definition = handler.getDefinition()
                    const issues = checkEntityConformance(entity, rule, handler, {
                        resolver: core.getContextService().getResolver(),
                        getEntity: (id) => findEntity(editorState.getState().getEntities(), id),
                        isEntityAssignedTo: (entityId, entityRuleId) =>
                            handler!.getEntityMapping().get(entityId) === entityRuleId
                    })

                    const output = {
                        entityId: entity["@id"],
                        ruleId: rule["@id"],
                        ruleName: getRuleName(rule),
                        profileId: definition?.["@id"] ?? handler.id,
                        profileName: definition?.name ?? handler.name,
                        conforms: issues.length === 0,
                        issues: issues.map(describeConformanceIssue),
                        referencingPropertyRules: findReferencingPropertyRules(
                            rule,
                            handlers
                        ).map((referencingRule) => ({
                            property: referencingRule.propertyRule.label,
                            onEntityRules: referencingRule.appliesToEntityRules.map((r) =>
                                getRuleName(r)
                            ),
                            minCount: referencingRule.propertyRule.minCount,
                            maxCount: referencingRule.propertyRule.maxCount,
                            profile:
                                referencingRule.handler.getDefinition()?.name ??
                                referencingRule.handler.name
                        }))
                    }

                    addToolOutput({
                        tool: "checkEntityConformance",
                        toolCallId: toolCall.toolCallId,
                        output
                    })
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
