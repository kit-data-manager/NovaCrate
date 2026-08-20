import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function SpecificationModal({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange(open: boolean): void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Specification</DialogTitle>
                </DialogHeader>

                <RadioGroup>
                    <div className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value="ro-crate-v1.1" id="option-one" />
                        <Label htmlFor="ro-crate-v1.1">RO-Crate v1.1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="option-one" />
                        <Label htmlFor="custom">Custom</Label>
                    </div>
                </RadioGroup>
            </DialogContent>
        </Dialog>
    )
}
