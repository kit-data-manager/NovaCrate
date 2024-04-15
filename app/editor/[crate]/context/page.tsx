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
import { Edit, Pencil, Plus, Save, Trash } from "lucide-react"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

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
        <div className="p-4">
            <h2 className="text-3xl font-bold mb-4">Context</h2>

            <div className="my-4">
                <Label>Specification</Label>
                <div className="flex">
                    <Select value="rocrate-1.1">
                        <SelectTrigger className="w-[360px] rounded-r-none">
                            <SelectValue placeholder="Select a Specification" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rocrate-1.2-draft">RO-Crate 1.2 (Draft)</SelectItem>
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
                <div className="flex justify-between items-center py-2">
                    <div className="font-bold">Custom Context Pairs</div>
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
                            <TableCell className="font-medium">something</TableCell>
                            <TableCell>https://schema.org/something</TableCell>
                            <TableCell className="flex gap-2">
                                <EditButton />
                                <DeleteButton />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">another</TableCell>
                            <TableCell>https://schema.org/another</TableCell>
                            <TableCell className="flex gap-2">
                                <EditButton />
                                <DeleteButton />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
