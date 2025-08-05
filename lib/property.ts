export interface EntityEditorProperty {
    propertyName: string
    values: EntitySinglePropertyTypes[]
    deleted: boolean
}

export function getDefaultDate() {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, "0")
    const mm = String(today.getMonth() + 1).padStart(2, "0") //January is 0!
    const yyyy = today.getFullYear()

    return yyyy + "-" + mm + "-" + dd
}

export enum PropertyType {
    Time,
    Boolean,
    DateTime,
    Number,
    Text,
    Date,
    Reference,
    Type // for @type property
}

export function getPropertyTypeDefaultValue(type: PropertyType): EntitySinglePropertyTypes {
    if (type === PropertyType.Text) return ""
    if (type === PropertyType.Reference) return { "@id": "" }
    if (type === PropertyType.Date) return getDefaultDate()
    if (type === PropertyType.Number) return "0"
    if (type === PropertyType.Boolean) return "true"
    if (type === PropertyType.DateTime) return getDefaultDate() + "T08:00"
    if (type === PropertyType.Time) return "08:00"
    return ""
}

export function sortByPropertyName(a: string, b: string) {
    if (a === "name" && b === "name") return 0
    if (a === "name" && !b.startsWith("@")) return -1
    if (b === "name" && !a.startsWith("@")) return 1
    if (a === b) return 0
    return a > b ? 1 : -1
}

// TODO maybe get rid of this, causes problems with re-rendering
export function mapEntityToProperties(
    data: IEntity,
    initialData?: IEntity
): EntityEditorProperty[] {
    const deletedProperties: EntityEditorProperty[] = Object.keys(initialData || {})
        .filter((key) => !(key in data))
        .map((key) => ({ propertyName: key, values: [], deleted: true }))

    return Object.keys(data)
        .map((key) => {
            const value = data[key]
            let arrValue: EntitySinglePropertyTypes[]
            if (!Array.isArray(value)) {
                arrValue = [value]
            } else {
                arrValue = value.slice()
            }

            return {
                propertyName: key,
                values: arrValue,
                deleted: false
            }
        })
        .flat()
        .concat(deletedProperties)
        .sort((a, b) => sortByPropertyName(a.propertyName, b.propertyName))
}
