import { makeStaticMetadata } from "@/lib/makeStaticMetadata"
import { ContextPage } from "@/components/context/context"

export const metadata = makeStaticMetadata("Profiles & Context")

export default function Context() {
    return <ContextPage />
}
