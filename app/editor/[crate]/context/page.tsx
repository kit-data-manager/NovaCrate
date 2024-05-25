import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Library, Pencil, Plus, Save, Trash } from "lucide-react"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import HelpTooltip from "@/components/help-tooltip"
import Link from "next/link"
import { metadata } from "@/lib/metadata"

export const generateMetadata = metadata("Context")

function EditButton() {
    return (
        <Button variant="outline">
            <Pencil className="w-4 h-4 mr-2" /> Edit
        </Button>
    )
}

function DeleteButton() {
    return (
        <Button variant="destructive">
            <Trash className="w-4 h-4 mr-2" /> Delete
        </Button>
    )
}

export default function Context() {
    return (
        <div>
            <div className="pl-4 bg-accent text-sm h-10 flex items-center">
                <Library className="w-4 h-4 shrink-0 mr-2" /> Context
            </div>

            <div className="p-4">
                <div className="my-4">
                    <Label>Specification</Label>
                    <div className="flex">
                        <Select value="rocrate-1.1">
                            <SelectTrigger className="w-[360px] rounded-r-none">
                                <SelectValue placeholder="Select a Specification" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rocrate-1.2-draft">
                                    RO-Crate 1.2 (Experimental)
                                </SelectItem>
                                <SelectItem value="rocrate-1.1">RO-Crate 1.1</SelectItem>
                                <SelectItem value="rocrate-1.0">RO-Crate 1.0</SelectItem>
                                <SelectSeparator />
                                <SelectItem value="custom">Custom...</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon" className="border-l-0 rounded-l-none">
                            <Save className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="my-4">
                    <div className="flex items-center py-2 gap-2">
                        <div className="font-bold">Custom Context Pairs</div>
                        <HelpTooltip>
                            Custom Context Pairs directly translate to entries in the{" "}
                            <span className="font-mono">@context</span> section of the
                            ro-crate-metadata.json file. These allow you to define your own local
                            types and properties. More Information on Context can be found{" "}
                            <Link
                                href="https://niem.github.io/json/reference/json-ld/context/"
                                target={"_blank"}
                                className="underline"
                            >
                                here
                            </Link>
                        </HelpTooltip>
                        <div className="grow" />
                        <Button variant="outline">
                            <Plus className="w-4 h-4 mr-2" /> Add Pair
                        </Button>
                    </div>
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
                            <TableRow>
                                <TableCell className="font-medium">CustomClass</TableCell>
                                <TableCell>https://example.org/CustomClass</TableCell>
                                <TableCell className="flex gap-2">
                                    <EditButton />
                                    <DeleteButton />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">customProperty</TableCell>
                                <TableCell>https://example.org/customProperty</TableCell>
                                <TableCell className="flex gap-2">
                                    <EditButton />
                                    <DeleteButton />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
