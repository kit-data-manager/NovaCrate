import { ValidationResult } from "@/lib/validation/validation-result"
import { StoreApi, UseBoundStore } from "zustand"
import { EditorState } from "@/lib/state/editor-state"
import { ISchemaWorkerContext } from "@/components/providers/schema-worker-provider"
import { ICrateDataProvider } from "@/components/providers/crate-data-provider"

export type ValidatorContext = {
    editorState: UseBoundStore<StoreApi<EditorState>>
    serviceProvider?: CrateServiceAdapter
    crateData: ICrateDataProvider
    schemaWorker: ISchemaWorkerContext
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

    abstract validateCrate(crate: ICrate): Promise<ValidationResult[]>
    abstract validateEntity(entity: IEntity): Promise<ValidationResult[]>
    abstract validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]>
}
