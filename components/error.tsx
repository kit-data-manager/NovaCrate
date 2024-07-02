import { CircleAlert, TriangleAlert, XIcon } from "lucide-react"
import { PropsWithChildren, useMemo } from "react"
import { handleSpringError } from "@/lib/spring-error-handling"

function cn(size?: "md" | "xl") {
    if (!size || size == "md") {
        return "text-destructive-foreground bg-destructive rounded p-2 flex items-center text-sm"
    } else {
        return "text-destructive-foreground bg-destructive rounded p-4 flex items-center text-xl"
    }
}

function cnIcon(size?: "md" | "xl") {
    if (!size || size == "md") {
        return "w-4 h-4 mr-2 shrink-0"
    } else {
        return "w-8 h-8 mr-4 shrink-0"
    }
}

export function Error(
    props: (
        | {
              title?: string
              error: unknown
              prefix?: string
          }
        | PropsWithChildren<{}>
    ) & { size?: "md" | "xl"; className?: string; warn?: boolean; onClear?: () => void }
) {
    const parsedText = useMemo(() => {
        if (!("error" in props)) return undefined
        return props.error ? handleSpringError(props.error) : ""
    }, [props])

    if ("error" in props && !props.error) return null
    if ("children" in props && !props.children) return null

    return (
        <div
            className={
                cn(props.size) +
                " " +
                props.className +
                (props.warn ? " !bg-transparent border-warn border text-warn" : "")
            }
        >
            {props.warn ? (
                <TriangleAlert className={cnIcon(props.size)} />
            ) : (
                <CircleAlert className={cnIcon(props.size)} />
            )}
            {"error" in props ? (
                <div>
                    <div className="">{props.title}</div>
                    <div className={props.title ? "text-xs" : ""}>
                        {props.prefix} {parsedText}
                    </div>
                </div>
            ) : (
                props.children
            )}
            <div className="grow" />
            {props.onClear ? (
                <button
                    className={
                        "p-2 rounded transition hover:bg-primary/10" +
                        (props.warn ? "" : "bg-destructive hover:bg-destructive-foreground/20")
                    }
                    onClick={() => props.onClear?.call(null)}
                >
                    <XIcon className="w-4 h-4" />
                </button>
            ) : null}
        </div>
    )
}
