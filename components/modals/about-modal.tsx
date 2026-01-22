import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { addBasePath } from "next/dist/client/add-base-path"
import { useTheme } from "next-themes"
import packageJson from "./../../package.json"
import Link from "next/link"
import { GITHUB_REPO, LEGALS, PRIVACY_POLICY } from "@/lib/legals"

export function AboutModal({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const theme = useTheme()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>About</DialogTitle>
                <Image
                    src={addBasePath("/novacrate-nobg.svg")}
                    alt={"NovaCrate Logo"}
                    height={150}
                    width={463}
                    className={"rounded-lg overflow-hidden dark:invert"}
                />
                <div>
                    <div>NovaCrate v{packageJson.version}</div>
                    <div>Copyright 2026 Karlsruhe Institute of Technology (KIT)</div>
                    <div className="my-4 text-sm">
                        NovaCrate is being developed at the Data Exploitation Methods Group of the
                        Scientific Computing Center at Karlsruhe Institute of Technology (KIT).
                        <br />
                        <br />
                        Author:{" "}
                        <Link
                            className={"hover:underline"}
                            href={"https://www.scc.kit.edu/personen/christopher.raquet.php"}
                            target={"_blank"}
                        >
                            Christopher Raquet
                        </Link>
                        <br />
                    </div>
                    <Link className="hover:underline" href={GITHUB_REPO} target={"_blank"}>
                        GitHub Repository
                    </Link>
                    <br />
                    <Link className="hover:underline" href={PRIVACY_POLICY} target={"_blank"}>
                        Privacy Policy
                    </Link>
                    <br />
                    <Link className="hover:underline" href={LEGALS} target={"_blank"}>
                        Legals
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    )
}
