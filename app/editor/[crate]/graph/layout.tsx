import { metadata } from "@/lib/metadata"
import { PropsWithChildren } from "react"

export const generateMetadata = metadata("Graph")

export function generateStaticParams() {
    return [{ crate: "static" }]
}

export default function Layout(props: PropsWithChildren) {
    return props.children
}
