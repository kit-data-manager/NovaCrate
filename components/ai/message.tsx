import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { memo, PropsWithChildren } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { ToolCall } from "@/components/ai/tool-call"
import {
    BugIcon,
    ChevronRight,
    EyeIcon,
    LoaderCircle,
    PencilIcon,
    PlusIcon,
    TrashIcon
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { NC_UIMessage } from "@/lib/ai/types"
import { UserMessage } from "@/components/ai/user-message"

export const Message = memo(function Message({
    message: m,
    editMessage
}: {
    message: NC_UIMessage
    editMessage: (text: string) => void
}) {
    if (m.role === "user") {
        return <UserMessage message={m} editMessage={editMessage} />
    }

    return (
        <div
            className={`space-y-1 m-2 mt-0 p-2 rounded-xl overflow-x-auto overflow-y-hidden shrink-0`}
        >
            {m.parts.map((part, i) => {
                if (part.type === "text" && m.role !== "user") {
                    return (
                        <Markdown
                            key={i}
                            skipHtml
                            remarkPlugins={[remarkGfm]}
                            components={{
                                ul: (props: PropsWithChildren) => (
                                    <ul className="list-disc pl-4">{props.children}</ul>
                                ),
                                ol: (props: PropsWithChildren) => (
                                    <ol className="list-decimal pl-4">{props.children}</ol>
                                ),
                                table: (props: PropsWithChildren) => (
                                    <Table>{props.children}</Table>
                                ),
                                tr: (props: PropsWithChildren) => (
                                    <TableRow>{props.children}</TableRow>
                                ),
                                th: (props: PropsWithChildren) => (
                                    <TableHead className="font-bold">{props.children}</TableHead>
                                ),
                                td: (props: PropsWithChildren) => (
                                    <TableCell>{props.children}</TableCell>
                                ),
                                tbody: (props: PropsWithChildren) => (
                                    <TableBody>{props.children}</TableBody>
                                ),
                                thead: (props: PropsWithChildren) => (
                                    <TableHeader>{props.children}</TableHeader>
                                ),
                                h1: (props: PropsWithChildren) => (
                                    <h1 className="text-2xl font-bold mt-4">{props.children}</h1>
                                ),
                                h2: (props: PropsWithChildren) => (
                                    <h2 className="text-xl font-bold mt-3">{props.children}</h2>
                                ),
                                h3: (props: PropsWithChildren) => (
                                    <h3 className="text-lg font-bold mt-2">{props.children}</h3>
                                ),
                                h4: (props: PropsWithChildren) => (
                                    <h4 className="font-bold mt-1">{props.children}</h4>
                                ),
                                pre: (props: PropsWithChildren) => (
                                    <pre className="border rounded-lg p-2 text-sm">
                                        {props.children}
                                    </pre>
                                )
                            }}
                        >
                            {part.text}
                        </Markdown>
                    )
                }

                if (part.type === "tool-readEntity") {
                    return (
                        <ToolCall key={i} part={part} icon={EyeIcon}>
                            Reading Entity {part.input?.entityId ?? "..."}
                        </ToolCall>
                    )
                }

                if (part.type === "tool-editEntity") {
                    return (
                        <ToolCall key={i} part={part} icon={PencilIcon}>
                            Editing Entity {part.input?.entityId ?? "..."}
                        </ToolCall>
                    )
                }

                if (part.type === "tool-createEntity") {
                    return (
                        <ToolCall key={i} part={part} icon={PlusIcon}>
                            Creating Entity {part.input?.content?.["@id"] ?? "..."}
                        </ToolCall>
                    )
                }

                if (part.type === "tool-getFilesList") {
                    return (
                        <ToolCall key={i} part={part} icon={EyeIcon}>
                            Listing files in this RO-Crate
                        </ToolCall>
                    )
                }

                if (part.type === "tool-getMetadataSummary") {
                    return (
                        <ToolCall key={i} part={part} icon={EyeIcon}>
                            Listing entities in this RO-Crate
                        </ToolCall>
                    )
                }

                if (part.type === "tool-readFilePlainText") {
                    return (
                        <ToolCall key={i} part={part} icon={EyeIcon}>
                            Reading File {part.input?.path ?? "..."}
                        </ToolCall>
                    )
                }

                if (part.type === "tool-getValidationResults") {
                    return (
                        <ToolCall key={i} part={part} icon={BugIcon}>
                            Validating RO-Crate
                        </ToolCall>
                    )
                }

                if (part.type === "tool-moveEntity") {
                    return (
                        <ToolCall key={i} part={part} icon={PencilIcon}>
                            Rename Entity {part.input?.currentEntityId ?? "..."} to{" "}
                            {part.input?.newEntityId ?? "..."}
                        </ToolCall>
                    )
                }

                if (part.type === "tool-deleteEntity") {
                    return (
                        <ToolCall key={i} part={part} icon={TrashIcon}>
                            Delete Entity {part.input?.entityId ?? "..."}
                        </ToolCall>
                    )
                }

                if (part.type === "tool-importPersonFromORCID") {
                    return (
                        <ToolCall key={i} part={part} icon={PlusIcon}>
                            Import Person from ORCID: {part.output?.["@id"] ?? "..."}
                        </ToolCall>
                    )
                }

                if (part.type === "tool-importOrganizationFromROR") {
                    return (
                        <ToolCall key={i} part={part} icon={PlusIcon}>
                            Import Organization from ROR: {part.output?.["@id"] ?? "..."}
                        </ToolCall>
                    )
                }

                if (part.type === "reasoning") {
                    return (
                        <Collapsible key={i}>
                            <CollapsibleTrigger asChild>
                                <button
                                    key={i}
                                    className="flex items-center gap-1 text-muted-foreground group"
                                >
                                    {part.state === "streaming" ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    ) : (
                                        <ChevronRight className="size-4 group-aria-expanded:rotate-90" />
                                    )}
                                    Reasoning
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className={"pl-2 mb-3"}>
                                {part.text}
                            </CollapsibleContent>
                        </Collapsible>
                    )
                }

                if (part.type === "step-start") return null

                return <div key={i}>[{part.type}]</div>
            })}
        </div>
    )
})
