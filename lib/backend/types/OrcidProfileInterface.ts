export interface OrcidProfile {
    "orcid-identifier": OrcidIdentifier
    preferences: Preferences
    history: History
    person: Person
    "activities-summary": ActivitiesSummary
    path: string
}

interface OrcidIdentifier {
    uri: string
    path: string
    host: string
}

interface Preferences {
    locale: string
}

interface History {
    "creation-method": string
    "completion-date": string | null
    "submission-date": DateValue
    "last-modified-date": DateValue
    claimed: boolean
    source: null
    "deactivation-date": string | null
    "verified-email": boolean
    "verified-primary-email": boolean
}

interface DateValue {
    value: number
}

interface Person {
    "last-modified-date": DateValue | null
    name: Name
    "other-names": OtherNames
    biography: null
    "researcher-urls": ResearcherUrls
    emails: Emails
    addresses: Addresses
    keywords: Keywords
    "external-identifiers": ExternalIdentifiers
    path: string
}

interface Name {
    "created-date": DateValue
    "last-modified-date": DateValue
    "given-names": ValueObject
    "family-name": ValueObject
    "credit-name": null
    source: null
    visibility: string
    path: string
}

interface ValueObject {
    value: string
}

interface OtherNames {
    "last-modified-date": DateValue | null
    "other-name": any[]
    path: string
}

interface ResearcherUrls {
    "last-modified-date": DateValue | null
    "researcher-url": any[]
    path: string
}

interface Emails {
    "last-modified-date": DateValue | null
    email: any[]
    path: string
}

interface Addresses {
    "last-modified-date": DateValue | null
    address: any[]
    path: string
}

interface Keywords {
    "last-modified-date": DateValue | null
    keyword: any[]
    path: string
}

interface ExternalIdentifiers {
    "last-modified-date": DateValue | null
    "external-identifier": any[]
    path: string
}

interface ActivitiesSummary {
    "last-modified-date": DateValue
    distinctions: AffiliationSection
    educations: AffiliationSection
    employments: EmploymentsSection
    fundings: GroupSection
    "invited-positions": AffiliationSection
    memberships: AffiliationSection
    "peer-reviews": GroupSection
    qualifications: AffiliationSection
    "research-resources": GroupSection
    services: AffiliationSection
    works: WorksSection
    path: string
}

interface AffiliationSection {
    "last-modified-date": DateValue | null
    "affiliation-group": AffiliationGroup[]
    path: string
}

interface EmploymentsSection {
    "last-modified-date": DateValue | null
    "affiliation-group": EmploymentAffiliationGroup[]
    path: string
}

interface AffiliationGroup {
    "last-modified-date": DateValue
    "external-ids": ExternalIds
    summaries: any[]
}

interface EmploymentAffiliationGroup {
    "last-modified-date": DateValue
    "external-ids": ExternalIds
    summaries: EmploymentSummaryWrapper[]
}

interface EmploymentSummaryWrapper {
    "employment-summary": EmploymentSummary
}

interface EmploymentSummary {
    "created-date": DateValue
    "last-modified-date": DateValue
    source: Source
    "put-code": number
    "department-name": string
    "role-title": string
    "start-date": PartialDate
    "end-date": PartialDate | null
    organization: Organization
    url: string | null
    "external-ids": ExternalIds | null
    "display-index": string
    visibility: string
    path: string
}

interface Source {
    "source-orcid": OrcidIdentifier | null
    "source-client-id": ClientId | null
    "source-name": ValueObject
    "assertion-origin-orcid": null
    "assertion-origin-client-id": null
    "assertion-origin-name": null
}

interface ClientId {
    uri: string
    path: string
    host: string
}

interface PartialDate {
    year: ValueObject | null
    month: ValueObject | null
    day: ValueObject | null
}

interface Organization {
    name: string
    address: Address
    "disambiguated-organization": DisambiguatedOrganization
}

interface Address {
    city: string
    region: string | null
    country: string
}

interface DisambiguatedOrganization {
    "disambiguated-organization-identifier": string
    "disambiguation-source": string
}

interface ExternalIds {
    "external-id": ExternalId[]
}

interface ExternalId {
    "external-id-type": string
    "external-id-value": string
    "external-id-normalized": NormalizedValue
    "external-id-normalized-error": null
    "external-id-url": ValueObject
    "external-id-relationship": string
}

interface NormalizedValue {
    value: string
    transient: boolean
}

interface GroupSection {
    "last-modified-date": DateValue | null
    group: any[]
    path: string
}

interface WorksSection {
    "last-modified-date": DateValue
    group: WorkGroup[]
    path: string
}

interface WorkGroup {
    "last-modified-date": DateValue
    "external-ids": ExternalIds
    "work-summary": WorkSummary[]
}

interface WorkSummary {
    "put-code": number
    "created-date": DateValue
    "last-modified-date": DateValue
    source: Source
    title: Title
    "external-ids": ExternalIds
    url: ValueObject
    type: string
    "publication-date": PartialDate
    "journal-title": null
    visibility: string
    path: string
    "display-index": string
}

interface Title {
    title: ValueObject
    subtitle: null
    "translated-title": null
}
