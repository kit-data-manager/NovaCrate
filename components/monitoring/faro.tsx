"use client"

import {
    ErrorsInstrumentation,
    faro,
    getWebInstrumentations,
    initializeFaro,
    SessionInstrumentation,
    WebVitalsInstrumentation
} from "@grafana/faro-web-sdk"
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
            initializeFaro({
                url: "https://monitoring.datamanager.kit.edu/faro-receiver/collect", // process.env.NEXT_PUBLIC_FARO_URL,
                app: {
                    name: "novacrate:webjs",
                    namespace: "novacrate",
                    version: packageJson.version,
                    environment: process.env.NODE_ENV
                },

                instrumentations: [
                    // Mandatory, omits default instrumentations otherwise.
                    ...getWebInstrumentations(),

                    // Tracing package to get end-to-end visibility for HTTP requests.
                    new TracingInstrumentation(),
                    new ErrorsInstrumentation(),
                    new WebVitalsInstrumentation(),
                    new SessionInstrumentation()
                ]
            })
        } catch (e) {
            console.log("Faro failed:", e)
        }
    }, [])

    return null
}
