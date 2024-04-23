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
    return toArray(entity["@type"]).includes("File")
}

export function isFolderDataEntity(entity: IFlatEntity) {
    return toArray(entity["@type"]).includes("Dataset")
}

export function isContextualEntity(entity: IFlatEntity) {
    return !isRootEntity(entity) && !isDataEntity(entity)
}
