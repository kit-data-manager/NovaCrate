import JSZip from "jszip"
import { CrateSchema } from "@/lib/utils"
import { getRootEntityID } from "@/lib/utils"
import { InMemoryReadOnlyFileService } from "@/lib/core/profiles/impl/InMemoryReadOnlyFileService"
import { ProfileHandlerError } from "@/lib/core/profiles/impl/ProfileHandlerError"

/**
 * Result of resolving a crate. `metadata` is the parsed RO-Crate Metadata Document
 * and `fileService` exposes the crate's contents (extracted from an archive when applicable).
 */
export type ResolvedCrate = {
    metadata: ICrate
    fileService: InMemoryReadOnlyFileService
}

const RO_CRATE_PROFILE = "https://w3id.org/ro/crate"
const METADATA_FILE = "ro-crate-metadata.json"
const ACCEPT_HEADER = "application/ld+json;profile=https://w3id.org/ro/crate"

export type CrateResolverOptions = {
    /** Abort the resolution. */
    signal?: AbortSignal
}

/**
 * General-purpose RO-Crate resolver. Implements the retrieval approach recommended by the
 * RO-Crate specification:
 *
 * 1. Follow HTTP redirects (handled by `fetch` with `redirect: "follow"`) and look for
 *    Signposting `Link` headers (`rel="describedby"` for a metadata document or `rel="item"`
 *    for a distribution archive), preferring links with `profile="https://w3id.org/ro/crate"`.
 * 2. HTTP content-negotiation for the RO-Crate media type (`Accept: application/ld+json;profile=https://w3id.org/ro/crate`).
 * 3. Heuristic fallback: try resolving `./ro-crate-metadata.json` from the resolved URI.
 *
 * When a ZIP archive is returned, `ro-crate-metadata.json` is extracted (handling the ELN
 * single-folder convention). BagIt archives are not supported by this implementation.
 *
 * The resolver is metadata-agnostic and does not depend on the profile system; the
 * {@link ProfileFactory} uses it to fetch profile crates by URI.
 */
export class CrateResolver {
    constructor(private options: CrateResolverOptions = {}) {}

    /**
     * Resolve the given URI to an RO-Crate. Returns the parsed metadata document and a
     * read-only file service exposing the crate's contents (when retrieved as an archive).
     *
     * @param uri Permalink or direct URI of the RO-Crate.
     * @throws {ProfileHandlerError} when the crate cannot be resolved or is invalid.
     */
    async resolveCrate(uri: string): Promise<ResolvedCrate> {
        const fromSignposting = await this.trySignposting(uri)
        if (fromSignposting) return fromSignposting

        const fromNegotiation = await this.tryContentNegotiation(uri)
        if (fromNegotiation) return fromNegotiation

        const fromHeuristic = await this.tryHeuristicFallback(uri)
        if (fromHeuristic) return fromHeuristic

        throw new ProfileHandlerError(`Could not resolve an RO-Crate from URI: ${uri}`, {
            profileUri: uri
        })
    }

    private async trySignposting(uri: string): Promise<ResolvedCrate | undefined> {
        let response: Response
        try {
            response = await fetch(uri, {
                method: "GET",
                redirect: "follow",
                signal: this.options.signal
            })
        } catch (e) {
            throw new ProfileHandlerError(`Signposting request failed for ${uri}`, {
                cause: e,
                profileUri: uri
            })
        }

        if (!response.ok) {
            return undefined
        }

        const target = this.pickLinkTarget(response)
        if (target) {
            return this.fetchTarget(target)
        }

        // No usable link header — try interpreting the response body directly.
        // Lenient: if the body is not a valid crate (e.g. an HTML landing page), fall through
        // to content-negotiation and the heuristic fallback.
        return this.responseToCrate(response, uri, true)
    }

    private async tryContentNegotiation(uri: string): Promise<ResolvedCrate | undefined> {
        let response: Response
        try {
            response = await fetch(uri, {
                method: "GET",
                headers: { Accept: ACCEPT_HEADER },
                redirect: "follow",
                signal: this.options.signal
            })
        } catch (e) {
            throw new ProfileHandlerError(`Content-negotiation request failed for ${uri}`, {
                cause: e,
                profileUri: uri
            })
        }

        if (!response.ok) {
            return undefined
        }

        const contentType = (response.headers.get("Content-Type") ?? "").toLowerCase()
        const hasCrateProfile = this.responseDeclaresCrateProfile(response)

        // DataCite and similar PID providers may return their own JSON-LD, ignoring the
        // profile parameter. Only trust the body when it actually declares the RO-Crate profile
        // (via Content-Type profile, a Link header, or a body that parses as an RO-Crate).
        if (!hasCrateProfile && !contentType.includes("zip")) {
            const body = await this.responseToCrate(response, uri, true)
            if (body) return body
            return undefined
        }

        return this.responseToCrate(response, uri)
    }

