import { NextRequest, NextResponse } from "next/server"

const isORCID = (identifier: string) => {
    return identifier.length > 0 && /^https:\/\/orcid.org\/(\d{4}-){3}\d{3}(\d|X)$/.test(identifier)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    if ("url" in body && typeof body.url === "string" && isORCID(body.url)) {
        try {
            const orcidResponse = await fetch(body.url, {
                headers: { Accept: "application/ld+json" }
            })
            if (!orcidResponse.ok) {
                return new NextResponse(undefined, { status: 404 })
            }
            const parsed = await orcidResponse.json()
            return NextResponse.json(parsed)
        } catch (e) {
            console.log(`ORCID proxy failed with error: ${e}`)
            return new NextResponse(undefined, { status: 400 })
        }
    } else {
        console.log(`Not a valid ORCID-URL in body`)
        return new NextResponse(undefined, { status: 400 })
    }
}
