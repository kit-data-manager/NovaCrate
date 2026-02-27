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
import { ValidationResult } from "@/lib/validation/validation-result"
import { PropertyValueUtils } from "./property-value-utils"

/**
 * Utility from shadcn/ui to merge multiple className strings into one
 * @param inputs className strings
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Checks if the supplied value is a reference. A valid reference is an object that contains the "@id" property
 * @param value
 */
export function isReference(value: EntitySinglePropertyTypes): value is IReference {
    return typeof value === "object" && "@id" in value
}

/**
 * Convert a value to an array. If an array is supplied as the input, a new array will be constructed.
 * @param input
 */
export function toArray<T>(input: T | T[]): T[] {
    if (Array.isArray(input)) {
        return Array.from(input)
    } else {
        return [input]
    }
}

/**
 * Compute the display name for the supplied entity. Will first try the name property, then the givenName and familyName properties. Lastly, it will return the @id if fallback is true. Will return an empty string otherwise.
 * @param entity Entity to retrieve the name for
 * @param fallback If true, will return the @id of the entity if no name could be found.
 */
export function getEntityDisplayName(entity: IEntity, fallback: boolean = true) {
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

/**
 * Check if the string represents a valid URL
 * @param string String to check
 */
export function isValidUrl(string: string) {
    try {
        new URL(string)
        return true
    } catch {
        return false
    }
}

/**
 * Find an entity in a map of entities. Tries different methods of resolving the entity using the id:
 *  1. Direct use of the id
 *  2. decoding the id as if it were an encoded URI
 * @param entities Entities map from editor state
 * @param id of the target entity
 */
export function findEntity(entities: Map<string, IEntity>, id: string): IEntity | undefined {
    const standard = entities.get(id)
    if (standard) return standard
    // Fallback method
    return entities.get(decodeURI(id))
}

/**
 * Check if this entity is the crate root
 * @param entity
 * @deprecated Use `editorState.getRootEntityId()` instead to reliably determine the @id of the root entity
 */
export function isRootEntity(entity: IEntity) {
    return entity["@id"] === "./"
}

/**
 * Check if this entity is the meta-entity for the ro-crate-metadata.json file
 * @param entity
 */
export function isRoCrateMetadataEntity(entity: IEntity) {
    return entity["@id"] === "ro-crate-metadata.json"
}

/**
 * Check if this is a data entity
 * @param entity
 */
export function isDataEntity(entity: IEntity) {
    return isFileDataEntity(entity) || isFolderDataEntity(entity)
}

/**
 * Check if this is a data entity that represents a file. Checks if the type of this entity includes File or MediaObject
 * @param entity
 */
export function isFileDataEntity(entity: IEntity) {
    return (
        toArray(entity["@type"]).includes("File") ||
        toArray(entity["@type"]).includes("MediaObject")
    )
}

/**
 * Checks if this entity can be previewed. Entities that are file entities and do not have a URL-id are assumed to be previewable
 * @param entity
 */
export function canHavePreview(entity: IEntity) {
    return isFileDataEntity(entity) && !entity["@id"].startsWith("#") && !isValidUrl(entity["@id"])
}

/**
 * Check if the supplied entity is a data entity that represents a folder (dataset). Will check for the Dataset type.
 * @param entity
 */
export function isFolderDataEntity(entity: IEntity) {
    return toArray(entity["@type"]).includes("Dataset")
}

/**
 * Check if the supplied entity is a contextual entity. An entity is a contextual entity if it is not a data entity.
 * @param entity
 */
export function isContextualEntity(entity: IEntity) {
    return !isDataEntity(entity)
}

/**
 * Check if two entities are equal. Will deeply compare their properties
 * @param a
 * @param b
 * @returns true if both entities should be considered equal
 */
export function isEntityEqual(a: IEntity, b: IEntity) {
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

/**
 * Check if two property values are equal.
 * @param _value
 * @param _oldValue
 * @returns true when the properties are *not* equal
 */
export function propertyHasChanged(_value: EntityPropertyTypes, _oldValue: EntityPropertyTypes) {
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

/**
 * Turns a camel-case string into a human-readable one. Also correctly handles shortened URIs
 * @param str Camel-case string
 * @example
 * someExample
 * -> Some Example
 * purl:anotherExample
 * -> [purl] Another Example
 */
export function camelCaseReadable(str: string) {
    if (str === "@id") return "Identifier"
    if (str === "@type") return "Type"
    const [prefix, ...suffix] = str.includes(":") ? str.split(":") : ["", str]
    // If the string contains more than one :, we just use the first one as suffix and join everything else back together
    let split = suffix.join(":").replace(/([A-Z][a-z])/g, " $1")
    if (split.startsWith(" ")) split = split.slice(1)
    return (prefix ? `[${prefix}] ` : "") + split.charAt(0).toUpperCase() + split.slice(1)
}

/**
 * Encode a file path for safe use
 * @param filePath Path of the file
 */
export function encodeFilePath(filePath: string) {
    return filePath.replaceAll("\\", "/").replaceAll("%", "%25").replaceAll(" ", "%20")
}

/**
 * The most primitive of operations as a function (for use in reducers for example)
 * @param a
 * @param b
 */
export function sum(a: number, b: number) {
    return a + b
}

/**
 * Get the folder portion of a file path
 * @example
 * /some/long/path/file.txt
 * -> /some/long/path/
 * @param filePath
 */
export function getFolderPath(filePath: string) {
    const split = filePath.split("/")
    if (split.length === 0) return ""
    if (split[split.length - 1] === "") return filePath
    else return split.slice(0, split.length - 1).join("/") + "/"
}

/**
 * Get the file name from a file path
 * @example
 * /some/long/path/file.txt
 * -> file.txt
 * @param filePath
 */
export function getFileName(filePath: string) {
    const split = filePath.split("/")
    if (filePath.endsWith("/")) return split[split.length - 2]
    else return split[split.length - 1]
}

/**
 * Convert a path into a valid path (without empty parts and with an ending slash if needed)
 * @param path Path to convert
 * @param endWithSlash Whether an ending slash should be added to indicate a folder
 */
export function asValidPath(path: string, endWithSlash?: boolean) {
    const filtered = path
        .split("/")
        .filter((part) => part.length > 0)
        .join("/")
    return endWithSlash ? filtered + "/" : filtered
}

/**
 * Check if the supplied value is not present in the array of
 * @param value Value to check
 * @param of Array of values, of which `value` should not be one
 * @returns true if `value` is not found in `of`
 */
export function isNoneOf(value: string, of: string[]) {
    return of.find((s) => s === value) === undefined
}

/**
 * Check if a given property type range allows for its value to be a reference.
 * A property can have a reference as its value if at least one of its allowed types is not a primitive datatype
 * @param propertyRange
 */
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

/**
 * Check if a given property type range allows for its value to be a text.
 * @param propertyRange
 */
export function textCheck(propertyRange?: string[]) {
    return propertyRange
        ? propertyRange.length === 0 ||
              propertyRange.includes(SCHEMA_ORG_TEXT) ||
              SCHEMA_ORG_TEXTLIKE.find((s) => propertyRange.includes(s)) !== undefined // ||
        : // canBeTime ||
          // canBeBoolean ||
          // canBeDate ||
          // canBeDateTime ||
          // canBeNumber
          undefined
}

/**
 * Indicates the type of difference between two things.
 */
export enum Diff {
    None,
    Changed,
    New
}

/**
 * This function changes all occurrences of oldId to newId (on the target entity and on all references to it)
 * @param entities All entities of the crate
 * @param oldId Current ID of entity to be renamed
 * @param newId New ID of entity to be renamed
 */
export function changeEntityIdOccurrences(entities: IEntity[], oldId: string, newId: string) {
    entities.forEach((e) => {
        if (e["@id"] === oldId) {
            e["@id"] = newId
        }

        for (const [, value] of Object.entries(e)) {
            if (Array.isArray(value)) {
                value.forEach((val) => {
                    if (isReference(val) && val["@id"] === oldId) {
                        val["@id"] = newId
                    }
                })
            } else {
                if (isReference(value) && value["@id"] === oldId) {
                    value["@id"] = newId
                }
            }
        }
    })
}

/**
 * Sort a ValidationResult by propertyName, propertyIndex, entityId and resultTitle
 * @param a
 * @param b
 */
export function sortValidationResultByName(a: ValidationResult, b: ValidationResult) {
    const strA = `${a.propertyName ?? "undefined"}|${a.propertyIndex ?? ""}|${a.entityId ?? ""}|${a.resultTitle}`
    const strB = `${b.propertyName ?? "undefined"}|${b.propertyIndex ?? ""}|${b.entityId ?? ""}|${b.resultTitle}`
    return strA.localeCompare(strB)
}

export function getRootEntityID(entities: IEntity[] | Map<string, IEntity>) {
    const meta = Array.isArray(entities)
        ? entities.find((e) => e["@id"] === "ro-crate-metadata.json")
        : entities.get("ro-crate-metadata.json")
    const legacy = Array.isArray(entities)
        ? entities.find((e) => e["@id"] === "ro-crate-metadata.jsonld")
        : entities.get("ro-crate-metadata.jsonld")
    if (meta && "about" in meta && PropertyValueUtils.isRef(meta.about)) return meta.about["@id"]
    if (legacy && "about" in legacy && PropertyValueUtils.isRef(legacy.about))
        return legacy.about["@id"]
}

export interface AutoReference {
    entityId: string
    propertyName: string
    valueIdx: number
}
