/**
 * Represents a reference to another entity
 */
declare interface IReference {
    "@id": string
}

/**
 * Allowed context types for the @context field of the ro-crate-metadata.json
 */
declare type CrateContextType =
    | string
    | Record<string, string>
    | (string | Record<string, string>)[]

/**
 * Possible values of a property of an entity. Can be a string, a reference or an array containing both
 */
declare type EntityPropertyTypes = string | IReference | (string | IReference)[]

/**
 * Possible values of a single entry of a property of an entity. Can't be an array.
 */
declare type EntitySinglePropertyTypes = string | IReference

/**
 * Interface for a valid entity
 */
declare interface IEntity extends Record<string, EntityPropertyTypes> {
    "@id": string
    "@type": string | string[]
}

/**
 * Utility interface to capture an entity together with a corresponding file
 */
declare interface IEntityWithFile {
    entity: IEntity
    file: File
}

/**
 * Interface for a valid crate
 */
declare interface ICrate {
    "@context": CrateContextType
    "@graph": IEntity[]
}
