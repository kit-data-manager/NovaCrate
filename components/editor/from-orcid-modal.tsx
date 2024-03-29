import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ChangeEvent, useCallback, useEffect, useState } from "react"
import { LoaderCircle, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Error } from "@/components/error"

interface PreviewData {
    givenName: string
    familyName: string
    "@id": string
}

const isORCID = (identifier: string) => {
    return identifier.length > 0 && /^https:\/\/orcid.org\/(\d{4}-){3}\d{3}(\d|X)$/.test(identifier)
}

export function CreateFromORCIDModal({
    open,
    onEntityCreated,
    onOpenChange
}: {
    open: boolean
    onEntityCreated: (ref: Reference) => void
    onOpenChange: (open: boolean) => void
}) {
    const [url, setUrl] = useState("")
    const [previewData, setPreviewData] = useState<PreviewData | null>(null)
    const [fetchError, setFetchError] = useState("")
    const [loading, setLoading] = useState(false)

    const fetchPreview = useCallback(() => {
        setLoading(true)
        setFetchError("")
        const promise = fetch("/api/proxy/orcid", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: url })
        })

        promise
            .then((data) => {
                if (data.ok) {
                    data.json()
                        .then((parsed) => {
                            setPreviewData(parsed)
                            setFetchError("")
                        })
                        .catch((e) => {
                            setFetchError(e.toString())
                        })
                } else if (data.status === 404) {
                    setFetchError("Not Found")
                } else {
                    setFetchError("Request to ORCID failed")
                }
            })
            .catch((e) => {
                setFetchError(e.toString())
            })
            .finally(() => {
                setLoading(false)
            })
    }, [url])

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value)
        setPreviewData(null)
    }, [])

    useEffect(() => {
        if (isORCID(url)) {
            fetchPreview()
        } else if (isORCID("https://orcid.org/" + url)) {
            setUrl("https://orcid.org/" + url)
        }
    }, [fetchPreview, url])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Person from ORCID</DialogTitle>

                    <div className="pt-4">
                        <Input
                            value={url}
                            onChange={onChange}
                            placeholder="https://orcid.org/..."
                            className="mb-4"
                            disabled={loading}
                        />

                        <Error text={fetchError} />

                        {loading ? (
                            <div className="flex justify-center p-2">
                                <LoaderCircle className="w-6 h-6 animate-spin" />
                            </div>
                        ) : null}

                        {previewData ? (
                            <>
                                <div className="border rounded p-2 flex items-center">
                                    <User className="w-8 h-8 mr-2" />
                                    <div>
                                        <div>
                                            {previewData.givenName} {previewData.familyName}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {previewData["@id"]}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" /> Create
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
