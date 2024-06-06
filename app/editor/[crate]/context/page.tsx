import { metadata } from "@/lib/metadata"
import { ContextPage } from "@/components/context/context"

export const generateMetadata = metadata("Context")

export function generateStaticParams() {
    return [{ crate: "static" }]
}

export default function Context() {
    return <ContextPage />
}
