import HelpTooltip from "@/components/help-tooltip"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trash } from "lucide-react"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { useEditorState } from "@/lib/state/editor-state"
import { ChangeEvent, useCallback, useContext, useMemo, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Error } from "@/components/error"

export function CustomPairs() {
    const context = useEditorState.useCrateContext()
    const [addPairModalOpen, setAddPairModalOpen] = useState(false)
    const { crateDataIsLoading } = useContext(CrateDataContext)

    const [addPairKey, setAddPairKey] = useState("")
    const [addPairValue, setAddPairValue] = useState("")
    const [adding, setAdding] = useState(false)
    const [addPairError, setAddPairError] = useState<unknown>()
    const [removing, setRemoving] = useState(false)
    const [removePairError, setRemovePairError] = useState<unknown>()

    const onAddPairKeyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setAddPairKey(e.target.value)
    }, [])

    const onAddPairValueChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setAddPairValue(e.target.value)
    }, [])

    const { addCustomContextPair, removeCustomContextPair } = useContext(CrateDataContext)

    const addPair = useCallback(() => {
        setAdding(true)
        addCustomContextPair(addPairKey, addPairValue)
            .then(() => {
                setAddPairError(undefined)
                setAddPairKey("")
                setAddPairValue("")
                setAddPairModalOpen(false)
            })
            .catch((e) => {
                setAddPairError(e)
            })
            .finally(() => {
                setAdding(false)
            })
    }, [addCustomContextPair, addPairKey, addPairValue])

    const removePair = useCallback(
        (key: string) => {
            setRemoving(true)
            removeCustomContextPair(key)
                .then(() => {
                    setRemovePairError(undefined)
                })
                .catch((e) => {
                    setRemovePairError(e)
                })
                .finally(() => {
                    setRemoving(false)
                })
        },
        [removeCustomContextPair]
    )

    const customPairs = useMemo(() => {
        return Object.entries(context.customPairs).map(([key, value]) => ({ key, value }))
    }, [context.customPairs])

    return (
        <div className="my-4">
            <Dialog open={addPairModalOpen} onOpenChange={setAddPairModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Pair</DialogTitle>
                        <DialogDescription>
                            Custom context pairs define extensions to your base specification. The
                            key is the name of the new Type or Property and the value references the
                            Resource (e.g. https://schema.org/Person).
                        </DialogDescription>
                    </DialogHeader>

                    <Error error={addPairError} title="Failed to add pair" />

                    <div>
                        <Label>Key</Label>
                        <Input
                            value={addPairKey}
                            onChange={onAddPairKeyChange}
                            placeholder="CustomTypeName"
                        />
                    </div>

                    <div>
                        <Label>Value</Label>
                        <Input
                            value={addPairValue}
                            onChange={onAddPairValueChange}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="flex justify-between">
                        <Button variant="secondary" onClick={() => setAddPairModalOpen(false)}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Abort
                        </Button>
                        <Button onClick={addPair} disabled={adding}>
                            <Plus className="w-4 h-4 mr-2" /> Confirm
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex items-center py-2 gap-2">
                <div className="font-bold">Custom Context Pairs</div>
                <HelpTooltip>
                    Custom Context Pairs directly translate to entries in the{" "}
                    <span className="font-mono">@context</span> section of the
                    ro-crate-metadata.json file. These allow you to define your own local types and
                    properties. More Information on Context can be found{" "}
                    <Link
                        href="https://niem.github.io/json/reference/json-ld/context/"
                        target={"_blank"}
                        className="underline"
                    >
                        here
                    </Link>
                </HelpTooltip>
                <div className="grow" />
                <Button variant="secondary" onClick={() => setAddPairModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Pair
                </Button>
            </div>
            <Error error={removePairError} title="Failed to remove pair" />
            <Table>
                <TableCaption>
                    Custom context pairs define extensions to your base specification.
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customPairs.map((pair) => (
                        <TableRow key={pair.key}>
                            <TableCell className="font-medium">{pair.key}</TableCell>
                            <TableCell>{pair.value}</TableCell>
                            <TableCell className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    onClick={() => removePair(pair.key)}
                                    disabled={removing}
                                >
                                    <Trash className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {customPairs.length === 0 ? (
                        crateDataIsLoading ? (
                            <TableRow>
                                <TableCell className="p-4 text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell className="p-4 text-muted-foreground">
                                    No Custom Context pairs have been configured
                                </TableCell>
                            </TableRow>
                        )
                    ) : null}
                </TableBody>
            </Table>
        </div>
    )
}
