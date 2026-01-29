import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { addBasePath } from "next/dist/client/add-base-path"
import { useTheme } from "next-themes"
import packageJson from "./../../package.json"
import Link from "next/link"
import { GITHUB_REPO, LEGALS, PRIVACY_POLICY } from "@/lib/legals"
import { Geist } from "next/font/google"
import { CiteNovaCrate } from "@/components/cite-novacrate"
import { Button } from "@/components/ui/button"

const geist = Geist({ subsets: ["latin"] })

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
                    className={`rounded-lg overflow-hidden dark:invert ${geist.className}`}
                />
                <div>
                    <div>NovaCrate v{packageJson.version}</div>
                    <div>
                        Copyright {new Date().getFullYear()} Karlsruhe Institute of Technology (KIT)
                    </div>
                    <div className="mt-4 text-sm">
                        NovaCrate is being developed at the Data Exploitation Methods Group of the
                        Scientific Computing Center at Karlsruhe Institute of Technology (KIT).
                    </div>
                </div>
                <CiteNovaCrate />
                <div className="flex gap-2 justify-center">
                    <Link className="hover:underline" href={GITHUB_REPO} target={"_blank"}>
                        <Button variant="outline">NovaCrate on GitHub</Button>
                    </Link>
                    <br />
                    <Link className="hover:underline" href={PRIVACY_POLICY} target={"_blank"}>
                        <Button variant={"outline"}>Privacy Policy</Button>
                    </Link>
                    <br />
                    <Link className="hover:underline" href={LEGALS} target={"_blank"}>
                        <Button variant={"outline"}>Legals</Button>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    )
}
