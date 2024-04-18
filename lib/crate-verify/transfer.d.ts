declare type CrateVerifyWorkerOperations =
    | "getPropertyRange"
    | "getPropertyComment"
    | "getEntityPossibleProperties"

declare interface CrateVerifyWorkerCommand {
    operation: CrateVerifyWorkerOperations
    propertyId?: string
    types?: string[]
    crateId?: string
    nonce: string
}
