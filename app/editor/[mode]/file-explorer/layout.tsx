import { makeStaticMetadata } from "@/lib/makeStaticMetadata"
import { PropsWithChildren } from "react"

export const metadata = makeStaticMetadata("File Explorer")

export default function Layout(props: PropsWithChildren) {
    return props.children
}
