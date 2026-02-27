import React, { memo, useCallback, useContext, useMemo, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useEditorState } from "@/lib/state/editor-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import useSWR from "swr"
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Error as ErrorDisplay } from "@/components/error"

export const RenameModal = memo(function RenameModal({
    open,
    onOpenChange,
    changes
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    changes: { from: string; to?: string }[]
}) {
    console.log(open, changes)

    const entities = useEditorState((store) => store.entities)
    const { serviceProvider, crateId, changeEntityId } = useContext(CrateDataContext)
    // TODO integrate with feature flags

    const mode = useMemo(() => {
        if (changes.length === 1 && changes[0].to === undefined) {
            return "single-rename"
        } else if (changes.every((change) => change.to !== undefined)) {
            return "multiple-review"
        } else {
            return "invalid"
        }
    }, [changes])

    const [committingChanges, setCommittingChanges] = useState<
        { from: string; to: string }[] | undefined
    >(undefined)

    console.log("committing", committingChanges)

    if (open && changes.every((c) => c.to !== undefined) && committingChanges === undefined) {
        setCommittingChanges(changes as { from: string; to: string }[])
    } else if (!open && committingChanges !== undefined) {
        setCommittingChanges(undefined)
    }

    const committingChangesCorrect = useMemo(() => {
        const issues: string[] = []
        if (!committingChanges) return issues

        for (const change of committingChanges) {
            if (change.from.endsWith("/") && !change.to.endsWith("/")) {
                issues.push(
                    `Changing directory path '${change.from}' to file path '${change.to}' is illegal`
                )
            }

            if (!change.from.endsWith("/") && change.to.endsWith("/")) {
                issues.push(
                    `Changing file path '${change.from}' to directory path '${change.to}' is illegal`
                )
            }
        }

        console.log("found issues", issues)
        return issues
    }, [committingChanges])

    const analyzeChangeImpact = useCallback(
        async (changes: { from: string; to: string }[]) => {
            // This contains all files or folders that have to be renamed/moved for this change
            const fileImpact = new Map<string, string>()

            if (!serviceProvider || !crateId) return fileImpact

            for (const change of changes) {
                // If there is no shorter path in the changeset, then include this one
                // This makes sure moving a folder and its files at the same time only adds the folder move to the impact set
                if (
                    changes.findIndex(
                        (otherChange) =>
                            change.from.startsWith(otherChange.from) &&
                            change.from.split("/").length > otherChange.from.split("/").length
                    ) == -1
                ) {
                    fileImpact.set(change.from, change.to)
                }
            }

            console.log("Analyzed impact as", fileImpact)
            return fileImpact
        },
        [crateId, serviceProvider]
    )

    const { data } = useSWR(
        crateId && committingChanges && "rename-impact-" + crateId,
        async () => {
            if (committingChanges)
                return JSON.stringify(
                    Array.from((await analyzeChangeImpact(committingChanges)).entries())
                )
            else return undefined
        }
    )
    console.log("data", data)

    const executeChanges = useCallback(async () => {
        if (!serviceProvider || !crateId || !data) return []
        const issues = []

        for (const [from, to] of JSON.parse(data) as [string, string][]) {
            try {
                const impactedEntity = entities.get(from) ?? entities.get("./" + from)
                if (impactedEntity) {
                    // This will also rename the file if there is one
                    await changeEntityId(impactedEntity, to)
                } else {
                    await serviceProvider.renameFile(crateId, from, to)
                }
            } catch (e) {
                console.error("Renaming failed partially", e)
                issues.push(new Error("Renaming failed partially: " + e))
            }
        }

        return issues
    }, [changeEntityId, crateId, data, entities, serviceProvider])

    const [isExecutingChanges, setIsExecutingChanges] = useState(false)
    const [changeExecutionIssues, setChangeExecutionIssues] = useState<Error[]>([])

    const onConfirmClick = useCallback(() => {
        setIsExecutingChanges(true)
        setChangeExecutionIssues([])
        executeChanges()
            .then((issues) => {
                setChangeExecutionIssues(issues)
                setIsExecutingChanges(false)
                if (issues.length === 0) onOpenChange(false)
            })
            .catch(console.error)
    }, [executeChanges, onOpenChange])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Entity</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>

                {changeExecutionIssues.length > 0 && (
                    <div>
                        {changeExecutionIssues.map((issue, i) => (
                            <ErrorDisplay
                                title={"An error occurred while renaming"}
                                error={issue}
                                key={i}
                            />
                        ))}
                    </div>
                )}

                {mode === "multiple-review" &&
                    (data ? (
                        <div>
                            The following changes will be made:
                            {(JSON.parse(data) as [string, string][]).map(([from, to]) => (
                                <div key={from}>
                                    {from} <ArrowRightIcon /> {to}
                                </div>
                            ))}
                            {/* TODO issue display */}
                            {committingChangesCorrect.length > 0 &&
                                committingChangesCorrect.map((issue, i) => (
                                    <div key={i}>{issue}</div>
                                ))}
                            <Button
                                onClick={onConfirmClick}
                                disabled={committingChangesCorrect.length > 0 || isExecutingChanges}
                            >
                                {isExecutingChanges && (
                                    <LoaderCircleIcon className={"size-4 animate-spin"} />
                                )}
                                Continue
                            </Button>
                        </div>
                    ) : (
                        <div>Loading</div>
                    ))}
            </DialogContent>
        </Dialog>
    )
})
