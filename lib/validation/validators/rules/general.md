1. Data/Contextual entity disambiguation

   Severity: error
   entityId: [any entity @id]
   propertyName: @id
   Rule: If an entity's @id is a file or directory path relative to the crate root, its @type MUST include "File" or "Dataset".


2. Reference integrity (foreign key check)

   Severity: error
   entityId: [any entity @id]
   propertyName: [property with value of @id]
   Rule: Any property whose value is an @id (except well-known external IRIs) MUST resolve to an entity object in the @graph with a matching @id.


3. Root hasPart closure

   Severity: warning
   entityId: ./
   propertyName: hasPart
   Rule: All data entities (files/datasets) described in the RO-Crate SHOULD be transitively included under the root data entity’s hasPart hierarchy, so that no described file is “orphaned”.


4. Contextual entity type completeness

   Severity: warning
   entityId: [any contextual entity @id]
   propertyName: @type
   Rule: If @type is "Person" or "Organization", the entity SHOULD have at least one contact property (email, url, affiliation, address, etc.).


5. Recommended descriptions for top-level datasets

   Severity: soft-warning
   entityId: ./
   propertyName: description
   Rule: The root data entity’s description SHOULD be at least 20 characters and not only whitespace.


6. File encodingFormat consistency

   Severity: soft-warning
   entityId: [any File entity @id]
   propertyName: encodingFormat
   Rule: If encodingFormat is a MIME type (e.g. “text/csv”), it SHOULD match the file extension given in @id.


7. URL dereferenceability for external resources

   Severity: info
   entityId: [any entity @id]
   propertyName: url
   Rule: If an entity has the url property, the value SHOULD be a valid, dereferenceable URL (HTTP(S) recommended).


8. Schema.org and RO-Crate context matching

   Severity: warning
   entityId: [any entity @id]
   propertyName: [all properties]
   Rule: All properties in entity objects SHOULD be defined in the context (i.e., in the @context used by the RO-Crate, typically https://w3id.org/ro/crate/1.1/context ).


9. Reverse links integrity

   Severity: info
   entityId: [any contextual entity @id]
   propertyName: [reverse property]
   Rule: If a contextual entity is referenced by another entity (e.g., as an author or publisher), it MAY also have a corresponding "worksFor", "affiliation", or other reverse property linking back to the referring entity, as appropriate.


10. Temporal coverage validation

    Severity: warning
    entityId: [any Dataset entity @id]
    propertyName: temporalCoverage
    Rule: If temporalCoverage is provided, it SHOULD be an ISO 8601 period or single date and SHOULD NOT overlap with non-existent time intervals.

11. Metadata file completeness

    Severity: error
    entityId: [the root metadata file, e.g., ro-crate-metadata.json]
    propertyName: @graph
    Rule: The RO-Crate MUST have a metadata file located at the root, named according to the standard (typically ro-crate-metadata.json), and it MUST contain an @graph property as a JSON array.


12. RO-Crate Metadata File Descriptor

    Severity: error
    entityId: [metadata file entity, e.g., ro-crate-metadata.json]
    propertyName: conformsTo
    Rule: The Metadata File entity describing the metadata file (ro-crate-metadata.json) MUST have a conformsTo property referencing the RO-Crate specification version (e.g., https://w3id.org/ro/crate/1.1).


13. Metadata file entity self-description

    Severity: warning
    entityId: [metadata file entity, e.g., ro-crate-metadata.json]
    propertyName: about
    Rule: The Metadata File entity SHOULD have an about property referencing the Root Data Entity (@id: ./).
