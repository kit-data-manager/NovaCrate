export const SCHEMA_ORG_TIME = "https://schema.org/Time"
export const SCHEMA_ORG_DATE_TIME = "https://schema.org/DateTime"
export const SCHEMA_ORG_DATE = "https://schema.org/Date"
export const SCHEMA_ORG_BOOLEAN = "https://schema.org/Boolean"
export const SCHEMA_ORG_NUMBER = "https://schema.org/Number"
// Special Number DataTypes that will be treated as simple numbers (for now / forever)
export const SCHEMA_ORG_NUMBERLIKE = ["https://schema.org/Integer", "https://schema.org/Float"]
export const SCHEMA_ORG_TEXT = "https://schema.org/Text"
// Special Text DataTypes that will be treated as simple text (for now / forever)
export const SCHEMA_ORG_TEXTLIKE = [
    "https://schema.org/CssSelectorType",
    "https://schema.org/PronounceableText",
    "https://schema.org/URL",
    "https://schema.org/XPathType"
]

export const SCHEMA_ORG_PERSON = "https://schema.org/Person"
export const SCHEMA_ORG_ORGANIZATION = "https://schema.org/Organization"
export const SCHEMA_ORG_PLACE = "https://schema.org/Place"
export const SCHEMA_ORG_SCHOLARLY_ARTICLE = "https://schema.org/ScholarlyArticle"
export const SCHEMA_ORG_CREATIVE_WORK = "https://schema.org/CreativeWork"
export const SCHEMA_ORG_CONTACT_POINT = "https://schema.org/ContactPoint"

export const RO_CRATE_DATASET = "https://schema.org/Dataset"
export const RO_CRATE_FILE = "https://schema.org/MediaObject"

export const COMMON_PROPERTIES = [
    SCHEMA_ORG_PERSON,
    SCHEMA_ORG_ORGANIZATION,
    RO_CRATE_FILE,
    RO_CRATE_DATASET,
    SCHEMA_ORG_PLACE,
    SCHEMA_ORG_SCHOLARLY_ARTICLE,
    SCHEMA_ORG_CREATIVE_WORK,
    SCHEMA_ORG_CONTACT_POINT
]
