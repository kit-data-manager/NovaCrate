import { useStore } from "zustand/index"
import { RegisteredSchema, schemaResolverStore } from "@/lib/state/schema-resolver"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon, MinusIcon, PencilIcon, PlusIcon, SaveIcon, TrashIcon } from "lucide-react"
import { ChangeEvent, useCallback, useMemo, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function SchemaSettingsPage() {
    const registeredSchemas = useStore(schemaResolverStore, (s) => s.registeredSchemas)
    const addSchema = useStore(schemaResolverStore, (s) => s.addSchema)

    const [newSchemaID, setNewSchemaID] = useState("")
    const [newSchemaDisplayName, setNewSchemaDisplayName] = useState("")

    const canCreateNewSchema = useMemo(() => {
        return newSchemaID != "" && newSchemaDisplayName != ""
    }, [newSchemaDisplayName, newSchemaID])

    const createNewSchema = useCallback(() => {
        addSchema({
            id: newSchemaID,
            displayName: newSchemaDisplayName,
            schemaUrl: "",
            matchesUrls: [""]
        })
        setNewSchemaID("")
        setNewSchemaDisplayName("")
    }, [addSchema, newSchemaDisplayName, newSchemaID])

    return (
        <div className={"flex flex-col max-h-full"}>
            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">Schemas</h3>

            <div className="overflow-auto min-h-0 shrink my-2">
                {registeredSchemas.map((name) => (
                    <RegisteredSchemaDisplay key={name.id} schema={name} />
                ))}
            </div>

            <div className="flex justify-end">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            Register new Schema{" "}
                            <ChevronDownIcon className="text-muted-foreground size-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="space-y-2">
                        <div className="font-bold">New Schema</div>

                        <div>
                            <div className="text-sm">Identifier</div>
                            <Input
                                value={newSchemaID}
                                onChange={(event) => setNewSchemaID(event.target.value)}
                            />
                        </div>

                        <div>
                            <div className="text-sm">Display Name</div>
                            <Input
                                value={newSchemaDisplayName}
                                onChange={(event) => setNewSchemaDisplayName(event.target.value)}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={createNewSchema} disabled={!canCreateNewSchema}>
                                Done
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

function RegisteredSchemaDisplay({ schema }: { schema: RegisteredSchema }) {
    const deleteSchema = useStore(schemaResolverStore, (s) => s.deleteSchema)
    const updateSchema = useStore(schemaResolverStore, (s) => s.updateSchema)

    const [matchesPrefixes, setMatchesPrefixes] = useState(schema.matchesUrls)
    const [downloadURL, setDownloadURL] = useState(schema.schemaUrl)

    const [newID, setNewID] = useState(schema.id)
    const [newName, setNewName] = useState(schema.displayName)

    const onMatchesPrefixesChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>, i: number) => {
            const copy = [...matchesPrefixes]
            copy[i] = e.target.value
            setMatchesPrefixes(copy)
        },
        [matchesPrefixes]
    )

    const addMatchesPrefix = useCallback(() => {
        setMatchesPrefixes([...matchesPrefixes, ""])
    }, [matchesPrefixes])

    const removeMatchesPrefix = useCallback(() => {
        setMatchesPrefixes(matchesPrefixes.slice(0, matchesPrefixes.length - 1))
    }, [matchesPrefixes])

    const canRemoveMatchesPrefix = useMemo(() => {
        return matchesPrefixes.length > 0
    }, [matchesPrefixes.length])

    const deleteSelf = useCallback(() => {
        deleteSchema(schema.id)
    }, [deleteSchema, schema.id])

    const saveSelf = useCallback(() => {
        updateSchema(schema.id, {
            ...schema,
            schemaUrl: downloadURL,
            matchesUrls: matchesPrefixes
        })
    }, [downloadURL, matchesPrefixes, schema, updateSchema])

    const changeName = useCallback(() => {
        updateSchema(schema.id, {
            ...schema,
            displayName: newName,
            id: newID
        })
    }, [newID, newName, schema, updateSchema])

    const hasChanges = useMemo(() => {
        return (
            downloadURL !== schema.schemaUrl ||
            matchesPrefixes.join(",") !== schema.matchesUrls.join(",")
        )
    }, [downloadURL, matchesPrefixes, schema.matchesUrls, schema.schemaUrl])

    return (
        <div className="p-4 border rounded mb-4">
            <div className={"mb-2 flex items-center"}>
                <span className="font-bold">{schema.displayName}</span>{" "}
                <span className="text-sm ml-2 mr-2 bg-muted p-1 rounded font-mono">
                    {schema.id}
                </span>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <PencilIcon className="size-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="space-y-2">
                        <div className="font-bold">Change Name</div>

                        <div>
                            <div className="text-sm">Identifier</div>
                            <Input value={newID} onChange={(e) => setNewID(e.target.value)} />
                        </div>

                        <div>
                            <div className="text-sm">Name</div>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={changeName}>Done</Button>
                        </div>
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-1 hover:text-destructive">
                            <TrashIcon className="size-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <div className="text-sm mb-4">
                            Are you sure you want to delete this entry? This can&#39;t be undone.
                        </div>
                        <div className="flex justify-center">
                            <Button onClick={deleteSelf} variant="destructive">
                                Delete Schema
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className={"grid grid-cols-2 gap-4"}>
                <div className="space-y-1">
                    <div className="text-sm">Matches Prefixes</div>
                    {matchesPrefixes.map((url, i) => (
                        <Input
                            value={url}
                            key={i}
                            onChange={(e) => onMatchesPrefixesChange(e, i)}
                        />
                    ))}
                    <div className="flex justify-end mt-1">
                        <Button variant="ghost" size="sm" onClick={addMatchesPrefix}>
                            <PlusIcon className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeMatchesPrefix}
                            disabled={!canRemoveMatchesPrefix}
                        >
                            <MinusIcon className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="text-sm">Download URL</div>
                    <Input value={downloadURL} onChange={(e) => setDownloadURL(e.target.value)} />
                </div>
            </div>

            {hasChanges && (
                <div className="flex justify-end">
                    <Button onClick={saveSelf}>
                        <SaveIcon className="size-4 mr-2" /> Save
                    </Button>
                </div>
            )}
        </div>
    )
}
