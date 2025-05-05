import { useEditorState } from "@/lib/state/editor-state"
import { useMemo } from "react"
import {
    SCHEMA_ORG_CONTACT_POINT,
    SCHEMA_ORG_PLACE,
    SCHEMA_ORG_SCHOLARLY_ARTICLE
} from "@/lib/constants"
import { AlertDescription } from "@/components/ui/alert"
import { ExternalLink } from "lucide-react"
import { CollapsibleHint } from "@/components/collapsible-hint"

export function CreateEntityHint({ selectedType }: { selectedType: string }) {
    const context = useEditorState((store) => store.crateContext)

    const showPlaceHint = useMemo(() => {
        return context.resolve(selectedType) === SCHEMA_ORG_PLACE
    }, [context, selectedType])

    const showScholarlyArticleHint = useMemo(() => {
        return context.resolve(selectedType) === SCHEMA_ORG_SCHOLARLY_ARTICLE
    }, [context, selectedType])

    const showContactPointHint = useMemo(() => {
        return context.resolve(selectedType) === SCHEMA_ORG_CONTACT_POINT
    }, [context, selectedType])

    return useMemo(() => {
        if (showPlaceHint) {
            return (
                <CollapsibleHint title={"Identifiers for Places"}>
                    <AlertDescription>
                        To uniquely identify a physical location, it is recommended to use the
                        unique location identifier from{" "}
                        <a
                            className="hover:underline inline-flex"
                            href="https://www.geonames.org/v3/"
                            target="_blank"
                        >
                            GeoNames.org <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        when creating a location.
                        <div className="mt-1 text-muted-foreground text-xs">
                            Example:{" "}
                            <a
                                className="hover:underline inline-flex"
                                href="https://geonames.org/7288147/"
                                target="_blank"
                            >
                                https://geonames.org/7288147/{" "}
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                            <br />
                            Please remove {"/<something>.html"} from the end of the URL
                        </div>
                    </AlertDescription>
                </CollapsibleHint>
            )
        }

        if (showScholarlyArticleHint) {
            return (
                <CollapsibleHint title={"Identifiers for Scholarly Articles"}>
                    <AlertDescription>
                        To uniquely identify scholarly articles, it is recommended to use their DOI.
                        They will typically be provided with the article.
                        <div className="mt-1 text-muted-foreground text-xs">
                            Example:{" "}
                            <a
                                className="hover:underline inline-flex"
                                href="https://doi.org/10.1080/10509585.2015.1092083"
                                target="_blank"
                            >
                                https://doi.org/10.1080/10509585.2015.1092083
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        </div>
                    </AlertDescription>
                </CollapsibleHint>
            )
        }

        if (showContactPointHint)
            return (
                <CollapsibleHint title={"Identifiers for Contact Information"}>
                    <AlertDescription>
                        Use the Email address as the identifier when possible, as seen in the
                        example.
                        <div className="mt-1 text-muted-foreground text-xs">
                            Example:{" "}
                            <a
                                className="hover:underline inline-flex"
                                href="mailto:example.person@example.org"
                                target="_blank"
                            >
                                mailto:example.person@example.org
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>{" "}
                            <br />
                            Adding the mailto: prefix makes it clear that this is an Email
                        </div>
                    </AlertDescription>
                </CollapsibleHint>
            )

        return null
    }, [showContactPointHint, showPlaceHint, showScholarlyArticleHint])
}
