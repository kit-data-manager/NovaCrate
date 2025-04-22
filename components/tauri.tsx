"use client"

import { useCallback, useEffect } from "react"

export default function TauriAutoShow() {
    const show = useCallback(async () => {
        if ("__TAURI__" in window && window.__TAURI__) {
            ;(await import("@tauri-apps/api/window")).appWindow.show().then()
        }
    }, [])

    useEffect(() => {
        setTimeout(show, 300)
    }, [show])

    return null
}
