import { RorRecord } from "@/lib/backend/types/RorRecordInterface"
import { OrcidProfile } from "@/lib/backend/types/OrcidProfileInterface"

/**
 * Attempts to fetch information on the given ORCID from the ORCID API, returning an entity containing selected information
 * @param url Either an ORCID URL or an ORCID identifier
 */
export async function importPersonFromOrcid(url: string): Promise<IEntity> {
    const orcid = extractOrcidIdentifier(url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
        const req = await fetch(`https://pub.orcid.org/v3.0/${orcid}`, {
            headers: {
                Accept: "application/vnd.orcid+json"
            },
            signal: controller.signal
        })
        if (req.ok) {
            const json = (await req.json()) as OrcidProfile

            const givenName = json.person?.name?.["given-names"]?.value
            const familyName = json.person?.name?.["family-name"]?.value
            const name = [givenName, familyName].filter(Boolean).join(" ")

            return {
                "@id": "https://orcid.org/" + orcid,
                "@type": "Person",
                name: name || []
            }
        } else {
            throw new Error(`Could not fetch ORCID profile (${req.status})`)
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Attempts to fetch information on the given ROR from the ROR API, returning an entity containing selected information
 * @param url Either a ROR URL or a ROR identifier
 */
export async function importOrganizationFromRor(url: string): Promise<IEntity> {
    const ror = extractRorIdentifier(url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
        const req = await fetch(`https://api.ror.org/v2/organizations/${ror}`, {
            headers: {
                Accept: "application/json"
            },
            signal: controller.signal
        })
        if (req.ok) {
            const json = (await req.json()) as RorRecord

            const name =
                json.names.find((n) => n.types.includes("ror_display") || n.types.includes("label"))
                    ?.value ??
                json.names[0]?.value ??
                json.id

            return {
                "@id": json.id,
                "@type": "Organization",
                name: name,
                url: json.links.find((l) => l.type === "website")?.value ?? json.id
            }
        } else {
            throw new Error(`Could not fetch ROR organization (${req.status})`)
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Extracts the ORCID identifier from a URL or returns the identifier if already provided.
 * @param input - Either an ORCID URL (e.g., "https://orcid.org/0009-0003-2196-9187")
 *                or an ORCID identifier (e.g., "0009-0003-2196-9187")
 * @returns The ORCID identifier
 * @throws Error if no valid ORCID identifier is found
 */
export function extractOrcidIdentifier(input: string): string {
    // Remove leading/trailing whitespace
    const trimmed = input.trim()

    // ORCID identifier pattern: XXXX-XXXX-XXXX-XXXX (where X is a digit, last char can be X)
    const orcidPattern = /\d{4}-\d{4}-\d{4}-\d{3}[\dX]/

    // Try to match the pattern in the input string
    const match = trimmed.match(orcidPattern)

    if (match) {
        return match[0]
    }

    throw new Error(`No valid ORCID identifier found in: "${input}"`)
}

/**
 * Extracts the ROR identifier from a URL or returns the identifier if already provided.
 * @param input - Either a ROR URL (e.g., "https://ror.org/04t3en479")
 *                or a ROR identifier (e.g., "04t3en479")
 * @returns The ROR identifier
 * @throws Error if no valid ROR identifier is found
 */
export function extractRorIdentifier(input: string): string {
    // Remove leading/trailing whitespace
    const trimmed = input.trim()

    // ROR identifier pattern: 0 followed by alphanumeric characters (9 characters total)
    const rorPattern = /0[a-hj-km-np-tv-z0-9]{6}[0-9]{2}/

    // Try to match the pattern in the input string
    const match = trimmed.match(rorPattern)

    if (match) {
        return match[0]
    }

    throw new Error(`No valid ROR identifier found in: "${input}"`)
}
