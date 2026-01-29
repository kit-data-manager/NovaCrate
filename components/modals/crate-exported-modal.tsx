import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Confetti } from "@/components/ui/confetti"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { addBasePath } from "next/dist/client/add-base-path"
import Image from "next/image"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { CiteNovaCrate } from "@/components/cite-novacrate"

export function CrateExportedModal({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const doNotShowAgain = useExportedModalState((state) => state.doNotShowAgain)
    const setDoNotShowAgain = useExportedModalState((state) => state.setDoNotShowAgain)

    const [selfOpen, setSelfOpen] = useState(false)

    if (!selfOpen && open && !doNotShowAgain) setSelfOpen(true)
    if (selfOpen && !open) setSelfOpen(false)

    return (
        <Dialog open={selfOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Thank you for using NovaCrate!</DialogTitle>
                <DialogDescription>
                    If you discover any issues or have suggestions for improvement, we’d love to
                    hear from you. Follow NovaCrate on GitHub for updates, and please cite NovaCrate
                    in any resulting publications.
                </DialogDescription>

                <div className="flex flex-col justify-center items-center gap-3">
                    <Link href={"https://github.com/kit-data-manager/NovaCrate"} target={"_blank"}>
                        <Button variant={"outline"} className="px-3">
                            <Image
                                src={addBasePath("/github.svg")}
                                alt="GitHub logo"
                                width="16"
                                height="16"
                                className="dark:invert"
                            />
                            NovaCrate on GitHub
                        </Button>
                    </Link>

                    <Link
                        href={"https://github.com/kit-data-manager/NovaCrate/issues/new"}
                        target={"_blank"}
                    >
                        <Button variant={"outline"} className="px-3">
                            <Image
                                src={addBasePath("/github.svg")}
                                alt="GitHub logo"
                                width="16"
                                height="16"
                                className="dark:invert"
                            />
                            Send Feedback via GitHub
                        </Button>
                    </Link>

                    <Link href={"mailto:christopher.raquet@kit.edu"}>
                        <Button variant={"outline"}>
                            <Mail /> Send Feedback via Email
                        </Button>
                    </Link>
                </div>
                <div>
                    We depend on your input to improve NovaCrate and look forward to hearing from
                    you!
                </div>
                <CiteNovaCrate />
                <div className={"flex align-center gap-2"}>
                    <Checkbox
                        id={"dont-show-exported-popup"}
                        onCheckedChange={(v) => setDoNotShowAgain(v === "indeterminate" ? true : v)}
                        checked={doNotShowAgain}
                    />
                    <Label className="mb-0" htmlFor={"dont-show-exported-popup"}>
                        Don&#39;t show again
                    </Label>
                </div>
            </DialogContent>
            {selfOpen && (
                <Confetti className="absolute top-0 left-0 w-full h-full z-100 pointer-events-none" />
            )}
        </Dialog>
    )
}

interface CrateExportedModalState {
    doNotShowAgain: boolean
    setDoNotShowAgain: (doNotShowAgain: boolean) => void
}

const useExportedModalState = create<CrateExportedModalState>()(
    persist(
        (set) => ({
            doNotShowAgain: false,
            setDoNotShowAgain: (doNotShowAgain: boolean) => set({ doNotShowAgain: doNotShowAgain })
        }),
        {
            name: "crate-exported-modal-state"
        }
    )
)
