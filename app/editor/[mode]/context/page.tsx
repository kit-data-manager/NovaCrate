import { makeStaticMetadata } from "@/lib/makeStaticMetadata"
import { ContextPage } from "@/components/context/context"
import { Metadata } from "next"

export const metadata: Metadata = makeStaticMetadata("Profiles & Context")

export default function Context() {
    return <ContextPage />
}
