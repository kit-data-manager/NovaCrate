"use client"

import { faro, getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk"
import { TracingInstrumentation } from "@grafana/faro-web-tracing"
import packageJson from "../../package.json"
import { useEffect } from "react"

export default function FaroMonitoring() {
    useEffect(() => {
        // skip if already initialized
        if (faro.api) {
            return
        }

        try {
            const faro = initializeFaro({
                url: "https://monitoring.datamanager.kit.edu/faro-receiver/collect", // process.env.NEXT_PUBLIC_FARO_URL,
                app: {
                    name: process.env.NEXT_PUBLIC_FARO_APP_NAME || "unknown_service:webjs",
                    namespace: process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE || undefined,
                    version: packageJson.version,
                    environment: process.env.NODE_ENV
                },

                instrumentations: [
                    // Mandatory, omits default instrumentations otherwise.
                    ...getWebInstrumentations(),

                    // Tracing package to get end-to-end visibility for HTTP requests.
                    new TracingInstrumentation()
                ]
            })
        } catch (e) {
            console.log("Faro failed:", e)
        }
    }, [])

    return null
}
