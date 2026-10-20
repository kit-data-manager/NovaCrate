# Profile Definition

## Entities

The only thing that can be defined is whether a specific entity has to be present or not. (An upper limit of instances can also be defined.)

The existence of an entity can only be determined by its "shape":
- Do the types on the entity match the types of the shape?
- Does the entity have all required properties?

In this way the relation of entity definitions to actual entities is ensured.

> Q: How can it be ensured that no two entity definitions match the same entity? This could in theory be done by giving priority to the entity definition with the most mandatory properties

Can do the following things:
- The entity MUST be present between X and Y times

## Properties

In case of properties, there are multiple different concerns that need to be addressed:
- What is the type of the property?
- Is the property mandatory?

Matching property rules to entities is solely done by matching the entity rule to the entity and then using all property rules applied to that entity rule

The values of a property can be restricted to a specific range or a list of values

Can do the following things:
- The property MUST be present between X and Y times
- Values of the property MUST be from the range of the property

## ItemList

The item list defines a number of options that MUST be used within a property. It does not allow specifying which options are mandatory.

Whenever at least one ItemList appears in the range of a property, then values MUST come from the ItemList. Behavior is undefined if there are multiple item lists.

Can do the following things:
- The corresponding property can only hold values from this ItemList

## PropertyValue

New mechanism to further specify which properties must be present how often.

Allows to specify a concrete value together with a sh:minCount and sh:maxCount.

Can do the following things:
- This value must be specified on the corresponding property exactly X times
- This value must be specified on the corresponding property at least X times
- This value must be specified on the corresponding property at most X times