import path from "node:path"
import { readFile } from "node:fs/promises"

// This API route is compiled to static markdown, so the CHANGELOG.md file is only read once at build time.
export const dynamic = "force-static"

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "CHANGELOG.md")
        const content = await readFile(filePath, "utf-8")

        return new Response(content, {
            headers: {
                "Content-Type": "text/markdown"
            }
        })
    } catch (error) {
        return new Response("Changelog not found", { status: 404 })
    }
}
