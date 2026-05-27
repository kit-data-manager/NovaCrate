"use client"

import { useCallback, useState } from "react"
import { stepCountIs, streamText, tool } from "ai"
import { Button } from "@/components/ui/button"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { z } from "zod/mini"
import { LoaderCircle } from "lucide-react"

const API_KEY = "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"

const readEntityTool = tool({
    description: "Read the metadata of a specific entity",
    inputSchema: z.object({
        entityId: z.string()
    }),
    execute: async ({ entityId }) => {
        return { "@id": entityId, "@type": "File", author: "#christopher", license: "Apache-2.0" }
    }
})

const editEntityTool = tool({
    description: "Edit a specific metadata entity",
    inputSchema: z.object({
        entityId: z.string(),
        content: z.json()
    }),
    execute: async ({ entityId, content }) => {
        console.log("edit entity executed", entityId, content)
    }
})

export default function AIPage() {
    const [pastMessages, setPastMessages] = useState<string[]>([])
    const [response, setResponse] = useState("")
    const [running, setRunning] = useState(false)

    const run = useCallback(async () => {
        const openRouter = createOpenRouter({
            apiKey: API_KEY
        })

        const result = streamText({
            model: openRouter("nvidia/nemotron-3-super-120b-a12b:free"),
            prompt: "Make sure to use the readEntityTool to read the metadata of a specific entity. Then use the editEntityTool to edit the metadata of that entity. Your task is: Read the metadata of the entity with the ID 'myFile.json'. THEN, use the editEntityTool and pass it an ALMOST UNCHANGED version, but only change the license key to 'MIT'",
            tools: {
                readEntityTool,
                editEntityTool
            },
            stopWhen: stepCountIs(10)
        })

        let response = ""

        for await (const part of result.fullStream) {
            console.log(part)
            switch (part.type) {
                case "start":
                    setRunning(true)
                    break
                case "finish":
                    setRunning(false)
                    break
                case "text-start":
                    setResponse("")
                    response = ""
                    break
                case "text-delta":
                    setResponse((r) => r + part.text)
                    response += part.text
                    break
                case "text-end":
                    setPastMessages((p) => [...p, response])
                    setResponse("")
                    break
                default:
                    setPastMessages((p) => [...p, `[${part.type}]\n`])
            }
        }
    }, [])

    return (
        <div>
            <Button onClick={run}>Start</Button>
            {running && (
                <div>
                    <LoaderCircle className="size-4 animate-spin" />
                </div>
            )}
            {pastMessages.map((m, i) => (
                <pre key={i}>{m}</pre>
            ))}
            <pre>{response}</pre>
        </div>
    )
}
