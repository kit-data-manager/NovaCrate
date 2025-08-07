    Severity: error
    entityId: ./
    propertyName: @type
    Rule: The Root Data Entity MUST have @type set to "Dataset".

    Severity: error
    entityId: ./
    propertyName: @id
    Rule: The Root Data Entity MUST have @id that ends with a "/" and SHOULD be the string "./".

    Severity: warning
    entityId: ./
    propertyName: name
    Rule: The Root Data Entity SHOULD have a name that allows human identification of the dataset and distinguishes it from other RO-Crates.

    Severity: warning
    entityId: ./
    propertyName: description
    Rule: The Root Data Entity SHOULD have a description property providing a summary of the dataset and its context.

    Severity: error
    entityId: ./
    propertyName: datePublished
    Rule: The Root Data Entity MUST have a datePublished property, as a string in ISO 8601 date format, specified to at least the precision of a day.

    Severity: warning
    entityId: ./
    propertyName: license
    Rule: The Root Data Entity SHOULD have a license property linking to a Contextual Entity (with a human-readable name and description), to describe how the RO-Crate may be used. This MAY be a URI or a textual description.
