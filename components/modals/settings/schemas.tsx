import { useStore } from "zustand/index"
import { KnownSchema, useSchemaResolverSettings } from "@/lib/state/schema-resolver-settings"
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
import { RO_CRATE_VERSION } from "@/lib/constants"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function SchemaSettingsPage() {
    const registeredSchemas = useStore(useSchemaResolverSettings, (s) => s.knownSchemas)
    const addSchema = useStore(useSchemaResolverSettings, (s) => s.addSchema)
    const preloadKnownSchemas = useStore(useSchemaResolverSettings, (s) => s.preloadKnownSchemas)
    const setPreloadKnownSchemas = useStore(
        useSchemaResolverSettings,
        (s) => s.setPreloadKnownSchemas
    )
    const allowUnknownSchemas = useStore(useSchemaResolverSettings, (s) => s.allowUnknownSchemas)
    const setAllowUnknownSchemas = useStore(
        useSchemaResolverSettings,
        (s) => s.setAllowUnknownSchemas
    )

    const [newSchemaID, setNewSchemaID] = useState("")
    const [newSchemaDisplayName, setNewSchemaDisplayName] = useState("")

    const canCreateNewSchema = useMemo(() => {
        return newSchemaID.trim() !== "" && newSchemaDisplayName.trim() !== ""
    }, [newSchemaDisplayName, newSchemaID])

    const createNewSchema = useCallback(() => {
        addSchema({
            id: newSchemaID.trim(),
            displayName: newSchemaDisplayName.trim(),
            url: "",
            overrideUrl: "",
            matchesUrls: [""],
            restrictTo: [
                RO_CRATE_VERSION.V1_3_0,
                RO_CRATE_VERSION.V1_2_0,
                RO_CRATE_VERSION.V1_1_3
            ]
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

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={preloadKnownSchemas}
                        onCheckedChange={(state) =>
                            setPreloadKnownSchemas(state === "indeterminate" ? true : state)
                        }
                        id="preload-known-schemas"
                    />
                    <Label className="mb-0 pb-0" htmlFor="preload-known-schemas">
                        Preload known schemas
                    </Label>
                    <HelpTooltip>
                        Known schemas are downloaded automatically when a crate is opened.
                    </HelpTooltip>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={allowUnknownSchemas}
                        onCheckedChange={(state) =>
                            setAllowUnknownSchemas(state === "indeterminate" ? true : state)
                        }
                        id="allow-unknown-schemas"
                    />
                    <Label className="mb-0 pb-0" htmlFor="allow-unknown-schemas">
                        Allow unknown schemas
                    </Label>
                    <HelpTooltip>
                        Terms that do not match any registered schema are fetched directly from
                        their host. The host has to be permitted by the deployment allowlist
                        (SCHEMA_FETCH_ALLOWED_URLS).
                    </HelpTooltip>
                </div>
            </div>

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

function RegisteredSchemaDisplay({ schema }: { schema: KnownSchema }) {
    const deleteSchema = useStore(useSchemaResolverSettings, (s) => s.deleteSchema)
    const updateSchema = useStore(useSchemaResolverSettings, (s) => s.updateSchema)
    const registeredSchemas = useStore(useSchemaResolverSettings, (s) => s.knownSchemas)

    const [matchesPrefixes, setMatchesPrefixes] = useState(schema.matchesUrls)
    const [downloadURL, setDownloadURL] = useState(schema.overrideUrl)
    const [activeOnROCrateV1_3_0, setActiveOnROCrateV1_3_0] = useState(
        schema.restrictTo.includes(RO_CRATE_VERSION.V1_3_0)
    )
    const [activeOnROCrateV1_2_0, setActiveOnROCrateV1_2_0] = useState(
        schema.restrictTo.includes(RO_CRATE_VERSION.V1_2_0)
    )
    const [activeOnROCrateV1_1_3, setActiveOnROCrateV1_1_3] = useState(
        schema.restrictTo.includes(RO_CRATE_VERSION.V1_1_3)
    )

    const [newID, setNewID] = useState(schema.id)
    const [newName, setNewName] = useState(schema.displayName)

    const schemaWorker = useContext(SchemaWorker)
    const [schemaLoading, setSchemaLoading] = useState(false)
    const [schemaStatus, setSchemaStatus] = useState<"loaded" | "not loaded" | "error">(
        "not loaded"
    )
    const [schemaInfos, setSchemaInfos] = useState<LoadedSchemaInfos | undefined>()
    const [schemaError, setSchemaError] = useState<unknown>()

    const getSchemaStatus = useCallback(async () => {
        const status = await schemaWorker.worker.executeUncached("getWorkerStatus")
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
        await schemaWorker.worker.executeUncached("unloadSchema", schema.id)
        await schemaWorker.worker.executeUncached("forceSchemaLoad", schema.id)
        setSchemaLoading(false)
        getSchemaStatus().then()
    }, [getSchemaStatus, schema.id, schemaWorker.worker])

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

    const changedRestrictTo = useMemo(() => {
        const restrictTo: RO_CRATE_VERSION[] = []
        if (activeOnROCrateV1_3_0) restrictTo.push(RO_CRATE_VERSION.V1_3_0)
        if (activeOnROCrateV1_2_0) restrictTo.push(RO_CRATE_VERSION.V1_2_0)
        if (activeOnROCrateV1_1_3) restrictTo.push(RO_CRATE_VERSION.V1_1_3)
        return restrictTo
    }, [activeOnROCrateV1_1_3, activeOnROCrateV1_2_0, activeOnROCrateV1_3_0])

    const saveSelf = useCallback(() => {
        updateSchema(schema.id, {
            ...schema,
            overrideUrl: downloadURL.trim(),
            matchesUrls: matchesPrefixes.map((s) => s.trim()),
            restrictTo: changedRestrictTo
        })
        forceSchemaLoad().then()
    }, [changedRestrictTo, downloadURL, forceSchemaLoad, matchesPrefixes, schema, updateSchema])

    const revertSelf = useCallback(() => {
        setDownloadURL(schema.overrideUrl)
        setMatchesPrefixes(schema.matchesUrls)
        setActiveOnROCrateV1_1_3(schema.restrictTo.includes(RO_CRATE_VERSION.V1_1_3))
        setActiveOnROCrateV1_2_0(schema.restrictTo.includes(RO_CRATE_VERSION.V1_2_0))
        setActiveOnROCrateV1_3_0(schema.restrictTo.includes(RO_CRATE_VERSION.V1_3_0))
    }, [schema.matchesUrls, schema.overrideUrl, schema.restrictTo])

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
            downloadURL !== schema.overrideUrl ||
            matchesPrefixes.join(",") !== schema.matchesUrls.join(",") ||
            changedRestrictTo.slice().sort().join(",") !==
                schema.restrictTo.slice().sort().join(",")
        )
    }, [
        changedRestrictTo,
        downloadURL,
        matchesPrefixes,
        schema.matchesUrls,
        schema.overrideUrl,
        schema.restrictTo
    ])

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
                            Endpoint that responds with a JSON-LD file or Turtle file, containing
                            the schema. Requests will always be sent with &#34;Accept:
                            application/ld+json&#34;. Leave empty to use the default download URL.
                        </HelpTooltip>
                    </div>
                    <Input
                        value={downloadURL}
                        placeholder={schema.url || "No download URL set"}
                        onChange={(e) => setDownloadURL(e.target.value)}
                    />
                    {downloadURL.trim() === "" && schema.url && (
                        <div className="text-xs text-muted-foreground">
                            Default: <span className="font-mono">{schema.url}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={"space-y-1 mb-6"}>
                <div className="text-sm">
                    Specifications{" "}
                    <HelpTooltip>
                        Determines on which RO-Crate specification version this schema will be
                        active.
                    </HelpTooltip>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={activeOnROCrateV1_3_0}
                            onCheckedChange={(s) =>
                                setActiveOnROCrateV1_3_0(s === "indeterminate" ? true : s)
                            }
                            id={`ro-crate-v1.3.0-${schema.id}`}
                        />
                        <Label className="mb-0 pb-0" htmlFor={`ro-crate-v1.3.0-${schema.id}`}>
                            RO-Crate v1.3.0
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={activeOnROCrateV1_2_0}
                            onCheckedChange={(s) =>
                                setActiveOnROCrateV1_2_0(s === "indeterminate" ? true : s)
                            }
                            id={`ro-crate-v1.2.0-${schema.id}`}
                        />
                        <Label className="mb-0 pb-0" htmlFor={`ro-crate-v1.2.0-${schema.id}`}>
                            RO-Crate v1.2.0
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={activeOnROCrateV1_1_3}
                            onCheckedChange={(s) =>
                                setActiveOnROCrateV1_1_3(s === "indeterminate" ? true : s)
                            }
                            id={`ro-crate-v1.1.3-${schema.id}`}
                        />
                        <Label className="mb-0 pb-0" htmlFor={`ro-crate-v1.1.3-${schema.id}`}>
                            RO-Crate v1.1.3
                        </Label>
                    </div>
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
                <SchemaStatus
                    schemaStatus={schemaStatus}
                    schemaInfos={schemaInfos}
                    getSchemaStatus={getSchemaStatus}
                    forceSchemaLoad={forceSchemaLoad}
                    schemaLoading={schemaLoading}
                    schemaError={schemaError}
                />
            )}
        </div>
    )
}

function SchemaStatus({
    schemaStatus,
    schemaInfos,
    getSchemaStatus,
    forceSchemaLoad,
    schemaLoading,
    schemaError
}: {
    schemaStatus: "loaded" | "not loaded" | "error"
    schemaInfos: LoadedSchemaInfos | undefined
    getSchemaStatus: () => Promise<void>
    forceSchemaLoad: () => Promise<void>
    schemaLoading: boolean
    schemaError?: unknown
}) {
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
