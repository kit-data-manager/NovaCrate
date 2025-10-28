import { Metadata } from "next"

export function makeStaticMetadata(title: string): Metadata {
    return { title: `${title} | NovaCrate` }
}
