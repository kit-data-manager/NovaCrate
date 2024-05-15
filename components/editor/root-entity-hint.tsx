import { isRootEntity } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function RootEntityHint({ entity }: { entity: IFlatEntity }) {
    if (isRootEntity(entity)) {
        return (
            <Alert className="mt-8">
                <AlertTitle>Crate Root</AlertTitle>
                <AlertDescription>
                    This is the root entity of your crate. It defines the name of the crate and some
                    contextual information. It is recommended to not edit the <i>Has Part</i>{" "}
                    property manually. More information can be found here: <a></a>
                </AlertDescription>
            </Alert>
        )
    } else return null
}
