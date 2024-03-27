import { SchemaGraph } from "./SchemaGraph"

const schemaGraph = new SchemaGraph()

schemaGraph.addSchemaOrgSchema()
// const node = schemaGraph.getNode("Airport")
// const parents = schemaGraph.getClassParents("Airport")
// const propertiesSpecific = schemaGraph.getClassSpecificProperties("Airport")
// const properties = schemaGraph.getClassProperties("Airport")
// console.log("Node", node)
// console.log("Parents", parents)
// console.log("Specific Properties", propertiesSpecific.map(n => n["@id"]))
// console.log("All Properties", properties.map(n => n["@id"]))
//
// const propertyParents = schemaGraph.getPropertyParents("borrower")
// console.log(propertyParents)

// const subProperties = schemaGraph.getSubProperties("participant")
// console.log(subProperties.map(id => schemaGraph.getNode(id)))
//
// const subClasses = schemaGraph.getSubClasses("Offer")
// console.log(subClasses)

console.log(schemaGraph.getClassProperties("schema:AggregateOffer").map((p) => p["@id"]))

console.log(schemaGraph.isPropertyOfClass("schema:offers", "schema:AggregateOffer"))
