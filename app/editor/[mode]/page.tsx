import Link from "next/link"
import { AutoRedirect } from "@/components/auto-redirect"

export default function Home() {
    return (
        <Link href={"entities"}>
            <AutoRedirect />
        </Link>
    )
}
