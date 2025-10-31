import packageJson from "@/package.json"
import Link from "next/link"
import Image from "next/image"

export function Footer() {
    return (
        <div className="bg-muted py-3 px-2 flex flex-col gap-3 shrink-0">
            <div className="grid grid-cols-[1fr_auto_1fr] text-sm text-muted-foreground">
                <div />
                <div className="self-center justify-self-center px-3">
                    NovaCrate v{packageJson.version}
                </div>
                <Link
                    href={"https://github.com/kit-data-manager/NovaCrate"}
                    className="opacity-50 hover:opacity-80 self-center justify-self-start"
                    target={"_blank"}
                    rel="noopener noreferrer"
                >
                    <Image src="/github.svg" alt="GitHub logo" width="16" height="16" />
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 truncate">
                <Link
                    href={"https://matwerk.datamanager.kit.edu/docs/data-protection.html"}
                    target={"_blank"}
                    className="justify-self-center text-muted-foreground text-xs truncate"
                    rel="noopener noreferrer"
                >
                    Privacy Policy
                </Link>
                <Link
                    href={`https://www.kit.edu/legals.php`}
                    target={"_blank"}
                    className={"justify-self-center text-muted-foreground text-xs truncate"}
                >
                    Legals
                </Link>
            </div>
            <div className="text-xs text-muted-foreground text-center">
                © 2025 Karlsruhe Institute of Technology (KIT)
            </div>
        </div>
    )
}
