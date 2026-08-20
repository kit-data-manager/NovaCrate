"use client"

import { useCallback, useState } from "react"
import { useStore } from "zustand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, Trash } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { profileTrustSettings } from "@/lib/state/profile-trust-settings"
import { isValidUrl } from "@/lib/utils"

function TrustedUrlRow({ url, onRemove }: { url: string; onRemove(url: string): void }) {
    return (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="grow break-all">{url}</span>
            <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        aria-label={`Remove ${url}`}
                        onClick={() => onRemove(url)}
                    >
                        <Trash className="size-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
            </Tooltip>
        </div>
    )
}

function BlockedUrlRow({
    url,
    onTrust,
    onRemove
}: {
    url: string
    onTrust(url: string): void
    onRemove(url: string): void
}) {
    return (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="grow break-all">{url}</span>
            <Badge variant="destructive" className="shrink-0">
                Blocked
            </Badge>
            <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        aria-label={`Trust ${url}`}
                        onClick={() => onTrust(url)}
                    >
                        <Check className="size-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Trust</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        aria-label={`Remove ${url}`}
                        onClick={() => onRemove(url)}
                    >
                        <Trash className="size-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
            </Tooltip>
        </div>
    )
}

export function ProfilesSettings() {
    const trusted = useStore(profileTrustSettings, (s) => s.trusted)
    const blocked = useStore(profileTrustSettings, (s) => s.blocked)
    const [newUrl, setNewUrl] = useState("")

    const addTrusted = useCallback(() => {
        const url = newUrl.trim()
        if (!isValidUrl(url)) return
        profileTrustSettings.getState().setTrusted(url)
        setNewUrl("")
    }, [newUrl])

    const addTrustedOnEnter = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") addTrusted()
        },
        [addTrusted]
    )

    return (
        <div className="flex flex-col gap-4 pr-2 max-h-full overflow-y-auto">
            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">Profiles</h3>

            <p className="text-sm text-muted-foreground">
                NovaCrate only fetches profile crates from profile URLs that you have approved.
                Bundled profiles (e.g. the Workflow Profile) are always trusted and do not require
                approval. When a crate references an unapproved profile, the profile is not fetched
                until you decide to trust it.
            </p>

            <div className="space-y-2">
                <Label>Trust a profile URL</Label>
                <div className="flex gap-2">
                    <Input
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        onKeyDown={addTrustedOnEnter}
                        placeholder="https://..."
                    />
                    <Button onClick={addTrusted} disabled={!isValidUrl(newUrl.trim())}>
                        Trust
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="font-semibold">Trusted Profiles</div>
                {trusted.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No trusted profiles yet.</div>
                ) : (
                    trusted.map((url) => (
                        <TrustedUrlRow
                            key={url}
                            url={url}
                            onRemove={(u) => profileTrustSettings.getState().remove(u)}
                        />
                    ))
                )}
            </div>

            <div className="space-y-2">
                <div className="font-semibold">Blocked Profiles</div>
                {blocked.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No blocked profiles.</div>
                ) : (
                    blocked.map((url) => (
                        <BlockedUrlRow
                            key={url}
                            url={url}
                            onTrust={(u) => profileTrustSettings.getState().setTrusted(u)}
                            onRemove={(u) => profileTrustSettings.getState().remove(u)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
