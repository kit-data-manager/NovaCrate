import { ValidationResultWithoutTrace } from "@/lib/validation/validation-result"
import { EditorState } from "@/lib/state/editor-state"
import { ISchemaWorkerContext } from "@/components/providers/schema-worker-provider"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { IContextResolverService } from "@/lib/core/IContextResolverService"
import { IContextService } from "@/lib/core/IContextService"
import { IProfileService } from "@/lib/core/profiles/IProfileService"

export type ValidatorContext = {
    editorState: EditorState
    fileService?: IFileService
    profileService: IProfileService
    schemaWorker: ISchemaWorkerContext
    /** Resolver for translating between short-form term names and full URIs. */
    resolver: IContextResolverService
    /** Provides access to raw crate context */
    context: IContextService
}

export abstract class Validator {
    abstract name: string

    constructor(private context: ValidatorContext) {}

    updateContext(ctx: ValidatorContext) {
        this.context = ctx
    }

    getContext() {
        return this.context
    }

    abstract validateCrate(crate: ICrate): Promise<ValidationResultWithoutTrace[]>
    abstract validateEntity(entity: IEntity): Promise<ValidationResultWithoutTrace[]>
    abstract validateProperty(
        entity: IEntity,
        propertyName: string
    ): Promise<ValidationResultWithoutTrace[]>
}
