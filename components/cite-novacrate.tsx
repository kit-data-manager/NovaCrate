import Link from "next/link"
import { CITE_NOVACRATE } from "@/lib/legals"
import { useCallback, useState } from "react"
import { useCopyToClipboard } from "usehooks-ts"
import Image from "next/image"

export function CiteNovaCrate() {
    const [citationHasBeenClickedToCopy, setCitationHasBeenClickedToCopy] = useState(false)
    const [_, copy] = useCopyToClipboard()

    const clickToCopyCitation = useCallback(() => {
        copy(CITE_NOVACRATE).then()
        setCitationHasBeenClickedToCopy(true)
        setTimeout(() => setCitationHasBeenClickedToCopy(false), 1000)
    }, [copy])

    return (
        <div>
            <div className="font-bold">Cite NovaCrate</div>
            <Link href={"https://doi.org/10.5281/zenodo.15183573"} target={"_blank"}>
                <Image
                    src={"https://zenodo.org/badge/DOI/10.5281/zenodo.15183573.svg"}
                    alt={"NovaCrate DOI"}
                    width={200}
                    height={20}
                    className="mb-1"
                />
            </Link>
            <div
                className="bg-accent p-2 border border-border rounded-md overflow-hidden"
                onClick={clickToCopyCitation}
            >
                {CITE_NOVACRATE}
                {citationHasBeenClickedToCopy ? (
                    <div className="text-right text-xs text-success">Copied</div>
                ) : (
                    <div className="text-right text-xs text-muted-foreground">Click to copy</div>
                )}
            </div>
        </div>
    )
}
