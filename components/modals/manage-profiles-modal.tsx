import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useProfileService } from "@/lib/hooks/use-profile-service"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { CheckIcon, ChevronDown, CogIcon, EllipsisVertical, LucideIcon, XIcon } from "lucide-react"
import { editorState, useEditorState } from "@/lib/state/editor-state"
import { Diff, isValidUrl } from "@/lib/utils"
import { Error } from "@/components/error"
import { useCrateMutations } from "@/lib/hooks/use-crate-mutations"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ProfileHandlerError } from "@/lib/core/profiles/impl/ProfileHandlerError"
import { Badge } from "@/components/ui/badge"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"

const RECOMMENDED_PROFILES: {
    uri: string
    name: string
    description: string
    icon: LucideIcon
}[] = [
    {
        uri: "https://w3id.org/workflowhub/workflow-ro-crate/1.0",
        name: "Workflow Profile",
        description:
            "This profile is used by the WorkflowHub both as downloadable archives of workflow entries and their metadata, but also for manual and programmatic upload of workflows",
        icon: CogIcon
    }
]

function AddCustomProfile({ addCustom }: { addCustom(uri: string): void }) {
    const [uri, setUri] = useState("")

    const confirm = useCallback(() => {
        addCustom(uri)
        setUri("")
    }, [addCustom, uri])

    const hasValidUrl = useMemo(() => {
        return isValidUrl(uri)
    }, [uri])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="secondary">
                    Add Custom <ChevronDown />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-102 space-y-1">
                <div className="space-y-2">
                    <div>
                        Provide a URL to a Profile RO-Crate hosted at a persistent location. See the{" "}
                        <Link
                            href={
                                "https://www.researchobject.org/ro-crate/specification/1.3/profiles.html#profile-crate"
                            }
                        >
                            Profile Crate Specification
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={uri}
                            onChange={(e) => setUri(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && hasValidUrl && confirm()}
                            type={"url"}
                            placeholder={"https://..."}
                        />
                        <Button onClick={confirm} disabled={!hasValidUrl}>
                            <CheckIcon />
                        </Button>
                    </div>
                </div>
                {!hasValidUrl && <div className="text-sm text-error">Must be a valid URL</div>}
            </PopoverContent>
        </Popover>
    )
}

function RecommendedProfile({
    profile,
    activeProfileURIs,
    removeProfile,
    addProfile
}: {
    profile: { uri: string; name: string; description: string; icon: LucideIcon }
    activeProfileURIs: string[]
    removeProfile: (uri: string) => void
    addProfile: (uri: string) => void
}) {
    const isActive = useMemo(() => {
        return activeProfileURIs.find(
            (uri) =>
                uri === profile.uri || uri.startsWith(profile.uri) || profile.uri.startsWith(uri)
        )
    }, [profile.uri, activeProfileURIs])

    return (
        <div className="p-2 border rounded-lg flex">
            <profile.icon className="size-10 p-1 self-center shrink-0" />
            <div className="p-2 grow">
                <div className="font-semibold">{profile.name}</div>
                <div className="text-sm">{profile.description}</div>
            </div>
            {isActive ? (
                <Button
                    variant="destructive"
                    className="self-center justify-self-end"
                    onClick={() => removeProfile(isActive)}
                >
                    Remove
                </Button>
            ) : (
                <Button
                    className="self-center justify-self-end"
                    onClick={() => addProfile(profile.uri)}
                >
                    Activate
                </Button>
            )}
        </div>
    )
}

