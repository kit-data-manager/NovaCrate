import { isDataEntity } from "@/lib/utils"
import { AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, PlusIcon } from "lucide-react"
import { Hint } from "@/components/hint"

export function DataEntityHint({ entity }: { entity: IFlatEntity }) {
    if (isDataEntity(entity)) {
        return (
            <Hint name="data-entity">
                <InfoIcon className="w-4 h-4" />
                <AlertTitle>Hint: Data Entities</AlertTitle>
                <AlertDescription>
                    This is a data entity. In this editor they are identified by the letter{" "}
                    <b className="text-data">D</b> and the color{" "}
                    <span className="text-data">purple</span>. A Data Entity directly corresponds to
                    a file in the File Explorer. The purpose of the Entity is to hold the metadata
                    of the corresponding file. That could be things like the file size or file type,
                    but also the author or the software that was used to create it. To add new
                    metadata, simply press the <PlusIcon className="w-4 h-4 inline" />{" "}
                    <b>Add Property </b>
                    button or edit an existing property. Some limited examples can be found here:{" "}
                    <a
                        href="https://www.researchobject.org/ro-crate/1.1/data-entities.html#core-metadata-for-data-entities"
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
