import { ExternalLink } from "lucide-react"
import Markdown from "react-markdown"
import React, { memo, useMemo } from "react"

type CommentType = string | { "@language": string; "@value": string }

export const MarkdownComment = memo(function MarkdownComment({
    comment,
    allowLinks
}: {
    comment?: CommentType
    allowLinks?: boolean
}) {
    const parsedComment = useMemo(() => {
        if (!comment) return ""
        const value = typeof comment === "string" ? comment : comment["@value"]
        // In future versions this could be extended to redirect to the correct schema. Currently, I
        // only saw Schema.org schemas with links, so that's what I used.
        return value.replaceAll(/\[{2}(\w+)]{2}/g, "[$1](https://schema.org/$1)")
    }, [comment])

    return (
        <Markdown
            allowedElements={["a", "p", "br", "b", "i"]}
            components={{
                a: (props) =>
                    allowLinks ? (
                        <span className="hover:cursor-pointer hover:text-primary no-toggle">
                            <a className="underline" href={props.href} target="_blank">
                                {props.children}
                            </a>
                            <ExternalLink className="inline-block w-3 h-3 ml-0.5" />
                        </span>
                    ) : (
                        <span>{props.children}</span>
                    )
            }}
        >
            {parsedComment}
        </Markdown>
    )
})
