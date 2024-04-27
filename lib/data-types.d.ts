declare interface IReference {
    "@id": string
}

declare type CrateContextType =
    | string
    | Record<string, string>
    | (string | Record<string, string>)[]

declare type FlatEntityPropertyTypes = string | IReference | (string | IReference)[]
declare type FlatEntitySinglePropertyTypes = string | IReference

declare interface IFlatEntity extends Record<string, FlatEntityPropertyTypes> {
    "@id": string
    "@type": string | string[]
}

declare interface ICrate {
    "@context": CrateContextType
    "@graph": IFlatEntity[]
}
