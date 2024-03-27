declare interface IReference {
    "@id": string
}

declare type CrateContext = string | Record<string, string>

declare type FlatEntityPropertyTypes = string | IReference | (string | IReference)[]
declare type FlatEntitySinglePropertyTypes = string | IReference

declare interface IFlatEntity extends Record<string, FlatEntityPropertyTypes> {
    "@id": string
    "@type": string | string[]
}
