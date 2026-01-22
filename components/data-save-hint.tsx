"use client"

import { useGlobalSettings } from "@/lib/state/global-settings"
import { useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"

/**
 * Hint that is shown to the user some time after starting to use novacrate. Informs the user that their data is only saved locally and they have to keep it safe themselves.
 * @constructor
 */
export function DataSaveHint() {
    const acceptedDataSaveHint = useGlobalSettings((s) => s.acceptedDataSaveHint)
    const setAcceptedDataSaveHint = useGlobalSettings((s) => s.setAcceptedDataSaveHint)
    const isShowingHint = useRef(false)

    const showHint = useCallback(() => {
        if (isShowingHint.current) return

        isShowingHint.current = true
        toast.warning(<div>Disclaimer - Please note</div>, {
            description:
                "All data is stored exclusively on your local device and is not transmitted to any external servers - you are solely responsible for creating regular backups and keeping your data safe, as we have no access to your information and cannot recover it in case of device loss or technical issues.",
            dismissible: false,
            duration: Infinity,
            action: {
                label: "Understood",
                onClick: () => {
                    setAcceptedDataSaveHint(Date.now())
                }
            }
        })
    }, [setAcceptedDataSaveHint])

    useEffect(() => {
        if (!acceptedDataSaveHint) {
            const timer = window.setTimeout(showHint, 1000 * 60 /*1min*/)

            return () => window.clearTimeout(timer)
        }
    }, [acceptedDataSaveHint, showHint])

    return null
}
