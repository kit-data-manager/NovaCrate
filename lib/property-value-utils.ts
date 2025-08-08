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
     * @param search String that must be contained in at least one value
     */
    contains(search: EntitySinglePropertyTypes) {
        if (PropertyValueUtils.isArray(this.value)) {
            return this.value.some((v) =>
                PropertyValueUtils.isString(v) ? v === search : v["@id"] === search
            )
        } else if (PropertyValueUtils.isString(this.value)) {
            return this.value === search
        } else if (PropertyValueUtils.isRef(this.value)) {
            return this.value["@id"] === search
        }
        return false
    }
}

export function propertyValue(value: EntityPropertyTypes) {
    return new PropertyValueUtils(value)
}
