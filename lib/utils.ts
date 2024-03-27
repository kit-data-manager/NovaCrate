import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function isReference(value: FlatEntitySinglePropertyTypes): value is IReference {
    return typeof value === "object" && "@id" in value
}
