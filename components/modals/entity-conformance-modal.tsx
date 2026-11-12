import { useCallback, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { CircleAlert, CircleCheck, ArrowLeftRight, Link2, ShieldCheck } from "lucide-react"
import { memo, useEffect } from "react"
import {
    checkEntityConformance,
    EntityConformanceIssue
} from "@/lib/core/profiles/impl/util/entity-rule-conformance"
import {
    describeConformanceIssue,
    getRuleName
} from "@/lib/core/profiles/impl/util/describe-conformance-issue"
import {
    findReferencingPropertyRules,
    ReferencingPropertyRule
} from "@/lib/core/profiles/impl/util/find-referencing-property-rules"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { useAllProfileEntityRules, useProfileService } from "@/lib/hooks/use-profile-service"
import { useContextResolver } from "@/lib/hooks/hooks"
import { editorState } from "@/lib/state/editor-state"
import { findEntity, getEntityDisplayName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type ConformanceCheckResult = {
    rule: EntityRule
    handler: IProfileHandler
    issues: EntityConformanceIssue[]
    referencingRules: ReferencingPropertyRule[]
}

/**
 * Modal to check an entity against an entity rule of the active profiles. The rule is selected
 * inside the modal (searchable, grouped by profile); the result shows why the entity does (not)
 * conform and how it can be referenced.
 */
export const EntityConformanceModal = memo(function EntityConformanceModal(props: {
    open: boolean
    onOpenChange: (open: boolean) => void
    entityId: string
}) {
    const [render, setRender] = useState(props.open)

    useEffect(() => {
        if (props.open) {
            setRender(true)
        } else {
            setTimeout(() => {
                setRender(false)
            }, 100)
        }
    }, [props.open])

    return render ? <EntityConformanceModalInner {...props} /> : null
})

function EntityConformanceModalInner({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    entityId: string
}) {
    const profileRules = useAllProfileEntityRules()
    const profileService = useProfileService()
    const resolver = useContextResolver()
    const [result, setResult] = useState<ConformanceCheckResult | undefined>()

    const groups = useMemo(() => {
        const byHandler = new Map<IProfileHandler, EntityRule[]>()
        for (const { rule, handler } of profileRules) {
            const rules = byHandler.get(handler) ?? []
            rules.push(rule)
            byHandler.set(handler, rules)
        }
        return [...byHandler.entries()].map(([handler, rules]) => ({
            handler,
            profileName: handler.getDefinition()?.name ?? handler.name,
            rules
        }))
    }, [profileRules])

    const runCheck = useCallback(
        (rule: EntityRule, handler: IProfileHandler) => {
            const entity = findEntity(editorState.getState().getEntities(), entityId)
            if (!entity) return

            const issues = checkEntityConformance(entity, rule, handler, {
                resolver,
                getEntity: (id) => findEntity(editorState.getState().getEntities(), id),
                isEntityAssignedTo: (entityId, entityRuleId) =>
                    handler.getEntityMapping().get(entityId) === entityRuleId
            })

            // Entities are mapped by references starting from the root, so an entity can match a
            // rule but never be referenced. Collect the property rules that can reference it.
            const referencingRules = findReferencingPropertyRules(
                rule,
                profileService.getProfileHandlers()
            )

            setResult({ rule, handler, issues, referencingRules })
        },
        [entityId, resolver, profileService]
    )

    const handleOpenChange = useCallback(
        (isOpen: boolean) => {
            if (!isOpen) setResult(undefined)
            onOpenChange(isOpen)
        },
        [onOpenChange]
    )

    const entityName = useMemo(() => {
        const entity = findEntity(editorState.getState().getEntities(), entityId)
        return entity ? getEntityDisplayName(entity, false) : entityId
    }, [entityId])

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Profile Conformance <Badge>Experimental</Badge>
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        Check how the entity <span className="text-foreground">{entityName}</span>{" "}
                        conforms to the rules of the active profiles.
                    </div>
                </DialogHeader>
                {result ? (
                    <ConformanceResult result={result} onClose={() => setResult(undefined)} />
                ) : (
                    <ConformanceRuleSelection groups={groups} onSelect={runCheck} />
                )}
            </DialogContent>
        </Dialog>
    )
}

function ConformanceRuleSelection({
    groups,
    onSelect
}: {
    groups: { handler: IProfileHandler; profileName: string; rules: EntityRule[] }[]
    onSelect: (rule: EntityRule, handler: IProfileHandler) => void
}) {
    if (groups.length === 0) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0" />
                No active profiles. Add a profile first to check conformance.
            </div>
        )
    }

    return (
        <Command className="border rounded-md">
            <CommandInput placeholder="Search rules..." />
            <CommandList className="max-h-72 overflow-y-auto">
                <CommandEmpty>No rule found.</CommandEmpty>
                {groups.map((group) => (
                    <CommandGroup key={group.handler.id} heading={group.profileName}>
                        {group.rules.map((rule) => (
                            <CommandItem
                                key={rule["@id"]}
                                value={`${group.profileName} ${getRuleName(rule)}`}
                                onSelect={() => onSelect(rule, group.handler)}
                            >
                                <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{getRuleName(rule)}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
            </CommandList>
        </Command>
    )
}

function ConformanceResult({
    result,
    onClose
}: {
    result: ConformanceCheckResult
    onClose: () => void
}) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm max-w-full overflow-hidden">
                <Button
                    variant="secondary"
                    className="min-w-0 max-w-full grow"
                    aria-label="Choose a different rule"
                    onClick={onClose}
                >
                    <span className="font-medium shrink-0 whitespace-nowrap">Rule:</span>
                    <span className="truncate w-0 flex-1 min-w-0 text-left">
                        {getRuleName(result.rule)} (
                        {result.handler.getDefinition()?.name ?? result.handler.name})
                    </span>
                    <ArrowLeftRight className="size-4 shrink-0" />
                </Button>
            </div>
            <ConformanceResultBody result={result} />
        </div>
    )
}

function ConformanceResultBody({ result }: { result: ConformanceCheckResult }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                {result.issues.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm">
                        <CircleCheck className="size-4 shrink-0 text-green-600" />
                        This entity conforms to the selected rule.
                    </div>
                ) : (
                    <>
                        <div className="text-sm text-muted-foreground">
                            {result.issues.length} issue{result.issues.length === 1 ? "" : "s"}{" "}
                            found
                        </div>
                        {result.issues.map((issue, i) => (
                            <ConformanceIssue key={i} issue={issue} />
                        ))}
                    </>
                )}
            </div>
            <ReferencingRulesSection referencingRules={result.referencingRules} />
        </div>
    )
}

/**
 * Shows how an entity conforming to the checked rule can be referenced in a crate: all property
 * rules of the active profiles whose range includes the rule. Since entities are mapped through
 * references starting from the root, an entity that is never referenced is invisible to profile
 * validation, so this list shows which properties would make it part of the profile.
 */
function ReferencingRulesSection({
    referencingRules
}: {
    referencingRules: ReferencingPropertyRule[]
}) {
    return (
        <div className="flex flex-col gap-2 border-t pt-3">
            <div className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="size-4" /> How this entity can be referenced
            </div>
            {referencingRules.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                    No property rule of the active profiles includes this rule in its range. Even
                    when the entity conforms, no property of the profiles can reference it.
                </div>
            ) : (
                <>
                    <div className="text-sm text-muted-foreground">
                        The following properties can reference an entity of this rule. The entity
                        must be referenced by one of them to become part of the profile.
                    </div>
                    <div className="flex flex-col gap-2">
                        {referencingRules.map((referencingRule) => (
                            <ReferencingRuleItem
                                key={
                                    referencingRule.handler.id + referencingRule.propertyRule["@id"]
                                }
                                referencingRule={referencingRule}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

function ReferencingRuleItem({ referencingRule }: { referencingRule: ReferencingPropertyRule }) {
    const { propertyRule, handler, appliesToEntityRules } = referencingRule
    const profileName = handler.getDefinition()?.name ?? handler.name
    const applicableRules =
        appliesToEntityRules.length > 0
            ? appliesToEntityRules.map((rule) => getRuleName(rule)).join(", ")
            : "any entity"

    return (
        <div className="flex gap-2 text-sm">
            <Link2 className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
                <div className="font-medium">
                    <code>{propertyRule.label}</code> on {applicableRules}
                </div>
                <div className="text-muted-foreground">
                    Profile: {profileName} · {describePropertyCardinality(propertyRule)}
                </div>
            </div>
        </div>
    )
}

function ConformanceIssue({ issue }: { issue: EntityConformanceIssue }) {
    const { title, description } = describeConformanceIssue(issue)
    return (
        <div className="flex gap-2 text-sm">
            <CircleAlert className="size-4 shrink-0 text-destructive mt-0.5" />
            <div>
                <div className="font-medium">{title}</div>
                <div className="text-muted-foreground">{description}</div>
            </div>
        </div>
    )
}

function describePropertyCardinality(propertyRule: PropertyRule): string {
    const parts: string[] = []
    if (propertyRule.minCount !== undefined) {
        parts.push(
            propertyRule.minCount === 1
                ? "required"
                : `required at least ${propertyRule.minCount} times`
        )
    } else {
        parts.push("optional")
    }
    if (propertyRule.maxCount !== undefined) {
        parts.push(`at most ${propertyRule.maxCount} times`)
    }
    return parts.join(", ")
}
