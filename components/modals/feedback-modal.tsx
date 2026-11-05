import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { FeedbackEmbed } from "@/components/FeedbackEmbed"

export function FeedbackModal({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Feedback</DialogTitle>
                    <DialogDescription>
                        Give feedback using the form below. We highly appreciate your input!
                    </DialogDescription>
                </DialogHeader>
                <FeedbackEmbed />
            </DialogContent>
        </Dialog>
    )
}
