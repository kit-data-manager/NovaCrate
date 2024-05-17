import { ViewerProps } from "@/components/file-explorer/viewers/base"

export function ImageViewer(props: ViewerProps) {
    if (!props.data) return null

    return (
        <div className="flex flex-col justify-center items-center h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(props.data)} alt="" />
        </div>
    )
}
