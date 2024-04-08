declare type CrateVerifyWorkerOperations = "getPropertyRange" | "getPropertyComment"

declare interface CrateVerifyWorkerCommand {
    operation: CrateVerifyWorkerOperations
    propertyId?: string
    crateId?: string
    nonce: string
}
