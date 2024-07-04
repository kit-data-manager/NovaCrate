import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
    SCHEMA_ORG_BOOLEAN,
    SCHEMA_ORG_DATE,
    SCHEMA_ORG_DATE_TIME,
    SCHEMA_ORG_NUMBER,
    SCHEMA_ORG_NUMBERLIKE,
    SCHEMA_ORG_TEXT,
    SCHEMA_ORG_TEXTLIKE,
    SCHEMA_ORG_TIME
} from "./constants"

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
    } else if (entity.givenName || entity.familyName) {
        if (entity.givenName && entity.familyName) {
            return `${toArray(entity.givenName).join(" ")} ${toArray(entity.familyName).join(" ")}`
        } else return toArray(entity.familyName || entity.givenName).join(" ")
    } else if (fallback) {
        return entity["@id"]
    }

    return ""
}

function isValidUrl(string: string) {
    try {
        new URL(string)
        return true
    } catch (_) {
        return false
    }
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

export function canHavePreview(entity: IFlatEntity) {
    return isFileDataEntity(entity) && !entity["@id"].startsWith("#") && !isValidUrl(entity["@id"])
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

export function camelCaseReadable(propertyName: string) {
    if (propertyName === "@id") return "Identifier"
    if (propertyName === "@type") return "Type"
    const split = propertyName.replace(/([A-Z][a-z])/g, " $1")
    return split.charAt(0).toUpperCase() + split.slice(1)
}

export function encodeFilePath(fileID: string) {
    return fileID.replaceAll("\\", "/").split("/").map(encodeURIComponent).join("/")
}

export function fileNameWithoutEnding(fileName: string) {
    if (fileName.match(/\.[A-z0-9]+$/)) {
        return fileName.replace(/\.[A-z0-9]+$/, "")
    } else return fileName
}

export function sum(a: number, b: number) {
    return a + b
}

export function getFolderPath(filePath: string) {
    const split = filePath.split("/")
    if (split.length === 0) return ""
    if (split[split.length - 1] === "") return filePath
    else return split.slice(0, split.length - 1).join("/") + "/"
}

export function asValidPath(path: string, endWithSlash?: boolean) {
    const filtered = path
        .split("/")
        .filter((part) => part.length > 0)
        .join("/")
    return endWithSlash ? filtered + "/" : filtered
}

export function isNoneOf(value: string, of: string[]) {
    return of.find((s) => s === value) === undefined
}

export function referenceCheck(propertyRange?: string[]) {
    return propertyRange
        ? propertyRange.length === 0 ||
              propertyRange.filter((s) =>
                  isNoneOf(
                      s,
                      [
                          SCHEMA_ORG_TIME,
                          SCHEMA_ORG_BOOLEAN,
                          SCHEMA_ORG_DATE_TIME,
                          SCHEMA_ORG_NUMBER,
                          SCHEMA_ORG_DATE,
                          SCHEMA_ORG_TEXT,
                          SCHEMA_ORG_NUMBERLIKE,
                          SCHEMA_ORG_TEXTLIKE
                      ].flat()
                  )
              ).length > 0
        : undefined
}

export enum Diff {
    None,
    Changed,
    New
}
