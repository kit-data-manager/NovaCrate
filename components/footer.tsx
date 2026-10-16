import packageJson from "@/package.json"
import Link from "next/link"
import Image from "next/image"
import { addBasePath } from "next/dist/client/add-base-path"
import { LockKeyhole, PackageIcon, Section } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { GITHUB_REPO, LEGALS, PRIVACY_POLICY } from "@/lib/legals"

export function Footer() {
    return (
        <footer className="border-t bg-muted/50 px-4 py-5">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <PackageIcon className="size-4 text-muted-foreground" />
                    <span className="font-semibold tracking-tight">NovaCrate</span>
                    <span className="text-xs text-muted-foreground">v{packageJson.version}</span>
                </div>
                <div className="flex items-center gap-5 text-muted-foreground">
                    <Tooltip delayDuration={500}>
                        <TooltipTrigger asChild>
                            <Link
                                href={GITHUB_REPO}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub repository"
                                className="transition-colors hover:text-foreground"
                            >
                                <Image
                                    src={addBasePath("/github.svg")}
                                    alt=""
                                    width="16"
                                    height="16"
                                    className="dark:invert"
                                />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>GitHub Repository</TooltipContent>
                    </Tooltip>
                    <Link
                        href={PRIVACY_POLICY}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs transition-colors hover:text-foreground"
                    >
                        <LockKeyhole className="size-3.5 shrink-0" />
                        Privacy Policy
                    </Link>
                    <Link
                        href={LEGALS}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs transition-colors hover:text-foreground"
                    >
                        <Section className="size-3.5 shrink-0" />
                        Legals
                    </Link>
                </div>
                <div className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Karlsruhe Institute of Technology (KIT)
                </div>
            </div>
        </footer>
    )
}
