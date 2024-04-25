import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function isReference(value: FlatEntitySinglePropertyTypes): value is IReference {
    return typeof value === "object" && "@id" in value
}

export function toArray<T>(input: T | T[]): T[] {
    if (Array.isArray(input)) {
        return input
    } else {
        return [input]
    }
}

export function getEntityDisplayName(entity: IFlatEntity, fallback: boolean = true) {
    if (entity.name) {
        return toArray(entity.name)
            .map((s) => (typeof s === "string" ? s.trim() : s))
            .filter((p) => p)
            .join(", ")
    } else if (fallback) {
        if (entity["@id"] === "./") return "Crate Root"
        return entity["@id"]
    }

    return ""
}

export function isRootEntity(entity: IFlatEntity) {
    return entity["@id"] === "./"
}

export function isRoCrateMetadataEntity(entity: IFlatEntity) {
    return entity["@id"] === "ro-crate-metadata.json"
}

export function isDataEntity(entity: IFlatEntity) {
    return isFileDataEntity(entity) || isFolderDataEntity(entity)
}

export function isFileDataEntity(entity: IFlatEntity) {
    return (
        toArray(entity["@type"]).includes("File") ||
        toArray(entity["@type"]).includes("MediaObject")
    )
}

export function isFolderDataEntity(entity: IFlatEntity) {
    return toArray(entity["@type"]).includes("Dataset")
}

export function isContextualEntity(entity: IFlatEntity) {
    return !isRootEntity(entity) && !isDataEntity(entity)
}

export function isEntityEqual(a: IFlatEntity, b: IFlatEntity) {
    const entriesA = Object.entries(a)
    const entriesB = Object.entries(b)
    if (entriesA.length !== entriesB.length) return false
    for (const [key, value] of entriesA) {
        if (key in b) {
            if (propertyHasChanged(value, b[key])) {
                return false
            }
        } else {
            return false
        }
    }

    return true
}

export function propertyHasChanged(
    _value: FlatEntityPropertyTypes,
    _oldValue: FlatEntityPropertyTypes
) {
    const value = toArray(_value).slice()
    const oldValue = toArray(_oldValue).slice()

    if (value.length !== oldValue.length) return true

    return (
        value.filter((v) => {
            const index = oldValue.findIndex((o) => {
                if (typeof o === "object") {
                    if (typeof v === "object") {
                        return o["@id"] === v["@id"]
                    } else return false
                } else {
                    return o === v
                }
            })
            if (index < 0) return true
            oldValue.splice(index, 1)
            return false
        }).length > 0
    )
}

export function propertyNameReadable(propertyName: string) {
    if (propertyName === "@id") return "Identifier"
    if (propertyName === "@type") return "Type"
    const split = propertyName.replace(/([a-z0-9])([A-Z])/, "$1 $2")
    return split.charAt(0).toUpperCase() + split.slice(1)
}
