import { makeStaticMetadata } from "@/lib/makeStaticMetadata"
import { PropsWithChildren } from "react"
import { Metadata } from "next"

export const metadata: Metadata = makeStaticMetadata("JSON Editor")

export default function Layout(props: PropsWithChildren) {
    return props.children
}
