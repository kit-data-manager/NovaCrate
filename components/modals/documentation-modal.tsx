import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { memo, useEffect, useState } from "react"
import { ExternalLinkIcon } from "lucide-react"

export const DocumentationModal = memo(function DocumentationModal(props: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [render, setRender] = useState(props.open)

    useEffect(() => {
        if (props.open) {
            setRender(true)
        } else {
            setTimeout(() => {
                setRender(false)
            }, 100)
        }
    }, [props.open])

    return render ? <DocumentationModalInner {...props} /> : null
})

export function DocumentationModalInner({
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
                    <DialogTitle>Documentation</DialogTitle>
                    <DialogDescription>
                        While there is no in-depth documentation for NovaCrate available yet, here
                        are some other very useful resources
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-1">
                    <a
                        className="hover:underline underline-offset-4"
                        href="https://w3id.org/ro/crate/1.2"
                        target="_blank"
                    >
                        RO-Crate Specification v1.2
                    </a>
                    <ExternalLinkIcon className="size-4" />
                </div>

                <div className="flex gap-1">
                    <a
                        className="hover:underline underline-offset-4"
                        href="https://github.com/kit-data-manager/novacrate"
                        target="_blank"
                    >
                        NovaCrate Repository
                    </a>
                    <ExternalLinkIcon className="size-4" />
                </div>
            </DialogContent>
        </Dialog>
    )
}
