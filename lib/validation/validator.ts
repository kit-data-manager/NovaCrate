import { ValidationResult } from "@/lib/validation/validation-result"
import { StoreApi, UseBoundStore } from "zustand"
import { EditorState } from "@/lib/state/editor-state"
import { ISchemaWorkerContext } from "@/components/providers/schema-worker-provider"

export type ValidatorContext = {
    editorState: UseBoundStore<StoreApi<EditorState>>
    schemaWorker: ISchemaWorkerContext
}

export abstract class Validator {
    abstract name: string

    constructor(protected context: ValidatorContext) {}

    abstract validateCrate(crate: ICrate): Promise<ValidationResult[]>
    abstract validateEntity(entity: IEntity): Promise<ValidationResult[]>
    abstract validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]>
}
