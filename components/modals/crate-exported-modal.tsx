import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Confetti } from "@/components/ui/confetti"
import { useContext, useState } from "react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { addBasePath } from "next/dist/client/add-base-path"
import Image from "next/image"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { CiteNovaCrate } from "@/components/cite-novacrate"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { cn } from "@/lib/utils"

const STAR_VALUES = [1, 2, 3, 4, 5]
const RATING_ENDPOINT = "https://novacrate.datamanager.kit.edu/feedback/api/feedback/rating"
const FEEDBACK_EMBED_KEY = "fb_e72ff7097a519b73b129a2e5f721f508"

type RatingStatus = "idle" | "submitting" | "success" | "error"

function StarRating({
    selectedStars,
    disabled,
    onRate
}: {
    selectedStars: number
    disabled?: boolean
    onRate: (stars: number) => void
}) {
    const [hoveredStars, setHoveredStars] = useState(0)
    const activeStars = hoveredStars || selectedStars

    return (
        <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHoveredStars(0)}
            role="group"
            aria-label="Rate NovaCrate"
        >
            {STAR_VALUES.map((stars) => (
                <button
                    key={stars}
                    type="button"
                    disabled={disabled}
                    className="rounded-md p-1 transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:hover:scale-100"
                    aria-label={`Rate ${stars} out of 5 stars`}
                    onMouseEnter={() => setHoveredStars(stars)}
                    onFocus={() => setHoveredStars(stars)}
                    onBlur={() => setHoveredStars(0)}
                    onClick={() => onRate(stars)}
                >
                    <Star
                        className={cn(
                            "size-8",
                            activeStars >= stars
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                        )}
                    />
                </button>
            ))}
        </div>
    )
}

export function CrateExportedModal({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const doNotShowAgain = useExportedModalState((state) => state.doNotShowAgain)
    const setDoNotShowAgain = useExportedModalState((state) => state.setDoNotShowAgain)
    const { showFeedbackModal } = useContext(GlobalModalContext)

    const [selfOpen, setSelfOpen] = useState(false)
    const [rating, setRating] = useState<{ status: RatingStatus; stars: number }>({
        status: "idle",
        stars: 0
    })

    const onRate = async (stars: number) => {
        setRating({ status: "submitting", stars })

        try {
            const response = await fetch(RATING_ENDPOINT, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    embedKey: FEEDBACK_EMBED_KEY,
                    rating: stars,
                    pageUrl: window.location.href
                })
            })

            if (!response.ok) {
                throw new Error(`Rating request failed with status ${response.status}`)
            }

            setRating({ status: "success", stars })
        } catch (e) {
            console.error("Failed to submit rating", e)
            setRating({ status: "error", stars })
        }
    }

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
                    <StarRating
                        selectedStars={rating.stars}
                        disabled={rating.status === "submitting"}
                        onRate={onRate}
                    />

                    {rating.status === "success" ? (
                        <>
                            <p className="text-center text-sm font-medium" role="status">
                                {rating.stars <= 2
                                    ? "We are sorry you had a bad experience. Feedback is really important to us — please share what went wrong so we can improve NovaCrate."
                                    : "Thanks for rating NovaCrate! Feedback is really important to us — if you have a moment, we would love to hear more."}
                            </p>
                            <Button variant={"outline"} onClick={() => showFeedbackModal()}>
                                {rating.stars <= 2 ? "Share your feedback" : "Send more feedback"}
                            </Button>
                        </>
                    ) : rating.status === "error" ? (
                        <>
                            <p className="text-sm text-destructive" role="status">
                                Could not submit your rating. Please try again.
                            </p>
                            <Button variant={"outline"} onClick={() => showFeedbackModal()}>
                                Share your feedback
                            </Button>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {rating.status === "submitting"
                                ? "Submitting your rating…"
                                : "How would you rate NovaCrate?"}
                        </p>
                    )}

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
