import { useEffect, useMemo } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { useContextResolver } from "@/lib/hooks/hooks"
import { isTypeAllowed } from "@/components/modals/create-entity/components/type-allowed"
import { ProfileTypeSection } from "@/components/modals/create-entity/components/profile-type-section"
import { SuggestedTypesSection } from "@/components/modals/create-entity/components/suggested-types-section"
import { useProfileEntityRules } from "@/components/modals/create-entity/hooks/use-profile-entity-rules"
import {
    SUGGESTED_CONTEXTUAL_ENTITIES,
    SUGGESTED_DATA_ENTITIES
} from "@/components/modals/create-entity/data/suggested-types"
import { undefinedIfEmpty } from "@/lib/utils"

const GENERAL_TAB = "general"

export function SimpleTypeSelect({
    onTypeSelect,
    setFullTypeBrowser,
    onOpenChange,
    restrictToClasses,
    restrictToEntityRules,
    disableSimpleTypeSelect
}: {
    onTypeSelect(value: string | string[], profileClass: EntityRule): void
    setFullTypeBrowser(open: boolean): void
    onOpenChange(open: boolean): void
    disableSimpleTypeSelect: () => void
    restrictToClasses?: SlimClass[]
    restrictToEntityRules?: string[]
}) {
    const profileEntityRules = useProfileEntityRules()
    const resolver = useContextResolver()

    // Determine which tabs have at least one suggestion allowed by restrictToClasses.
    const generalAllowed = useMemo(() => {
        return [...SUGGESTED_DATA_ENTITIES, ...SUGGESTED_CONTEXTUAL_ENTITIES].some((s) =>
            isTypeAllowed(resolver, s.type, restrictToClasses)
        )
    }, [resolver, restrictToClasses])

    const visibleProfiles = useMemo(() => {
        const restrictToEntityRulesFilter = undefinedIfEmpty(restrictToEntityRules)
        return profileEntityRules.map((profile) => ({
            ...profile,
            classes: profile.classes.filter((c) =>
                restrictToEntityRulesFilter
                    ? restrictToEntityRulesFilter.includes(c["@id"])
                    : isTypeAllowed(resolver, c.specializationOf || "Thing", restrictToClasses)
            )
        }))
    }, [profileEntityRules, resolver, restrictToClasses, restrictToEntityRules])

    const showGeneral = !restrictToClasses || generalAllowed
    const visibleProfileTabs = visibleProfiles.filter((p) => p.classes.length > 0)

    // Pick the default open tab: first visible profile, otherwise the general tab.
    const defaultTab = visibleProfileTabs[0]?.id ?? (showGeneral ? GENERAL_TAB : "")

    const hasAnyTab = showGeneral || visibleProfileTabs.length > 0

    useEffect(() => {
        if (!hasAnyTab) disableSimpleTypeSelect()
    }, [disableSimpleTypeSelect, hasAnyTab])

    return (
        <>
            <DialogHeader>
                <DialogTitle>Create a new Entity</DialogTitle>

                <DialogDescription>
                    Select the type of the entity you want to create. If you want to add a file or
                    folder to the Crate, choose the appropriate Data Entity Type. If you want to add
                    some contextual information to your crate, simply choose a matching contextual
                    entity or open the full type browser at the bottom.
                </DialogDescription>
            </DialogHeader>

            {hasAnyTab ? (
                <Tabs defaultValue={defaultTab} className="w-full">
                    {visibleProfileTabs.length > 0 && (
                        <TabsList className="flex-wrap h-auto">
                            {visibleProfileTabs.map((profile) => (
                                <TabsTrigger key={profile.id} value={profile.id}>
                                    {profile.profileName}
                                </TabsTrigger>
                            ))}
                            {showGeneral && <TabsTrigger value={GENERAL_TAB}>General</TabsTrigger>}
                        </TabsList>
                    )}

                    {visibleProfileTabs.map((profile) => (
                        <TabsContent key={profile.id} value={profile.id}>
                            <ProfileTypeSection profile={profile} onTypeSelect={onTypeSelect} />
                        </TabsContent>
                    ))}

                    {showGeneral && (
                        <TabsContent value={GENERAL_TAB}>
                            <SuggestedTypesSection
                                onTypeSelect={onTypeSelect}
                                restrictToClasses={restrictToClasses}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            ) : (
                <div className="text-sm text-muted-foreground">
                    No matching types for the current property. Use the full type browser below.
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                    Close
                </Button>
                <Button variant="secondary" onClick={() => setFullTypeBrowser(true)}>
                    <Search className="size-4 mr-2" /> Browse all Types
                </Button>
            </div>
        </>
    )
}
