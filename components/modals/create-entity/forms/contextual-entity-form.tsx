import { ChangeEvent, useCallback, useState } from "react"
import { useAutoId } from "@/lib/hooks/hooks"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { CreateEntityHint } from "@/components/modals/create-entity/create-entity-hint"
import { hasAtLeastOneValue, pickFirst } from "@/lib/utils"
import {
    ActionBar,
    CreateEntityHeader,
    IdentifierField,
    NameField
} from "@/components/modals/create-entity/form-fields"

/**
 * Form for creating a contextual entity (i.e. an entity that is neither a file
 * nor a folder data entity). Only a name and an optional identifier are needed.
 */
export function ContextualEntityForm({
    selectedType,
    onBackClick,
    onCreateClick,
    forceId,
    entityRule,
    defaultName
}: {
    selectedType: string | string[]
    onBackClick: () => void
    onCreateClick: (id: string, name: string) => void
    forceId?: string
    entityRule?: EntityRule
    defaultName?: string
}) {
    const [name, setName] = useState(defaultName ?? "")
    const [identifier, setIdentifier] = useState("")
    const autoId = useAutoId(name)

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }, [])

    const onIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value)
    }, [])

    const submit = useCallback(() => {
        onCreateClick(forceId || identifier || autoId, name)
    }, [autoId, forceId, identifier, name, onCreateClick])

    const onNameInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") submit()
        },
        [submit]
    )

    const createDisabled = autoId.length <= 0

    return (
        <div className="flex flex-col gap-4 min-w-0">
            <CreateEntityHeader
                selectedType={selectedType}
                entityRule={entityRule}
                variant="contextual"
                forceId={forceId}
            />

            {hasAtLeastOneValue(selectedType) && (
                <CreateEntityHint selectedType={pickFirst(selectedType)} />
            )}

            <NameField value={name} onChange={onNameChange} onKeyDown={onNameInputKeyDown} />

            {!forceId ? (
                <IdentifierField
                    value={identifier}
                    onChange={onIdentifierChange}
                    externalResource={false}
                    autoId={autoId}
                />
            ) : null}

            <ActionBar onBack={onBackClick} onCreate={submit} createDisabled={createDisabled} />
        </div>
    )
}
