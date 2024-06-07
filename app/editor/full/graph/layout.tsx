import { metadata } from "@/lib/metadata"
import { PropsWithChildren } from "react"

export const generateMetadata = metadata("Graph")

export default function Layout(props: PropsWithChildren) {
    return props.children
}
