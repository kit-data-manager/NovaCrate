import { isRootEntity } from "@/lib/utils"
import { AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { Hint } from "@/components/hint"

export function RootEntityHint({ entity }: { entity: IFlatEntity }) {
    if (isRootEntity(entity)) {
        return (
            <Hint name="root-entity" className="mt-8">
                <InfoIcon className="w-4 h-4" />
                <AlertTitle>Hint: Crate Root</AlertTitle>
                <AlertDescription>
                    This is the root entity of your crate. In NovaCrate they are identified by the
                    letter <b className="text-root">R</b> and the color{" "}
                    <span className="text-root">orange</span>. It defines the name of the crate and
                    some contextual information. It is recommended to not edit the <i>Has Part</i>{" "}
                    property manually. Contextual Information that applies to the whole crate should
                    be added here. More information can be found here:{" "}
                    <a
                        href="https://www.researchobject.org/ro-crate/1.1/root-data-entity.html"
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
