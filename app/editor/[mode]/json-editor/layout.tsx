import { makeStaticMetadata } from "@/lib/makeStaticMetadata"
import { PropsWithChildren } from "react"

export const metadata = makeStaticMetadata("JSON Editor")

export default function Layout(props: PropsWithChildren) {
    return props.children
}
