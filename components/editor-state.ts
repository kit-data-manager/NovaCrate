import { AutoReference } from "@/components/global-modals-provider"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { Draft } from "immer"
import { createSelectorHooks, ZustandHookSelectors } from "auto-zustand-selectors-hook"

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

function setPropertyValue(
    entity: Draft<IFlatEntity>,
    propertyName: string,
    valueIdx: number,
    value: FlatEntitySinglePropertyTypes
) {
    if (propertyName in entity) {
        const prop = entity[propertyName]
        if (Array.isArray(prop)) {
            prop[valueIdx] = value
        } else if (valueIdx > 0) {
            entity[propertyName] = [prop]
            ;(entity[propertyName] as FlatEntitySinglePropertyTypes[])[valueIdx] = value
        } else {
            entity[propertyName] = value
        }
    } else {
        entity[propertyName] = value
    }
}

const editorStateBase = create<ICrateEditorContext>()(
    immer<ICrateEditorContext>((setState, getState) => ({
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
                        const target = state.entities.get(autoReference.entityId)
                        if (target) {
                            setPropertyValue(
                                target,
                                autoReference.propertyName,
                                autoReference.valueIdx,
                                { "@id": entityId }
                            )
                        }
                    }
                })

                return true
            } else return false
        }
    }))
)

export const editorState = createSelectorHooks(editorStateBase) as typeof editorStateBase &
    ZustandHookSelectors<ICrateEditorContext>
