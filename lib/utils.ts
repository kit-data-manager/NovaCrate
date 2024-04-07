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

export function getEntityDisplayName(entity: IFlatEntity) {
    if (entity.name) {
        return toArray(entity.name).join(", ")
    } else {
        return entity["@id"]
    }
}
