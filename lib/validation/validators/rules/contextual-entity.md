    Severity: error
    entityId: [any entity @id]
    propertyName: @id
    Rule: Each entity MUST have an @id. For contextual entities, if an existing permalink (such as an ORCID, ROR, DOI, or other persistent URI) is reasonably unique and available, it SHOULD be used as the @id. Otherwise, a local identifier (e.g., #localName or #uuid) SHOULD be generated.

    Severity: error
    entityId: [any entity @id]
    propertyName: @type
    Rule: Each entity MUST have a @type property. Contextual entities MUST have a type appropriate to their identity (e.g., Person, Organization, Place, CreativeWork, SoftwareApplication, etc., according to their schema.org definitions).

    Severity: warning
    entityId: [any entity @id]
    propertyName: name
    Rule: Each contextual entity SHOULD have a name property providing a human-readable label.

    Severity: warning
    entityId: [any entity @id]
    propertyName: description
    Rule: Each contextual entity SHOULD have a description property to further explain its role or context.

    Severity: info
    entityId: [any entity @id]
    propertyName: identifier
    Rule: If a stable, persistent identifier exists for the contextual entity, it MAY be provided in the identifier property (in addition to @id).

    Severity: warning
    entityId: [any entity @id]
    propertyName: [property referring to a contextual entity]
    Rule: Where a contextual entity is referenced from another entity (e.g., author, publisher), it SHOULD be included as an explicit object in the @graph using the same @id.

    Severity: info
    entityId: [any entity @id]
    propertyName: [all properties]
    Rule: Additional Schema.org or Linked Data properties MAY be included for further description.
