import React, { ChangeEvent, useCallback, useMemo, useState } from "react"
import { useAutoId } from "@/components/use-auto-id"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"

export function CreateEntity({
    onBackClick,
    onCreateClick,
    defaultName,
    creatingContextual,
    forceId
}: {
    onBackClick: () => void
    onCreateClick: (id: string, name: string) => void
    defaultName?: string
    forceId?: string
    creatingContextual: boolean
}) {
    const [name, setName] = useState(defaultName || "")
    const [identifier, setIdentifier] = useState<null | string>(null)

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }, [])

    const onIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value)
    }, [])

    const _autoId = useAutoId(identifier || name, creatingContextual)

    const autoId = useMemo(() => {
        return forceId || identifier || _autoId
    }, [_autoId, identifier])

    const localOnCreateClick = useCallback(() => {
        onCreateClick(autoId, name)
    }, [autoId, name, onCreateClick])

    const onNameInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                localOnCreateClick()
            }
        },
        [localOnCreateClick]
    )

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Label>Identifier</Label>
                <Input
                    placeholder={"#localname"}
                    value={autoId}
                    onChange={onIdentifierChange}
                    disabled={!!forceId}
                />
            </div>

            <div>
                <Label>Name</Label>
                <Input
                    value={name}
                    placeholder={"Entity Name"}
                    onChange={onNameChange}
                    autoFocus
                    onKeyDown={onNameInputKeyDown}
                />
            </div>

            <div className="mt-2 flex justify-between">
                <Button variant="secondary" onClick={() => onBackClick()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => localOnCreateClick()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                </Button>
            </div>
        </div>
    )
}
