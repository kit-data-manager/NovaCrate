import { metadata } from "@/lib/metadata"
import { PropsWithChildren } from "react"

export const generateMetadata = metadata("JSON Editor")

export default function Layout(props: PropsWithChildren) {
    return props.children
}
