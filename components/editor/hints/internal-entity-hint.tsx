import { isRoCrateMetadataEntity } from "@/lib/utils"
import { AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Wrench } from "lucide-react"
import { Hint } from "@/components/hint"

export function InternalEntityHint({ entity }: { entity: IFlatEntity }) {
    if (isRoCrateMetadataEntity(entity)) {
        return (
            <Hint name="internal-entity" className="mt-8">
                <Wrench className="w-4 h-4" />
                <AlertTitle>Hint: Internal Entity</AlertTitle>
                <AlertDescription>
                    This is an internal entity that should not be edited by hand. This tab is
                    intended for expert use. More information can be found here:{" "}
                    <a
                        href="https://www.researchobject.org/ro-crate/1.1/structure.html"
                        target="_blank"
                        className="underline font-semibold"
                    >
                        RO-Crate Specification v1
                    </a>
                </AlertDescription>
            </Hint>
        )
    } else return null
}
