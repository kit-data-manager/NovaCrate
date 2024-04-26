import { Context } from "@/lib/context"
import { AutoReference } from "@/components/global-modals-provider"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { Diff } from "@/components/crate-editor-provider"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export interface ICrateEditorContext {
    // rawCrateContext: CrateContext
    // crateContext: Context
    // setRawCrateContext(crateContext: CrateContext): void
    // revertContext(): void

    entities: Map<string, IFlatEntity>
    // entitiesChangelist: Map<string, Diff>
    // getEntity(id: string): IFlatEntity | undefined
    addEntity(
        entityId: string,
        types: string[],
        properties?: Record<string, FlatEntityPropertyTypes>,
        autoReference?: AutoReference
    ): boolean
    // addProperty(entityId: string, propertyName: string, value?: FlatEntityPropertyTypes): void
    // addPropertyEntry(entityId: string, propertyName: string, type: PropertyEditorTypes): void
    // modifyPropertyEntry(
    //     entityId: string,
    //     propertyName: string,
    //     valueIdx: number,
    //     value: FlatEntitySinglePropertyTypes
    // ): void
    // removePropertyEntry(entityId: string, propertyName: string, valueIdx: number): void
    // revertEntity(entityId: string): void
    //
    // canUndo: boolean
    // canRedo: boolean
    // undo(): void
    // redo(): void
    //
    // isSaving: boolean
    // saveError?: string
    // saveContext(): void
    // saveEntity(entityId: string): void
    // saveAllEntities(): void
    // revertAllEntities(): void
}

export const editorStateBase = create<ICrateEditorContext>()(
    immer<ICrateEditorContext>((setState, getState, store) => ({
        entities: new Map<string, IFlatEntity>(),
        addEntity(
            entityId: string,
            types: string[],
            properties?: Record<string, FlatEntityPropertyTypes>,
            autoReference?: AutoReference
        ): boolean {
            if (!getState().entities.has(entityId)) {
                setState((state) => {
                    state.entities.set(entityId, {
                        "@id": entityId,
                        "@type": types,
                        ...properties
                    })

                    if (autoReference) {
                        const target = state.entities.has(autoReference.entityId)[
                            autoReference.propertyName
                        ]
                    }
                })
            }
        }
    }))
)