    private async tryHeuristicFallback(uri: string): Promise<ResolvedCrate | undefined> {
        const base = uri.split("?")[0].split("#")[0]
        const candidate = base.endsWith("/")
            ? base + METADATA_FILE
            : base.replace(/\/[^/]*$/, "/") + METADATA_FILE

        let response: Response
        try {
            response = await fetch(candidate, {
                method: "GET",
                redirect: "follow",
                signal: this.options.signal
            })
        } catch {
            return undefined
        }

        if (!response.ok) {
            return undefined
        }

        return this.responseToCrate(response, candidate)
    }

    private async fetchTarget(target: string): Promise<ResolvedCrate> {
        let response: Response
        try {
            response = await fetch(target, {
                method: "GET",
                redirect: "follow",
                signal: this.options.signal
            })
        } catch (e) {
            throw new ProfileHandlerError(`Failed to fetch resolved RO-Crate target ${target}`, {
                cause: e,
                profileUri: target
            })
        }

        if (!response.ok) {
            throw new ProfileHandlerError(
                `Resolved RO-Crate target returned status ${response.status}: ${target}`,
                { profileUri: target }
            )
        }

        const result = await this.responseToCrate(response, target)
        if (!result) {
            throw new ProfileHandlerError(`Resolved target did not yield an RO-Crate: ${target}`, {
                profileUri: target
            })
        }
        return result
    }

    private async responseToCrate(
        response: Response,
        sourceUrl: string,
        lenient = false
    ): Promise<ResolvedCrate | undefined> {
        const contentType = (response.headers.get("Content-Type") ?? "").toLowerCase()

        if (contentType.includes("zip") || contentType.includes("octet-stream")) {
            const arrayBuffer = await response.arrayBuffer()
            try {
                return await this.extractZip(arrayBuffer, sourceUrl)
            } catch (e) {
                if (lenient) return undefined
                throw e
            }
        }

        // Try as JSON-LD metadata document.
        const text = await response.text()
        let parsed: unknown
        try {
            parsed = JSON.parse(text)
        } catch {
            if (lenient) return undefined
            throw new ProfileHandlerError(`Resolved document is not valid JSON: ${sourceUrl}`, {
                profileUri: sourceUrl
            })
        }

        const result = CrateSchema.safeParse(parsed)
        if (!result.success) {
            if (lenient) return undefined
            throw new ProfileHandlerError(
                `Resolved document is not a valid RO-Crate: ${sourceUrl}`,
                { cause: result.error, profileUri: sourceUrl }
            )
        }

        if (!this.hasRootDataEntity(result.data)) {
            if (lenient) return undefined
            throw new ProfileHandlerError(
                `Resolved document has no Root Data Entity: ${sourceUrl}`,
                { profileUri: sourceUrl }
            )
        }

        return {
            metadata: result.data,
            fileService: new InMemoryReadOnlyFileService([])
        }
    }

