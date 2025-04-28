import { Compass, EyeOff } from "lucide-react"
import { useMemo } from "react"

export function PreviewNotSupported() {
    const usesSafari = useMemo(() => {
        return navigator.userAgent.toLowerCase().includes("safari")
    }, [])

    return (
        <div className="grow flex justify-center items-center">
            <div className="flex flex-col justify-center items-center p-10 text-center text-muted-foreground">
                <EyeOff className="w-20 h-20" />
                <div className="text-2xl py-4">Preview not available</div>
                <div>
                    There is no preview available for this file type. Download it to view it or
                    select a different file to preview.
                </div>
                {usesSafari && (
                    <div className="mt-8 p-4 bg-muted text-sm rounded max-w-80 flex items-center flex-col gap-2">
                        <Compass className="size-6" />
                        It seems like you are using Safari. Due to technical limitations, only few
                        specific files can be previewed with Safari.
                    </div>
                )}
            </div>
        </div>
    )
}
