import Link from "next/link"
import { AutoRedirect } from "@/components/auto-redirect"

export function generateStaticParams() {
    return [{ crate: "static" }]
}

export default function Home() {
    return (
        <Link href={"entities"}>
            View Entities <AutoRedirect />
        </Link>
    )
}
