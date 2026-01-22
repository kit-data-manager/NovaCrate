import packageJson from "@/package.json"
import Link from "next/link"
import Image from "next/image"
import { addBasePath } from "next/dist/client/add-base-path"
import { LockKeyhole, Section } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { GITHUB_REPO, LEGALS, PRIVACY_POLICY } from "@/lib/legals"

export function Footer() {
    return (
        <div className="bg-muted py-3 px-2 flex flex-col gap-2 shrink-0">
            <div className="flex justify-center items-center flex-wrap gap-2">
                <div className="text-sm text-muted-foreground px-3">
                    NovaCrate v{packageJson.version}
                </div>
                <div className="flex justify-center items-center text-sm text-muted-foreground gap-3">
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Link
                                href={GITHUB_REPO}
                                className="opacity-50 hover:opacity-80 self-center justify-self-start"
                                target={"_blank"}
                                rel="noopener noreferrer"
                            >
                                <Image
                                    src={addBasePath("/github.svg")}
                                    alt="GitHub logo"
                                    width="16"
                                    height="16"
                                    className="dark:invert"
                                />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>GitHub Repository</TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Link
                                href={PRIVACY_POLICY}
                                target={"_blank"}
                                className="text-muted-foreground text-xs truncate hover:text-foreground"
                                rel="noopener noreferrer"
                            >
                                <LockKeyhole className="size-4 shrink-0" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>Privacy Policy</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Link
                                href={LEGALS}
                                target={"_blank"}
                                className={
                                    "text-muted-foreground text-xs truncate hover:text-foreground"
                                }
                                rel="noopener noreferrer"
                            >
                                <Section className="size-4 shrink-0" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>Legals</TooltipContent>
                    </Tooltip>
                </div>
            </div>
            <div className="text-xs text-muted-foreground text-center">
                © {new Date().getFullYear()} Karlsruhe Institute of Technology (KIT)
            </div>
            <div className="grid grid-cols-2 gap-2 truncate"></div>
        </div>
    )
}
