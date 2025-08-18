export class PropertyValueUtils {
    constructor(private value: EntityPropertyTypes) {}

    static isString(value: EntityPropertyTypes): value is string {
        return typeof value === "string"
    }

    static isRef(value: EntityPropertyTypes): value is IReference {
        return typeof value === "object" && "@id" in value
    }

    static isArray(value: EntityPropertyTypes): value is EntitySinglePropertyTypes[] {
        return Array.isArray(value)
    }

    static isStringArray(value: EntityPropertyTypes): value is string[] {
        return this.isArray(value) && value.every(this.isString)
    }

    static isRefArray(value: EntityPropertyTypes): value is IReference[] {
        return this.isArray(value) && value.every(this.isRef)
    }

    /**
     * Returns true iff the property contains 0 values or is the empty string or is a reference to the empty string
     */
    isEmpty() {
        if (PropertyValueUtils.isArray(this.value) || PropertyValueUtils.isString(this.value)) {
            return this.value.length === 0
        } else if (PropertyValueUtils.isRef(this.value)) {
            return this.value["@id"].length === 0
        }
        return false
    }

    /**
     * Returns true iff the property contains the search string. For this, at least one of the values must exactly match the search string.
     * @param search String that must match at least one value
     */
    contains(search: EntitySinglePropertyTypes) {
        if (PropertyValueUtils.isArray(this.value)) {
            return this.value.some((v) =>
                PropertyValueUtils.isString(v) || PropertyValueUtils.isString(search)
                    ? v === search
                    : v["@id"] === search["@id"]
            )
        } else if (PropertyValueUtils.isString(this.value) && PropertyValueUtils.isString(search)) {
            return this.value === search
        } else if (PropertyValueUtils.isRef(this.value) && PropertyValueUtils.isRef(search)) {
            return this.value["@id"] === search["@id"]
        }
        return false
    }

    /**
     * Returns true iff the property contains the search string as a substring. For this, at least one of the values must contain the search string as a substring.
     * @param search String that must be contained in at least one value
     */
    containsSubstring(search: EntitySinglePropertyTypes) {
        if (PropertyValueUtils.isArray(this.value)) {
            return this.value.some((v) => {
                if (PropertyValueUtils.isString(v) && PropertyValueUtils.isString(search)) {
                    return v.includes(search)
                } else if (PropertyValueUtils.isRef(v) && PropertyValueUtils.isRef(search)) {
                    return v["@id"].includes(search["@id"])
                }
                return false
            })
        } else if (PropertyValueUtils.isString(this.value) && PropertyValueUtils.isString(search)) {
            return this.value.includes(search)
        } else if (PropertyValueUtils.isRef(this.value) && PropertyValueUtils.isRef(search)) {
            return this.value["@id"].includes(search["@id"])
        }
        return false
    }

    /**
     * Returns true iff the property matches exactly the input value
     * @param match Value that the property must have
     */
    is(match: EntitySinglePropertyTypes) {
        if (PropertyValueUtils.isArray(this.value)) {
            return false
        } else if (PropertyValueUtils.isString(this.value) && PropertyValueUtils.isString(match)) {
            return this.value === match
        } else if (PropertyValueUtils.isRef(this.value) && PropertyValueUtils.isRef(match)) {
            return this.value["@id"] === match["@id"]
        }
        return false
    }

    singleStringMatcher(matcher: (value: string) => boolean) {
        if (PropertyValueUtils.isString(this.value)) {
            return matcher(this.value)
        } else if (PropertyValueUtils.isStringArray(this.value) && this.value.length === 1) {
            return matcher(this.value[0])
        }
        return false
    }

    hasRefs() {
        if (PropertyValueUtils.isArray(this.value)) {
            return this.value.some((v) => PropertyValueUtils.isRef(v))
        } else {
            return PropertyValueUtils.isRef(this.value)
        }
    }

    forEach(callback: (value: EntitySinglePropertyTypes, index: number) => void) {
        if (PropertyValueUtils.isArray(this.value)) {
            this.value.forEach(callback)
        } else {
            callback(this.value, 0)
        }
    }
}

export function propertyValue(value: EntityPropertyTypes) {
    return new PropertyValueUtils(value)
}
