import { ExternalLink } from "lucide-react"
import Markdown from "react-markdown"
import React, { memo } from "react"

type CommentType = string | { "@language": string; "@value": string }

export const MarkdownComment = memo(function MarkdownComment({
    comment,
    allowLinks
}: {
    comment?: CommentType
    allowLinks?: boolean
}) {
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
            {(comment + "").replaceAll(/\[{2}(\w+)]{2}/g, "[$1](https://schema.org/$1)")}
        </Markdown>
    )
})
