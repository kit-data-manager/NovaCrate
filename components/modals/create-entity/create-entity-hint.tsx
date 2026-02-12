import { useEditorState } from "@/lib/state/editor-state"
import { useMemo } from "react"
import {
    SCHEMA_ORG_CONTACT_POINT,
    SCHEMA_ORG_ORGANIZATION,
    SCHEMA_ORG_PERSON,
    SCHEMA_ORG_PLACE,
    SCHEMA_ORG_SCHOLARLY_ARTICLE
} from "@/lib/constants"
import { AlertDescription } from "@/components/ui/alert"
import { ExternalLink } from "lucide-react"
import { CollapsibleHint } from "@/components/collapsible-hint"

export function CreateEntityHint({ selectedType }: { selectedType: string }) {
    const context = useEditorState((store) => store.crateContext)

    const showPersonHint = useMemo(() => {
        return context.resolve(selectedType) === SCHEMA_ORG_PERSON
    }, [context, selectedType])

    const showOrganizationHint = useMemo(() => {
        return context.resolve(selectedType) === SCHEMA_ORG_ORGANIZATION
    }, [context, selectedType])

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
        if (showPersonHint)
            return (
                <CollapsibleHint title={"Identifiers for Person Entities"}>
                    <AlertDescription>
                        Use the persons{" "}
                        <a
                            className="hover:underline inline-flex"
                            href="https://orcid.org/"
                            target="_blank"
                        >
                            ORCID <ExternalLink className="w-3 h-3 ml-1" />
                        </a>{" "}
                        to uniquely identify them. If they don&#39;t have an ORCID, consider using a
                        different persistent and unique identifier, or use a local identifier like
                        #firstname-lastname.
                        <div className="mt-1 text-muted-foreground text-xs">
                            Example:{" "}
                            <a
                                className="hover:underline inline-flex"
                                href="https://orcid.org/0009-0003-2196-9187"
                                target="_blank"
                            >
                                https://orcid.org/0009-0003-2196-9187{" "}
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        </div>
                    </AlertDescription>
                </CollapsibleHint>
            )

        if (showOrganizationHint)
            return (
                <CollapsibleHint title={"Identifiers for Organization Entities"}>
                    <AlertDescription>
                        Use the organizations{" "}
                        <a
                            className="hover:underline inline-flex"
                            href="https://ror.org/"
                            target="_blank"
                        >
                            ROR <ExternalLink className="w-3 h-3 ml-1" />
                        </a>{" "}
                        ID to uniquely identify it. Otherwise, consider using a different persistent
                        and unique identifier, or use a local identifier like #organizationname.
                        <div className="mt-1 text-muted-foreground text-xs">
                            Example:{" "}
                            <a
                                className="hover:underline inline-flex"
                                href="https://ror.org/04t3en479"
                                target="_blank"
                            >
                                https://ror.org/04t3en479 <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        </div>
                    </AlertDescription>
                </CollapsibleHint>
            )

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
                        .
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
    }, [
        showContactPointHint,
        showOrganizationHint,
        showPersonHint,
        showPlaceHint,
        showScholarlyArticleHint
    ])
}
