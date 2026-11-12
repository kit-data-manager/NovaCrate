import { useStore } from "zustand/index"
import { RegisteredSchema, schemaResolverStore } from "@/lib/state/schema-resolver"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    ChevronRightIcon,
    CircleCheck,
    CircleDashed,
    CloudDownload,
    LayoutGridIcon,
    ListIcon,
    MinusIcon,
    OctagonAlert,
    PencilIcon,
    PlusIcon,
    RotateCw,
    SaveIcon,
    SearchIcon,
    TrashIcon,
    XIcon
} from "lucide-react"
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import { Error } from "@/components/error"
import { LoadedSchemaInfos } from "@/lib/schema-worker/SchemaGraph"
import { Badge } from "@/components/ui/badge"
import HelpTooltip from "@/components/help-tooltip"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

type SpecFilter = RO_CRATE_VERSION | "all"
type SchemaView = "cards" | "list"
type SchemaDownloadStatus = "loaded" | "not loaded" | "error"

export function SchemaSettingsPage() {
    const registeredSchemas = useStore(schemaResolverStore, (s) => s.registeredSchemas)
    const addSchema = useStore(schemaResolverStore, (s) => s.addSchema)
    const schemaWorker = useContext(SchemaWorker)

    const [schemaStatuses, setSchemaStatuses] = useState<Record<string, SchemaDownloadStatus>>({})
    const [newSchemaDisplayName, setNewSchemaDisplayName] = useState("")
    const [addPopoverOpen, setAddPopoverOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [specFilter, setSpecFilter] = useState<SpecFilter>("all")
    const [view, setView] = useState<SchemaView>("cards")
    const [expandedSchemaID, setExpandedSchemaID] = useState<string | null>(null)

    const listRef = useRef<HTMLDivElement>(null)
    const pendingScrollSchemaID = useRef<string | null>(null)

    const filteredSchemas = useMemo(() => {
        const query = search.trim().toLowerCase()
        return registeredSchemas.filter((schema) => {
            if (specFilter !== "all" && !schema.activeOnSpec.includes(specFilter)) return false
            if (!query) return true
            return (
                schema.displayName.toLowerCase().includes(query) ||
                schema.schemaUrl.toLowerCase().includes(query) ||
                schema.matchesUrls.some((url) => url.toLowerCase().includes(query))
            )
        })
    }, [registeredSchemas, search, specFilter])

    const isFiltering = search.trim() !== "" || specFilter !== "all"

    const clearFilters = useCallback(() => {
        setSearch("")
        setSpecFilter("all")
    }, [])

    const refreshSchemaStatuses = useCallback(async () => {
        const status = await schemaWorker.worker.executeUncached("getWorkerStatus")
        const next: Record<string, SchemaDownloadStatus> = {}
        for (const schema of registeredSchemas) {
            next[schema.id] = status.schemaStatus.loadedSchemas.has(schema.id)
                ? "loaded"
                : status.schemaStatus.schemaIssues.has(schema.id)
                  ? "error"
                  : "not loaded"
        }
        setSchemaStatuses(next)
    }, [registeredSchemas, schemaWorker.worker])

    useEffect(() => {
        if (view === "list") refreshSchemaStatuses().then()
    }, [refreshSchemaStatuses, view])

    useEffect(() => {
        const id = pendingScrollSchemaID.current
        if (!id || !listRef.current || !filteredSchemas.some((schema) => schema.id === id)) {
            return
        }
        const entry = Array.from(
            listRef.current.querySelectorAll<HTMLElement>("[data-schema-id]")
        ).find((element) => element.dataset.schemaId === id)
        if (!entry) return
        entry.scrollIntoView({ behavior: "smooth", block: "start" })
        pendingScrollSchemaID.current = null
    }, [filteredSchemas])

    useEffect(() => {
        if (
            expandedSchemaID &&
            !registeredSchemas.some((schema) => schema.id === expandedSchemaID)
        ) {
            setExpandedSchemaID(null)
        }
    }, [expandedSchemaID, registeredSchemas])

    const canCreateNewSchema = useMemo(() => {
        return newSchemaDisplayName.trim() !== ""
    }, [newSchemaDisplayName])

    const createNewSchema = useCallback(() => {
        const id = crypto.randomUUID()
        addSchema({
            id,
            displayName: newSchemaDisplayName.trim(),
            schemaUrl: "",
            matchesUrls: [""],
            activeOnSpec: [
                RO_CRATE_VERSION.V1_3_0,
                RO_CRATE_VERSION.V1_2_0,
                RO_CRATE_VERSION.V1_1_3
            ]
        })
        pendingScrollSchemaID.current = id
        setNewSchemaDisplayName("")
        setAddPopoverOpen(false)
        setSearch("")
        setSpecFilter("all")
        if (view === "list") setExpandedSchemaID(id)
    }, [addSchema, newSchemaDisplayName, view])

    return (
        <div className={"flex flex-col max-h-full"}>
            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">Schemas</h3>

            <div className="flex items-center gap-2 mb-2">
                <div className="relative min-w-0 flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                        className="pl-8 pr-8"
                        placeholder="Search by name or URL..."
                        aria-label="Search schemas"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search !== "" && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                        >
                            <XIcon className="size-3.5" />
                        </Button>
                    )}
                </div>
                <Select
                    value={specFilter}
                    onValueChange={(value) => setSpecFilter(value as SpecFilter)}
                >
                    <SelectTrigger
                        className="w-[180px]"
                        aria-label="Filter by RO-Crate specification"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All specifications</SelectItem>
                        <SelectItem value={RO_CRATE_VERSION.V1_3_0}>RO-Crate v1.3.0</SelectItem>
                        <SelectItem value={RO_CRATE_VERSION.V1_2_0}>RO-Crate v1.2.0</SelectItem>
                        <SelectItem value={RO_CRATE_VERSION.V1_1_3}>RO-Crate v1.1.3</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex shrink-0 items-center rounded-md border p-0.5">
                    <Button
                        type="button"
                        variant={view === "cards" ? "secondary" : "ghost"}
                        size="icon"
                        className="size-8"
                        onClick={() => setView("cards")}
                        aria-label="Card view"
                        aria-pressed={view === "cards"}
                    >
                        <LayoutGridIcon className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={view === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="size-8"
                        onClick={() => setView("list")}
                        aria-label="List view"
                        aria-pressed={view === "list"}
                    >
                        <ListIcon className="size-4" />
                    </Button>
                </div>
                <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button className="shrink-0">
                            <PlusIcon className="size-4" /> Add
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <form
                            className="space-y-2"
                            onSubmit={(event) => {
                                event.preventDefault()
                                if (canCreateNewSchema) createNewSchema()
                            }}
                        >
                            <div className="font-bold">New Schema</div>

                            <div>
                                <div className="text-sm">
                                    Display Name
                                    <HelpTooltip>
                                        How the schema will appear in NovaCrate.
                                    </HelpTooltip>
                                </div>
                                <Input
                                    value={newSchemaDisplayName}
                                    onChange={(event) =>
                                        setNewSchemaDisplayName(event.target.value)
                                    }
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={!canCreateNewSchema}>
                                    Add
                                </Button>
                            </div>
                        </form>
                    </PopoverContent>
                </Popover>
            </div>

            <div ref={listRef} className="overflow-auto min-h-0 shrink my-2">
                {isFiltering && (
                    <div className="text-xs text-muted-foreground pb-2">
                        Showing {filteredSchemas.length} of {registeredSchemas.length} schemas
                    </div>
                )}
                {filteredSchemas.length === 0 ? (
                    <div className="flex flex-col items-center gap-1 p-6 text-center border rounded mb-4">
                        <div className="text-sm text-muted-foreground">
                            {isFiltering
                                ? "No schemas match the current search and filter."
                                : "No schemas registered yet."}
                        </div>
                        {isFiltering && (
                            <Button variant="link" size="sm" onClick={clearFilters}>
                                Clear search and filters
                            </Button>
                        )}
                    </div>
                ) : view === "cards" ? (
                    filteredSchemas.map((schema) => (
                        <div key={schema.id} data-schema-id={schema.id}>
                            <RegisteredSchemaDisplay schema={schema} />
                        </div>
                    ))
                ) : (
                    <div className="divide-y overflow-hidden rounded-md border">
                        {filteredSchemas.map((schema) => (
                            <RegisteredSchemaListEntry
                                key={schema.id}
                                schema={schema}
                                status={schemaStatuses[schema.id] ?? "not loaded"}
                                expanded={expandedSchemaID === schema.id}
                                onStatusChange={refreshSchemaStatuses}
                                onToggle={() =>
                                    setExpandedSchemaID((current) =>
                                        current === schema.id ? null : schema.id
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function RegisteredSchemaDisplay({
    schema,
    onStatusChange
}: {
    schema: RegisteredSchema
    onStatusChange?: () => void
}) {
    const deleteSchema = useStore(schemaResolverStore, (s) => s.deleteSchema)
    const updateSchema = useStore(schemaResolverStore, (s) => s.updateSchema)

    const [matchesPrefixes, setMatchesPrefixes] = useState(schema.matchesUrls)
    const [downloadURL, setDownloadURL] = useState(schema.schemaUrl)
    const [activeOnROCrateV1_3_0, setActiveOnROCrateV1_3_0] = useState(
        schema.activeOnSpec.includes(RO_CRATE_VERSION.V1_3_0)
    )
    const [activeOnROCrateV1_2_0, setActiveOnROCrateV1_2_0] = useState(
        schema.activeOnSpec.includes(RO_CRATE_VERSION.V1_2_0)
    )
    const [activeOnROCrateV1_1_3, setActiveOnROCrateV1_1_3] = useState(
        schema.activeOnSpec.includes(RO_CRATE_VERSION.V1_1_3)
    )

    const [newName, setNewName] = useState(schema.displayName)

    const schemaWorker = useContext(SchemaWorker)
    const [schemaLoading, setSchemaLoading] = useState(false)
    const [schemaStatus, setSchemaStatus] = useState<SchemaDownloadStatus>("not loaded")
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
        onStatusChange?.()
    }, [onStatusChange, schema.id, schemaWorker.worker])

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

    const changedActiveOn = useMemo(() => {
        const activeOn: RO_CRATE_VERSION[] = []
        if (activeOnROCrateV1_3_0) activeOn.push(RO_CRATE_VERSION.V1_3_0)
        if (activeOnROCrateV1_2_0) activeOn.push(RO_CRATE_VERSION.V1_2_0)
        if (activeOnROCrateV1_1_3) activeOn.push(RO_CRATE_VERSION.V1_1_3)
        return activeOn
    }, [activeOnROCrateV1_1_3, activeOnROCrateV1_2_0, activeOnROCrateV1_3_0])

    const saveSelf = useCallback(() => {
        updateSchema(schema.id, {
            ...schema,
            schemaUrl: downloadURL.trim(),
            matchesUrls: matchesPrefixes.map((s) => s.trim()),
            activeOnSpec: changedActiveOn
        })
        forceSchemaLoad().then()
    }, [changedActiveOn, downloadURL, forceSchemaLoad, matchesPrefixes, schema, updateSchema])

    const revertSelf = useCallback(() => {
        setDownloadURL(schema.schemaUrl)
        setMatchesPrefixes(schema.matchesUrls)
        setActiveOnROCrateV1_1_3(schema.activeOnSpec.includes(RO_CRATE_VERSION.V1_1_3))
        setActiveOnROCrateV1_2_0(schema.activeOnSpec.includes(RO_CRATE_VERSION.V1_2_0))
        setActiveOnROCrateV1_3_0(schema.activeOnSpec.includes(RO_CRATE_VERSION.V1_3_0))
    }, [schema.activeOnSpec, schema.matchesUrls, schema.schemaUrl])

    const changeName = useCallback(() => {
        updateSchema(schema.id, {
            ...schema,
            displayName: newName.trim()
        })
    }, [newName, schema, updateSchema])

    const hasChanges = useMemo(() => {
        return (
            downloadURL !== schema.schemaUrl ||
            matchesPrefixes.join(",") !== schema.matchesUrls.join(",") ||
            changedActiveOn.slice().sort().join(",") !==
                schema.activeOnSpec.slice().sort().join(",")
        )
    }, [
        changedActiveOn,
        downloadURL,
        matchesPrefixes,
        schema.activeOnSpec,
        schema.matchesUrls,
        schema.schemaUrl
    ])

    return (
        <div className="p-4 border rounded mb-4">
            <div className={"mb-2 flex items-center"}>
                <span className="font-bold">{schema.displayName}</span>{" "}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <PencilIcon className="size-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="space-y-2">
                        <div className="font-bold">Change Name</div>

                        <div>
                            <div className="text-sm">Display Name</div>
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
                            application/ld+json&#34;
                        </HelpTooltip>
                    </div>
                    <Input value={downloadURL} onChange={(e) => setDownloadURL(e.target.value)} />
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

function SchemaDownloadStatusIndicator({ status }: { status: SchemaDownloadStatus }) {
    switch (status) {
        case "loaded":
            return (
                <span className="inline-flex items-center gap-1 text-xs text-success">
                    <CircleCheck className="size-3.5" /> Loaded
                </span>
            )
        case "error":
            return (
                <span className="inline-flex items-center gap-1 text-xs text-error">
                    <OctagonAlert className="size-3.5" /> Load failed
                </span>
            )
        case "not loaded":
            return (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CircleDashed className="size-3.5" /> Not loaded
                </span>
            )
    }
}

function RegisteredSchemaListEntry({
    schema,
    status,
    expanded,
    onToggle,
    onStatusChange
}: {
    schema: RegisteredSchema
    status: SchemaDownloadStatus
    expanded: boolean
    onToggle: () => void
    onStatusChange: () => void
}) {
    return (
        <div data-schema-id={schema.id}>
            <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-controls={expanded ? `schema-details-${schema.id}` : undefined}
            >
                <ChevronRightIcon
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
                />
                <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{schema.displayName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                        {schema.schemaUrl || "No download URL"}
                    </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                    {schema.activeOnSpec.join(" · ")}
                </span>
                <span className="flex w-[92px] shrink-0 justify-end">
                    <SchemaDownloadStatusIndicator status={status} />
                </span>
            </button>
            {expanded && (
                <div id={`schema-details-${schema.id}`} className="border-t p-2">
                    <RegisteredSchemaDisplay schema={schema} onStatusChange={onStatusChange} />
                </div>
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
    schemaStatus: SchemaDownloadStatus
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