    private async extractZip(arrayBuffer: ArrayBuffer, sourceUrl: string): Promise<ResolvedCrate> {
        const zip = await JSZip.loadAsync(arrayBuffer)
        const entries: { path: string; content: Blob }[] = []
        const filePaths: string[] = []

        for (const file of Object.values(zip.files)) {
            if (file.dir) continue
            const blob = await file.async("blob")
            entries.push({ path: file.name, content: blob })
            filePaths.push(file.name)
        }

        let metadataEntry = zip.file(METADATA_FILE)
        let prefix = ""

        if (!metadataEntry) {
            // ELN-style single root folder: <folder>/ro-crate-metadata.json
            const folders = new Set<string>()
            for (const name of filePaths) {
                const slash = name.indexOf("/")
                if (slash > 0) folders.add(name.slice(0, slash))
            }
            for (const folder of folders) {
                const candidate = zip.file(`${folder}/${METADATA_FILE}`)
                if (candidate) {
                    metadataEntry = candidate
                    prefix = `${folder}/`
                    break
                }
            }
        }

        if (!metadataEntry) {
            throw new ProfileHandlerError(
                `ZIP archive does not contain ${METADATA_FILE}: ${sourceUrl}`,
                { profileUri: sourceUrl }
            )
        }

        const metadataText = await metadataEntry.async("string")
        let parsed: unknown
        try {
            parsed = JSON.parse(metadataText)
        } catch (e) {
            throw new ProfileHandlerError(
                `Extracted ${METADATA_FILE} is not valid JSON: ${sourceUrl}`,
                { cause: e, profileUri: sourceUrl }
            )
        }

        const result = CrateSchema.safeParse(parsed)
        if (!result.success) {
            throw new ProfileHandlerError(
                `Extracted ${METADATA_FILE} is not a valid RO-Crate: ${sourceUrl}`,
                { cause: result.error, profileUri: sourceUrl }
            )
        }

        if (!this.hasRootDataEntity(result.data)) {
            throw new ProfileHandlerError(
                `Extracted RO-Crate has no Root Data Entity: ${sourceUrl}`,
                { profileUri: sourceUrl }
            )
        }

        const stripped = entries
            .filter((e) => e.path.startsWith(prefix))
            .map((e) => ({
                path: e.path.slice(prefix.length),
                content: e.content
            }))

        return {
            metadata: result.data,
            fileService: new InMemoryReadOnlyFileService(stripped)
        }
    }

    private hasRootDataEntity(crate: ICrate): boolean {
        return getRootEntityID(crate["@graph"]) !== undefined
    }

    private responseDeclaresCrateProfile(response: Response): boolean {
        const contentType = (response.headers.get("Content-Type") ?? "").toLowerCase()
        if (contentType.includes(`profile=${RO_CRATE_PROFILE}`)) return true
        if (contentType.includes('profile="https://w3id.org/ro/crate"')) return true

        const links = parseLinkHeader(response.headers.get("Link") ?? "")
        return links.some((l) => l.params.profile === RO_CRATE_PROFILE)
    }

    private pickLinkTarget(response: Response): string | undefined {
        const links = parseLinkHeader(response.headers.get("Link") ?? "")
        const candidates = links.filter(
            (l) => l.rels.includes("describedby") || l.rels.includes("item")
        )
        if (candidates.length === 0) return undefined

        const withProfile = candidates.find((l) => l.params.profile === RO_CRATE_PROFILE)
        return (withProfile ?? candidates[0]).uri
    }
}

type ParsedLink = {
    uri: string
    rels: string[]
    params: Record<string, string>
}

/**
 * Minimal RFC 8288 `Link` header parser. Multiple headers may be joined by commas;
 * a single header may contain several comma-separated link values. Target URIs may be
 * quoted; parameters use `key="value"` or `key=value` form.
 */
export function parseLinkHeader(header: string): ParsedLink[] {
    const result: ParsedLink[] = []
    if (!header) return result

    const parts = splitLinkHeader(header)
    for (const part of parts) {
        const match = part.match(/^\s*<([^>]*)>\s*(.*)$/)
        if (!match) continue
        const uri = match[1]
        const rest = match[2]
        const rels: string[] = []
        const params: Record<string, string> = {}

        for (const param of rest.split(";")) {
            const trimmed = param.trim()
            if (!trimmed) continue
            const eq = trimmed.indexOf("=")
            if (eq < 0) continue
            const key = trimmed.slice(0, eq).trim().toLowerCase()
            let value = trimmed.slice(eq + 1).trim()
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1)
            }
            if (key === "rel") {
                for (const r of value.split(/\s+/)) {
                    if (r) rels.push(r.toLowerCase())
                }
            } else {
                params[key] = value
            }
        }

        result.push({ uri, rels, params })
    }

    return result
}

function splitLinkHeader(header: string): string[] {
    const parts: string[] = []
    let depth = 0
    let start = 0
    for (let i = 0; i < header.length; i++) {
        const ch = header[i]
        if (ch === "<") depth++
        else if (ch === ">") depth--
        else if (ch === "," && depth === 0) {
            parts.push(header.slice(start, i))
            start = i + 1
        }
    }
    parts.push(header.slice(start))
    return parts
}
