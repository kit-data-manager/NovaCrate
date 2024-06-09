import { useCrateName } from "@/lib/hooks"

export function Metadata({ page }: { page: string }) {
    const name = useCrateName()

    return <title>{`${page} - ${name} | NovaCrate`}</title>
}
