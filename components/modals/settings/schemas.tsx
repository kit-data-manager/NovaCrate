import { useStore } from "zustand/index"
import { RegisteredSchema, schemaResolverStore } from "@/lib/state/schema-resolver"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    ChevronDownIcon,
    CircleCheck,
    CircleDashed,
    CloudDownload,
    MinusIcon,
    OctagonAlert,
    PencilIcon,
    PlusIcon,
    RotateCw,
    SaveIcon,
    TrashIcon
} from "lucide-react"
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import { Error } from "@/components/error"
import { LoadedSchemaInfos } from "@/lib/schema-worker/SchemaGraph"
import { Badge } from "@/components/ui/badge"
import HelpTooltip from "@/components/help-tooltip"

export function SchemaSettingsPage() {
    const registeredSchemas = useStore(schemaResolverStore, (s) => s.registeredSchemas)
    const addSchema = useStore(schemaResolverStore, (s) => s.addSchema)

    const [newSchemaID, setNewSchemaID] = useState("")
    const [newSchemaDisplayName, setNewSchemaDisplayName] = useState("")

    const canCreateNewSchema = useMemo(() => {
        return newSchemaID.trim() !== "" && newSchemaDisplayName.trim() !== ""
    }, [newSchemaDisplayName, newSchemaID])

    const createNewSchema = useCallback(() => {
        addSchema({
            id: newSchemaID.trim(),
            displayName: newSchemaDisplayName.trim(),
            schemaUrl: "",
            matchesUrls: [""]
        })
        setNewSchemaID("")
        setNewSchemaDisplayName("")
    }, [addSchema, newSchemaDisplayName, newSchemaID])

    const newSchemaIDAlreadyTaken = useMemo(() => {
        return (
            registeredSchemas.find((s) => s.id === newSchemaID) !== undefined ||
            registeredSchemas.find((s) => s.id === newSchemaID.trim()) !== undefined
        )
    }, [newSchemaID, registeredSchemas])

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
                            <div className="text-sm">
                                Identifier{" "}
                                <HelpTooltip>
                                    Must be unique, but can be any value. Does not have to be
                                    related to the schema name or the representation in the crate
                                    context.
                                </HelpTooltip>
                            </div>
                            <Input
                                value={newSchemaID}
                                onChange={(event) => setNewSchemaID(event.target.value)}
                            />
                            {newSchemaIDAlreadyTaken && (
                                <div className="text-xs text-error mt-1">
                                    This Identifier is already in use
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="text-sm">
                                Display Name
                                <HelpTooltip>How the schema will appear in NovaCrate.</HelpTooltip>
                            </div>
                            <Input
                                value={newSchemaDisplayName}
                                onChange={(event) => setNewSchemaDisplayName(event.target.value)}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={createNewSchema}
                                disabled={!canCreateNewSchema || newSchemaIDAlreadyTaken}
                            >
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
    const registeredSchemas = useStore(schemaResolverStore, (s) => s.registeredSchemas)

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
            schemaUrl: downloadURL.trim(),
            matchesUrls: matchesPrefixes.map((s) => s.trim())
        })
    }, [downloadURL, matchesPrefixes, schema, updateSchema])

    const revertSelf = useCallback(() => {
        setDownloadURL(schema.schemaUrl)
        setMatchesPrefixes(schema.matchesUrls)
    }, [schema.matchesUrls, schema.schemaUrl])

    const changeName = useCallback(() => {
        updateSchema(schema.id, {
            ...schema,
            displayName: newName.trim(),
            id: newID.trim()
        })
    }, [newID, newName, schema, updateSchema])

    const newIDAlreadyTaken = useMemo(() => {
        return (
            (registeredSchemas.find((s) => s.id === newID) !== undefined ||
                registeredSchemas.find((s) => s.id === newID.trim()) !== undefined) &&
            newID !== schema.id
        )
    }, [newID, registeredSchemas, schema.id])

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
                            {newIDAlreadyTaken && (
                                <div className="text-xs text-error mt-1">
                                    This Identifier is already in use
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="text-sm">Display Name</div>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={changeName} disabled={newIDAlreadyTaken}>
                                Done
                            </Button>
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
                    <div className="text-sm">
                        Matches Prefixes{" "}
                        <HelpTooltip>
                            Any Entity or Property that is prefixed by one of the strings in this
                            list will trigger this schema to be downloaded. An empty input will
                            always load this schema.
                        </HelpTooltip>
                    </div>
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
                    <div className="text-sm">
                        Download URL{" "}
                        <HelpTooltip>
                            Should point to a valid JSON-LD file that contains the schema.
                        </HelpTooltip>
                    </div>
                    <Input value={downloadURL} onChange={(e) => setDownloadURL(e.target.value)} />
                </div>
            </div>

            {hasChanges ? (
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={revertSelf}>
                        Revert
                    </Button>
                    <Button onClick={saveSelf}>
                        <SaveIcon className="size-4 mr-2" /> Save
                    </Button>
                </div>
            ) : (
                <SchemaStatus schema={schema} />
            )}
        </div>
    )
}

