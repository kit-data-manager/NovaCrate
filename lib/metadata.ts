import { RestProvider } from "@/lib/rest-provider"
import { getEntityDisplayName, isRootEntity } from "@/lib/utils"
import { Metadata } from "next"

type Props = {
    params: { crate?: string }
}

const METADATA_SERVICE_PROVIDER = new RestProvider()

export function metadata(title: string) {
    return async (props: Props): Promise<Metadata> => {
        const crateId = props.params.crate

        if (crateId && crateId === "static") return { title: `${title} | RO-Crate Editor` }

        const crateData = crateId ? await METADATA_SERVICE_PROVIDER.getCrate(crateId) : undefined
        const root = crateData?.["@graph"].find(isRootEntity)
        const crateName = root ? getEntityDisplayName(root, true) : crateId

        return { title: `${title} - ${crateName} | RO-Crate Editor` }
    }
}
