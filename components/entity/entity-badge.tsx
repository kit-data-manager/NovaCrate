import { useMemo } from "react"
import { isDataEntity, isFileDataEntity } from "@/lib/utils"
import { InfoIcon, PlusIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useEditorState } from "@/lib/state/editor-state"

const entityBrowserItemIconBaseCN = "border px-2 py-1 text-sm"

export function EntityBadge(props: { entity?: IEntity; size?: "md" | "lg" | "sm" }) {
    const rootEntityId = useEditorState((s) => s.getRootEntityId())

    const sizeMod = useMemo(() => {
        return props.size == "lg" ? " rounded-lg" : props.size == "sm" ? " " : ""
    }, [props.size])

    if (!props.entity) {
        return (
            <div
                className={
                    entityBrowserItemIconBaseCN +
                    " border-muted-foreground text-muted-foreground" +
                    sizeMod
                }
            >
                <span>Unknown</span>
            </div>
        )
    } else if (props.entity["@id"] === rootEntityId) {
        return (
            <Tooltip delayDuration={200}>
                <TooltipTrigger>
                    <div
                        className={
                            entityBrowserItemIconBaseCN +
                            " text-background bg-root border-transparent dark:border-root dark:text-root dark:bg-transparent" +
                            sizeMod
                        }
                    >
                        <span>Crate Root</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="font-normal max-w-96 p-0 border border-input bg-transparent [&_.arrow]:fill-input [&_.arrow]:bg-input">
                    <Alert className="border-none m-0">
                        <InfoIcon className="size-4" />
                        <AlertTitle>Hint: Crate Root</AlertTitle>
                        <AlertDescription>
                            This is the root entity of your crate. It defines the name of the crate
                            and some contextual information. It is recommended to not edit the{" "}
                            <i>Has Part</i> property manually. Contextual Information that applies
                            to the whole crate should be added here. More information can be found
                            here:{" "}
                            <a
                                href="https://www.researchobject.org/ro-crate/1.1/root-data-entity.html"
                                target="_blank"
                                className="underline font-semibold"
                            >
                                RO-Crate Specification v1
                            </a>
                        </AlertDescription>
                    </Alert>
                </TooltipContent>
            </Tooltip>
        )
    } else if (isDataEntity(props.entity)) {
        return (
            <Tooltip delayDuration={200}>
                <TooltipTrigger>
                    <div
                        className={
                            entityBrowserItemIconBaseCN +
                            " text-background bg-data border-transparent dark:border-data dark:text-data dark:bg-transparent" +
                            sizeMod
                        }
                    >
                        <span>{isFileDataEntity(props.entity) ? "File" : "Dataset"}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="font-normal max-w-96 p-0 border border-input bg-transparent [&_.arrow]:fill-input [&_.arrow]:bg-input">
                    <Alert className="border-none m-0">
                        <InfoIcon className="size-4" />
                        <AlertTitle>Hint: Data Entities</AlertTitle>
                        <AlertDescription>
                            A Data Entity directly corresponds to a file in the File Explorer. The
                            purpose of the Entity is to hold the metadata of the corresponding file.
                            That could be things like the file size or file type, but also the
                            author or the software that was used to create it. To add new metadata,
                            simply press the <PlusIcon className="size-4 inline" />{" "}
                            <b>Add Property </b>
                            button or edit an existing property. Some limited examples can be found
                            here:{" "}
                            <a
                                href="https://www.researchobject.org/ro-crate/1.1/data-entities.html#core-metadata-for-data-entities"
                                target="_blank"
                                className="underline font-semibold"
                            >
                                RO-Crate Specification v1
                            </a>
                        </AlertDescription>
                    </Alert>
                </TooltipContent>
            </Tooltip>
        )
    } else {
        return (
            <Tooltip delayDuration={200}>
                <TooltipTrigger>
                    <div
                        className={
                            entityBrowserItemIconBaseCN +
                            " text-background bg-contextual border-transparent dark:border-contextual dark:text-contextual dark:bg-transparent" +
                            sizeMod
                        }
                    >
                        <span>Contextual</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="font-normal max-w-96 p-0 border border-input bg-transparent [&_.arrow]:fill-input [&_.arrow]:bg-input">
                    <Alert className="border-none m-0">
                        <InfoIcon className="size-4" />
                        <AlertTitle>Hint: Contextual Entities</AlertTitle>
                        <AlertDescription>
                            A Contextual Entity describes something that is not directly a file or
                            directory. Its main purpose is to give context to Data Entities. Most
                            commonly, Contextual Entities describe things like People, Organizations
                            or Places. Some limited examples can be found here:{" "}
                            <a
                                href="https://www.researchobject.org/ro-crate/1.1/contextual-entities.html#people"
                                target="_blank"
                                className="underline font-semibold"
                            >
                                RO-Crate Specification v1
                            </a>
                        </AlertDescription>
                    </Alert>
                </TooltipContent>
            </Tooltip>
        )
    }
}