function SchemaStatus({ schema }: { schema: RegisteredSchema }) {
    const schemaWorker = useContext(SchemaWorker)
    const [schemaLoading, setSchemaLoading] = useState(false)
    const [schemaStatus, setSchemaStatus] = useState<"loaded" | "not loaded" | "error">(
        "not loaded"
    )
    const [schemaInfos, setSchemaInfos] = useState<LoadedSchemaInfos | undefined>()
    const [schemaError, setSchemaError] = useState<unknown>()

    const getSchemaStatus = useCallback(async () => {
        const status = await schemaWorker.worker.execute("getWorkerStatus")
        if (status.schemaStatus.loadedSchemas.has(schema.id)) {
            setSchemaStatus("loaded")
            setSchemaError(undefined)
            setSchemaInfos(status.schemaStatus.loadedSchemas.get(schema.id))
        } else if (status.schemaStatus.schemaIssues.get(schema.id)) {
            setSchemaStatus("error")
            setSchemaError(status.schemaStatus.schemaIssues.get(schema.id))
            setSchemaInfos(undefined)
        } else {
            setSchemaStatus("not loaded")
            setSchemaError(undefined)
            setSchemaInfos(undefined)
        }
    }, [schema.id, schemaWorker.worker])

    const forceSchemaLoad = useCallback(async () => {
        setSchemaLoading(true)
        setSchemaError(undefined)
        await schemaWorker.worker.execute("forceSchemaLoad", schema.id)
        setSchemaLoading(false)
        getSchemaStatus().then()
    }, [getSchemaStatus, schema.id, schemaWorker.worker])

    const mappedStatus = useMemo(() => {
        switch (schemaStatus) {
            case "loaded":
                return (
                    <span className="text-success inline-flex items-center gap-2">
                        <CircleCheck className="size-4" /> Loaded{" "}
                        <span className="text-muted-foreground text-sm">
                            <Badge variant="secondary">Nodes: {schemaInfos?.nodes}</Badge>
                        </span>
                    </span>
                )
            case "error":
                return (
                    <span className="text-error inline-flex items-center gap-2">
                        <OctagonAlert className="size-4" /> Load failed
                    </span>
                )
            case "not loaded":
                return (
                    <span className="text-muted-foreground inline-flex items-center gap-2">
                        <CircleDashed className="size-4" /> Not loaded
                    </span>
                )
        }
    }, [schemaInfos?.nodes, schemaStatus])

    useEffect(() => {
        getSchemaStatus().then()
    }, [getSchemaStatus])

    return (
        <div className="">
            <div className="flex items-center gap-2">
                {mappedStatus}{" "}
                {schemaStatus !== "loaded" && (
                    <Button
                        className="ml-2"
                        title={"Reload"}
                        variant="ghost"
                        size="icon"
                        onClick={forceSchemaLoad}
                        disabled={schemaLoading}
                    >
                        {schemaStatus !== "not loaded" ? (
                            <RotateCw className="size-4" />
                        ) : (
                            <CloudDownload className="size-4" />
                        )}
                    </Button>
                )}
            </div>
            <Error error={schemaError} title={"Failed to load schema"} className="mt-2" />
        </div>
    )
}
