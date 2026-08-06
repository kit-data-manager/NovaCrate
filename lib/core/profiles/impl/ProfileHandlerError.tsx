export class ProfileHandlerError extends Error {
    readonly profileUri: string
    readonly handlerName?: string

    constructor(
        text: string,
        details: {
            profileUri: string
            cause?: unknown
            handlerName?: string
        }
    ) {
        super(text, { cause: details.cause })
        this.profileUri = details.profileUri
        this.handlerName = details.handlerName
    }
}
