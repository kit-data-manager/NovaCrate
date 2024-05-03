declare type CrateVerifyWorkerOperations =
    | "getPropertyRange"
    | "getPropertyComment"
    | "getEntityPossibleProperties"
    | "getAllComments"
    | "getAllClasses"
    | "getAllProperties"

declare interface CrateVerifyWorkerCommand {
    operation: CrateVerifyWorkerOperations
    propertyId?: string
    types?: string[]
    crateId?: string
    nonce: string
}
