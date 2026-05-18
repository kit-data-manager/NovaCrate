import { PropsWithChildren } from "react"
import { InEditorProviders } from "@/components/providers/in-editor"

export function generateStaticParams() {
    return [{ mode: "full" }, { mode: "iframe" }]
}

export default async function EditorLayout({
    children,
    params
}: PropsWithChildren<{ params: Promise<{ mode: string }> }>) {
    const { mode } = await params

    return <InEditorProviders mode={mode}>{children}</InEditorProviders>
}
