import { isContextualEntity } from "@/lib/utils"
import { AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { Hint } from "@/components/hint"

export function ContextualEntityHint({ entity }: { entity: IFlatEntity }) {
    if (isContextualEntity(entity)) {
        return (
            <Hint name="contextual-entity">
                <InfoIcon className="w-4 h-4" />
                <AlertTitle>Hint: Contextual Entities</AlertTitle>
                <AlertDescription>
                    This is a contextual entity. In this editor they are identified by the letter{" "}
                    <b className="text-contextual">C</b> and the color{" "}
                    <span className="text-contextual">green</span>. A Contextual Entity describes
                    something that is not directly a file or directory. Its main purpose is to give
                    context to Data Entities. Most commonly, Contextual Entities describe things
                    like People, Organizations or Places. Some limited examples can be found here:{" "}
                    <a
                        href="https://www.researchobject.org/ro-crate/1.1/contextual-entities.html#people"
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