export function ManageProfilesModal({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange(open: boolean): void
}) {
    const profileService = useProfileService()
    const [tabState, setTabState] = useState("active")
    const [profileURIs, setProfileURIs] = useState<string[]>(() => profileService.getProfileURIs())
    const [profileHandlers, setProfileHandlers] = useState(() =>
        profileService.getProfileHandlers()
    )
    const [errors, setErrors] = useState<ProfileHandlerError[]>([])
    const removePropertyEntry = useEditorState((s) => s.removePropertyEntry)
    const addPropertyEntry = useEditorState((s) => s.addPropertyEntry)
    const rootId = useEditorState((s) => s.getRootEntityId())
    const rootHasChanges = useEditorState((s) => (rootId ? s.getEntityDiff(rootId) : null))
    const { saveEntity } = useCrateMutations()

    useEffect(() => {
        setProfileURIs(profileService.getProfileURIs())
        setProfileHandlers(profileService.getProfileHandlers())
        setErrors(profileService.getAllErrors())
        const remove1 = profileService.events.addEventListener("profile-uris-changed", (uris) => {
            setProfileURIs(uris)
            setErrors(profileService.getAllErrors())
        })
        const remove2 = profileService.events.addEventListener("profiles-changed", (handlers) => {
            setProfileHandlers(handlers)
        })
        const remove3 = profileService.events.addEventListener("error-emitted", () =>
            setErrors(profileService.getAllErrors())
        )

        return () => {
            remove1()
            remove2()
            remove3()
        }
    }, [profileService])

    const removeProfile = useCallback(
        (uri: string) => {
            if (!rootId) return
            removePropertyEntry(rootId, "conformsTo", { "@id": uri })
            saveEntity(editorState.getState().getEntities().get(rootId)!).then()
        },
        [removePropertyEntry, rootId, saveEntity]
    )

    const addProfile = useCallback(
        (uri: string) => {
            if (!rootId) return
            addPropertyEntry(rootId, "conformsTo", { "@id": uri })
            saveEntity(editorState.getState().getEntities().get(rootId)!).then()
        },
        [addPropertyEntry, rootId, saveEntity]
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-200! max-w-screen!">
                <DialogHeader>
                    <DialogTitle>Manage Profiles</DialogTitle>
                    <DialogDescription>
                        Manage the profiles that are active for this RO-Crate
                    </DialogDescription>
                </DialogHeader>

                {rootHasChanges !== null && rootHasChanges !== Diff.None && (
                    <Error
                        warn
                        error={
                            "All unsaved changes in the root entity will automatically be saved if you make any changes in this window"
                        }
                        title={"Root entity has unsaved changes"}
                    />
                )}

                <Tabs className="max-w-full min-w-0" value={tabState} onValueChange={setTabState}>
                    <TabsList defaultValue={"active"}>
                        <TabsTrigger value={"active"}>Active Profiles</TabsTrigger>
                        <TabsTrigger value={"recommended"}>Recommended Profiles</TabsTrigger>
                    </TabsList>

                    <TabsContent value={"active"} className="space-y-2">
                        <div className="overflow-x-auto rounded-lg border">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-4"></TableHead>
                                        <TableHead>Profile</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead className="text-end">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {profileURIs.length === 0 && (
                                        <TableRow>
                                            <TableCell />
                                            <TableCell className="text-sm text-muted-foreground">
                                                No profiles are active
                                            </TableCell>
                                            <TableCell />
                                            <TableCell />
                                        </TableRow>
                                    )}
                                    {profileURIs.map((uri, i) => (
                                        <ProfileRow
                                            key={uri + i}
                                            uri={uri}
                                            profileHandlers={profileHandlers}
                                            removeProfile={() => removeProfile(uri)}
                                            errors={errors.filter((e) => e.profileUri === uri)}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-end">
                            <AddCustomProfile addCustom={(uri) => addProfile(uri)} />
                        </div>
                    </TabsContent>

                    <TabsContent value={"recommended"}>
                        <div>
                            {RECOMMENDED_PROFILES.map((profile) => (
                                <RecommendedProfile
                                    key={profile.uri}
                                    profile={profile}
                                    activeProfileURIs={profileURIs}
                                    removeProfile={removeProfile}
                                    addProfile={addProfile}
                                />
                            ))}
                        </div>
                        <div className="flex justify-center pt-2 text-sm text-muted-foreground gap-1">
                            Want to see more profiles in this list?{" "}
                            <Link
                                href={"https://github.com/kit-data-manager/NovaCrate/issues/new"}
                                target={"_blank"}
                            >
                                Open an issue on GitHub
                            </Link>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

export function ProfileRow({
    uri,
    profileHandlers,
    removeProfile,
    errors
}: {
    uri: string
    profileHandlers: IProfileHandler[]
    removeProfile(): void
    errors: ProfileHandlerError[]
}) {
    const hasHandler = useMemo(() => {
        return profileHandlers.find((handler) => handler.profileUri === uri)
    }, [profileHandlers, uri])

    return (
        <TableRow className={hasHandler ? "" : "bg-error/10 hover:bg-error/20"}>
            <TableCell>
                {hasHandler ? (
                    <CheckIcon className="size-4 stroke-success" />
                ) : (
                    <XIcon className="size-4 stroke-error" />
                )}
            </TableCell>
            <TableCell>
                {hasHandler ? hasHandler.getDefinition()!.name : `${uri}`}{" "}
                {errors.length > 0 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Badge variant="destructive" className="ml-1">
                                View Errors ({errors.length})
                            </Badge>
                        </PopoverTrigger>
                        <PopoverContent className="w-98 max-h-98 overflow-y-auto space-y-2">
                            {errors.map((e, i) => (
                                <Error key={i} error={e} />
                            ))}
                        </PopoverContent>
                    </Popover>
                )}
            </TableCell>
            <TableCell>{hasHandler && hasHandler.name}</TableCell>
            <TableCell className="p-0 flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <EllipsisVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem variant="destructive" onClick={removeProfile}>
                            Remove
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    )
}
