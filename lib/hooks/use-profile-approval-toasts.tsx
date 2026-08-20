"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { XIcon, ShieldCheck } from "lucide-react"
import { profileTrustSettings } from "@/lib/state/profile-trust-settings"
import { IProfileService } from "@/lib/core/profiles/IProfileService"

function resolveApproval(profileService: IProfileService, uri: string, trusted: boolean) {
    if (trusted) profileTrustSettings.getState().setTrusted(uri)
    else profileTrustSettings.getState().setBlocked(uri)
    profileService.setProfileURIs(profileService.getProfileURIs()).then()
}

function showProfileApprovalToast(profileService: IProfileService, uri: string) {
    toast.custom(
        (t) => (
            <div className="w-96 rounded-lg border bg-background p-4 shadow-lg">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="size-4 mt-0.5 shrink-0" />
                        <div className="text-sm font-medium">
                            This RO-Crate references an unknown Profile
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-mr-2 -mt-2 size-6 shrink-0"
                        aria-label="Dismiss"
                        onClick={() => toast.dismiss(t)}
                    >
                        <XIcon className="size-3" />
                    </Button>
                </div>
                <div className="mt-1 break-all text-xs text-muted-foreground pl-6">{uri}</div>
                <div className="mt-3 flex justify-end gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            resolveApproval(profileService, uri, false)
                            toast.dismiss(t)
                        }}
                    >
                        Block
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => {
                            resolveApproval(profileService, uri, true)
                            toast.dismiss(t)
                        }}
                    >
                        Trust
                    </Button>
                </div>
            </div>
        ),
        {
            duration: Infinity,
            dismissible: true
        }
    )
}

/**
 * Subscribes to "profile-approval-required" events of the given profile service
 * and shows a Toast asking the user to trust or block untrusted profile URIs.
 * Also checks URIs that are already pending, so decisions requested before
 * this hook mounted are still surfaced.
 */
export function useProfileApprovalToasts(profileService: IProfileService | null) {
    const shownURIs = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!profileService) return
        shownURIs.current = new Set<string>()

        const showPending = () => {
            const blocked = profileTrustSettings.getState().blocked
            for (const uri of profileService.getPendingApprovalURIs()) {
                if (blocked.includes(uri)) continue
                if (shownURIs.current.has(uri)) continue
                shownURIs.current.add(uri)
                showProfileApprovalToast(profileService, uri)
            }
        }

        showPending()
        const remove = profileService.events.addEventListener("profile-approval-required", () => {
            showPending()
        })
        const removeTrustSettings = profileTrustSettings.subscribe(() => {
            profileService.setProfileURIs(profileService.getProfileURIs()).then()
        })
        return () => {
            remove()
            removeTrustSettings()
        }
    }, [profileService])
}
