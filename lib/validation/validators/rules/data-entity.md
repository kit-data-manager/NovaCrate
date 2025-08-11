
    Severity: warning
    entityId: [any data entity @id]
    propertyName: name
    Rule: Every data entity SHOULD have a name property describing it for human readers.

    Severity: error
    entityId: [any data entity @id]
    propertyName: within
    Rule: Any data entity representing a contained file or dataset MUST have a parent Dataset (typically the Root Data Entity) indicated with the "hasPart" property.

    Severity: info
    entityId: [any data entity @id]
    propertyName: encodingFormat
    Rule: File entities MAY have an encodingFormat property specifying the file’s media type (e.g., MIME type).

    Severity: info
    entityId: [any data entity @id]
    propertyName: contentSize
    Rule: File entities MAY have a contentSize property specifying the size of the file in bytes.

    Severity: warning
    entityId: [any data entity @id]
    propertyName: url
    Rule: File and Dataset entities MAY have a url property that is a resolvable URI to the data entity.
