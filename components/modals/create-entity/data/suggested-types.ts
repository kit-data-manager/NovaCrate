/**
 * Static "suggestion" entries shown on the simple type-select page.
 * These are the curated, commonly-used entity types offered to the user
 * independently of any profile definitions. Profile-defined entity rules are
 * rendered separately by {@link ProfileTypeSection}.
 */
export type SuggestedType = {
    type: string | string[]
    name?: string
    description: string
}

export const SUGGESTED_DATA_ENTITIES: SuggestedType[] = [
    {
        type: "File",
        name: "File",
        description: "Import a new single file into the Crate and create a data entity for it"
    },
    {
        type: "Dataset",
        name: "Folder",
        description:
            "Import a folder, including the contained files into the Crate and create data entities for it"
    }
]

export const SUGGESTED_CONTEXTUAL_ENTITIES: SuggestedType[] = [
    {
        type: "Person",
        description: "Use this contextual entity to describe a person (alive, dead, undead, or fictional). "
    },
    {
        type: "Organization",
        description: "An organization such as a school, NGO, corporation, club, etc."
    },
    {
        type: "Place",
        description: "Describes a (more or less fixed) physical location."
    },
    {
        type: "ScholarlyArticle",
        name: "Scholarly Article",
        description: "A scholarly article that is referenced/used but not included in the Crate"
    },
    {
        type: "CreativeWork",
        name: "Creative Work",
        description:
            "The most generic kind of creative work, including books, movies, photographs, software programs, etc."
    },
    {
        type: "ContactPoint",
        name: "Contact Information",
        description:
            "A contact point — for example, contact information for a person or a Customer Complaints department."
    }
]
