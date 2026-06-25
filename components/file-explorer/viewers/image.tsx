import { ViewerProps } from "@/lib/file-preview"
import { useEffect, useState } from "react"
import { Error } from "@/components/error"

export function ImageViewer(props: ViewerProps) {
    const [error, setError] = useState<unknown>()
    const [url, setUrl] = useState<string>()

    useEffect(() => {
        if (!props.data) {
            setUrl(undefined)
            return
        }
        const newUrl = URL.createObjectURL(props.data)
        setUrl(newUrl)

        return () => {
            const current = newUrl
            URL.revokeObjectURL(current)
        }
    }, [props.data])

    return (
        <div className="flex flex-col justify-center items-center h-full overflow-auto">
            <Error title={"Failed to load image"} error={error} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt=""
                onError={(e) => setError(e.type)}
                onLoad={() => setError(undefined)}
            />
        </div>
    )
}
