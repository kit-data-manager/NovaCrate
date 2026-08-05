import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
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
import { CheckIcon, ChevronDown, CogIcon, EllipsisVertical, LucideIcon } from "lucide-react"
import { editorState, useEditorState } from "@/lib/state/editor-state"
import { Diff, isValidUrl } from "@/lib/utils"
import { Error } from "@/components/error"
import { useCrateMutations } from "@/lib/hooks/use-crate-mutations"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

const RECOMMENDED_PROFILES: {
    uri: string
    name: string
    description: string
    icon: LucideIcon
}[] = [
    {
        uri: "https://w3id.org/workflowhub/workflow-ro-crate/1.0",
        name: "Workflow Profile",
        description: "The description of the workflow profile",
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
                <div className="flex gap-2">
                    <Input
                        value={uri}
                        onChange={(e) => setUri(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && confirm()}
                        type={"url"}
                        placeholder={"https://..."}
                    />
                    <Button onClick={confirm}>
                        <CheckIcon />
                    </Button>
                </div>
                {!hasValidUrl && <div className="text-sm text-error">Must be a valid URL</div>}
            </PopoverContent>
        </Popover>
    )
}

export function ManageProfilesModal() {
    const profileService = useProfileService()
    const [tabState, setTabState] = useState("active")
    const [profileURIs, setProfileURIs] = useState<string[]>(() => profileService.getProfileURIs())
    const removePropertyEntry = useEditorState((s) => s.removePropertyEntry)
    const addPropertyEntry = useEditorState((s) => s.addPropertyEntry)
    const rootId = useEditorState((s) => s.getRootEntityId())
    const rootHasChanges = useEditorState((s) => (rootId ? s.getEntityDiff(rootId) : null))
    const { saveEntity } = useCrateMutations()

    useEffect(() => {
        setProfileURIs(profileService.getProfileURIs())
        const remove = profileService.events.addEventListener("profile-uris-changed", (uris) =>
            setProfileURIs(uris)
        )

        return () => remove()
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
        <Dialog>
            <DialogTrigger>Manage Profiles</DialogTrigger>
            <DialogContent className="w-200! max-w-none!">
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
                                        <TableHead>Profile</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead className="text-end">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {profileURIs.length === 0 && (
                                        <TableRow>
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
                                            removeProfile={() => removeProfile(uri)}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <AddCustomProfile addCustom={(uri) => addProfile(uri)} />
                    </TabsContent>

                    <TabsContent value={"recommended"}>
                        <div>
                            {RECOMMENDED_PROFILES.map((profile, i) => (
                                <div key={i} className="p-2 border rounded-lg flex">
                                    <profile.icon className="size-10 p-1 self-center" />
                                    <div className="p-2 grow">
                                        <div className="font-semibold">{profile.name}</div>
                                        <div className="text-sm">{profile.description}</div>
                                    </div>
                                    {profileURIs.find(
                                        (uri) =>
                                            uri === profile.uri ||
                                            uri.startsWith(profile.uri) ||
                                            profile.uri.startsWith(uri)
                                    ) ? (
                                        <Button
                                            variant="destructive"
                                            className="self-center justify-self-end"
                                            onClick={() => removeProfile(profile.uri)}
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
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

export function ProfileRow({ uri, removeProfile }: { uri: string; removeProfile(): void }) {
    const profileService = useProfileService()

    const hasHandler = useMemo(() => {
        return profileService.getProfileHandlers().find((handler) => handler.profileUri === uri)
    }, [profileService, uri])

    return (
        <TableRow className={hasHandler ? "" : "bg-error/10 hover:bg-error/20"}>
            <TableCell>
                {hasHandler ? hasHandler.getDefinition()!.name : `Unsupported (uri: ${uri})`}
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
