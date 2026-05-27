import { ViewerProps } from "@/lib/file-preview"
import { useMemo, useState } from "react"
import { Error } from "@/components/error"

export function ImageViewer(props: ViewerProps) {
    const [error, setError] = useState<unknown>()

    const Img = useMemo(() => {
        if (!props.data) return null
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={URL.createObjectURL(props.data)}
                alt=""
                onError={(e) => setError(e.type)}
                onLoad={() => setError(undefined)}
            />
        )
    }, [props.data])

    return (
        <div className="flex flex-col justify-center items-center h-full overflow-auto">
            <Error title={"Failed to load image"} error={error} />
            {Img}
        </div>
    )
}
