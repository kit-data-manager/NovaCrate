"use client"

import { Button } from "@/components/ui/button"
import { useCallback, useEffect, useRef, useState } from "react"
import { NovaCrateMessageIncoming, outgoingMessageSchema } from "@/lib/iframe-messages"
import { Input } from "@/components/ui/input"

const exampleCrate =
    '{"@context":"https://w3id.org/ro/crate/1.1/context","@graph":[{"@id":"./","@type":"Dataset","name":"Air quality measurements in Karlsruhe","description":"Ai measurements conducted in different places across Karlsruhe","datePublished":"2024","license":{"@id":"https://creativecommons.org/licenses/by/4.0/"},"hasPart":[{"@id":"map.pdf"},{"@id":"measurements/HVV%2520Anwesenheit%2520WiSe%25202526.pdf"}],"author":[{"@id":"creator"},{"@id":"#christopher%20raquet"}]},{"@type":"CreativeWork","@id":"ro-crate-metadata.json","conformsTo":{"@id":"https://w3id.org/ro/crate/1.1"},"about":{"@id":"./"}},{"@id":"map.pdf","@type":"File","name":"Map of measurements","description":"A map of all the location where the tests have been conducted","datePublished":"2021-10-22T00:00:00Z","encodingFormat":"application/pdf","author":{"@id":"creator"}},{"@id":"creator","@type":"Person","email":"john.doe@kit.edu","givenName":"John","familyName":"Doe","nationality":{"@id":"https://www.geonames.org/2921044"},"affiliation":{"@id":"https://www.geonames.org/7288147"}},{"@id":"https://creativecommons.org/licenses/by/4.0/","@type":"CreativeWork","name":"CC BY 4.0","description":"Creative Commons Attribution 4.0 International License"},{"@id":"https://www.geonames.org/2921044","@type":"Place","description":"Big country in central Europe."},{"@id":"#MeasurementCapture_23231","@type":"CreateAction","agent":{"@id":"creator"},"instrument":{"@id":"https://www.aeroqual.com/product/outdoor-portable-monitor-starter-kit"}},{"@id":"kit_location","@type":"Place","geo":{"@id":"#4241434-33413"}},{"@id":"#4241434-33413","@type":"GeoCoordinates","latitude":"49.00944","longitude":"8.41167"},{"@id":"https://www.geonames.org/7288147","@type":"Organization","name":"Karlsruher Institut fuer Technologie","url":"https://www.kit.edu/","location":{"@id":"kit_location"}},{"@id":"https://www.aeroqual.com/product/outdoor-portable-monitor-starter-kit","@type":"IndividualProduct","description":"The Outdoor Air Quality Test Kit (Starter) is for users who want an affordable set of tools to measure the common pollutants in ambient outdoor air."},{"@id":"measurements/HVV%2520Anwesenheit%2520WiSe%25202526.pdf","@type":"File","name":"HVV Anwesenheit WiSe 2526","contentSize":"225285","encodingFormat":"application/pdf"},{"name":"Christopher Raquet","@id":"#christopher%20raquet","@type":["Person"]}]}'

export default function IframeTestPage() {
    const [messageLog, setMessageLog] = useState<string[]>([])
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [metadataInput, setMetadataInput] = useState("")

    useEffect(() => {
        const listener = (e: MessageEvent) => {
            try {
                const msg = outgoingMessageSchema.parse(e.data)
                setMessageLog((m) => [...m, msg.type])
            } catch {}
        }

        window.addEventListener("message", listener)
        return () => window.removeEventListener("message", listener)
    }, [])

    const loadCrate = useCallback(() => {
        iframeRef.current?.contentWindow?.postMessage(
            {
                type: "LOAD_CRATE",
                target: "novacrate",
                metadata: metadataInput
            } satisfies NovaCrateMessageIncoming,
            "*"
        )
    }, [metadataInput])

    const updateCrate = useCallback(() => {
        iframeRef.current?.contentWindow?.postMessage(
            {
                type: "UPDATE_CRATE",
                target: "novacrate",
                metadata: metadataInput
            } satisfies NovaCrateMessageIncoming,
            "*"
        )
    }, [metadataInput])

    const getCrate = useCallback(() => {
        iframeRef.current?.contentWindow?.postMessage(
            {
                type: "GET_CRATE",
                target: "novacrate"
            } satisfies NovaCrateMessageIncoming,
            "*"
        )
    }, [])

    return (
        <div>
            <iframe
                style={{ border: "1px solid red" }}
                ref={iframeRef}
                src="/editor/iframe/entities"
                width="1200"
                height="800"
            />
            <div className="p-2 m-2 border rounded-lg">
                <Input
                    placeholder={"Metadata"}
                    id={"metadata-input"}
                    value={metadataInput}
                    onChange={(e) => setMetadataInput(e.target.value)}
                />
                <Button onClick={() => setMetadataInput(exampleCrate)}>Use Example Metadata</Button>
                <Button onClick={loadCrate}>Load Crate</Button>
                <Button onClick={updateCrate}>Update Crate</Button>
                <Button onClick={getCrate}>Get Crate</Button>
            </div>
            <div id={"received-messages"} className={"p-2 m-2 border rounded-lg"}>
                Received Messages:
                <div>
                    {messageLog.map((m, i) => (
                        <div key={i}>
                            {i}: {m}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
