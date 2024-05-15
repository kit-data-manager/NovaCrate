import { useContext } from "react"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { ExternalLink } from "lucide-react"
import { Error } from "@/components/error"
import Link from "next/link"

export function WebWorkerWarning() {
    const { isReady, isUsingWebWorker } = useContext(CrateVerifyContext)

    if (isReady && !isUsingWebWorker) {
        return (
            <Error className="mt-4" warn>
                <div>
                    Your Browser does not support Web Workers or they are disabled. This can lead to
                    reduced performance. For more information, visit the{" "}
                    <Link
                        href={
                            "https://developer.mozilla.org/en-US/docs/Web/API/Worker#browser_compatibility"
                        }
                        target={"_blank"}
                    >
                        <span className="hover:underline underline-offset-4 inline-flex items-start">
                            MDN Reference
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </span>
                    </Link>
                </div>
            </Error>
        )
    } else return null
}
