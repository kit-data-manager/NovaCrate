import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CircleAlert, CircleCheck, Link2, ShieldCheck } from "lucide-react"
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
import { findEntity } from "@/lib/utils"

type ConformanceCheckResult = {
    rule: EntityRule
    handler: IProfileHandler
    issues: EntityConformanceIssue[]
    referencingRules: ReferencingPropertyRule[]
}

/**
 * Top bar button that lets the user pick an entity rule from the active profiles and run
 * `checkEntityConformance` for the open entity against that rule. The result is shown in a
 * dialog so it is directly visible why an entity does (not) conform.
 */
export function EntityConformanceChecker({ entityId }: { entityId: string }) {
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

    if (groups.length === 0) return null

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                        <ShieldCheck className="size-4" /> Profile Conformance
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
                    {groups.length === 0 ? (
                        <DropdownMenuItem disabled>No active profiles</DropdownMenuItem>
                    ) : (
                        groups.map((group, groupIndex) => (
                            <div key={group.handler.id}>
                                {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
                                <DropdownMenuLabel>{group.profileName}</DropdownMenuLabel>
                                {group.rules.map((rule) => (
                                    <DropdownMenuItem
                                        key={rule["@id"]}
                                        onClick={() => runCheck(rule, group.handler)}
                                    >
                                        <span className="truncate">{getRuleName(rule)}</span>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <ConformanceResultDialog result={result} onClose={() => setResult(undefined)} />
        </>
    )
}

function ConformanceResultDialog({
    result,
    onClose
}: {
    result: ConformanceCheckResult | undefined
    onClose: () => void
}) {
    return (
        <Dialog open={result !== undefined} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Conformance: {result ? getRuleName(result.rule) : ""}</DialogTitle>
                    {result ? (
                        <div className="text-sm text-muted-foreground">
                            Profile: {result.handler.getDefinition()?.name ?? result.handler.name}
                        </div>
                    ) : null}
                </DialogHeader>
                {result ? <ConformanceResultBody result={result} /> : null}
            </DialogContent>
        </Dialog>
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
