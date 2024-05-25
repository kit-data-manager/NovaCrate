import { metadata } from "@/lib/metadata"
import { PropsWithChildren } from "react"

export const generateMetadata = metadata("File Explorer")

export default function Layout(props: PropsWithChildren) {
    return props.children
}
