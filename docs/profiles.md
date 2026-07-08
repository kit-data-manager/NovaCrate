
# Profiles in NovaCrate

Profiles in NovaCrate are activated based on the `conformsTo` property of the root entity, as required by the RO-Crate specification.
The Profile system in NovaCrate is intended for use with multiple different profile mechanisms. As there currently is no official standard for machine
actionable profiles, NovaCrate aims to (enable) support (for) any of the existing profile mechanisms.

## Supported Profile Mechanisms

- MASP: Machine Actionable Schema Profiles
  - This is the default mechanism and will hopefully be adopted by the RO-Crate specification

NovaCrate is open to contributions to support other profile mechanisms (e.g. Describo profiles, Crate-O modes, ...)

# Adding new Profile Mechanisms

A NovaCrate **Profile Mechanism** is basically a specification that defines how to turn a [profile crate](https://www.researchobject.org/ro-crate/specification/1.3/profiles.html#profile-crate) that conforms to a specification or file format into a [NovaCrate profile definition](../lib/core/profiles/types/ProfileDefinition.ts).

To extend NovaCrate to support a new profile mechanism, the following steps have to be taken:

1. Implement the [Profile interface](../lib/core/profiles/IProfile.ts). The profile interface currently has few requirements. Your implementation only needs to provide a NovaCrate profile definition based on the profile crate that is being parsed.
2. Implement a [Profile Factory Strategy](../lib/core/profiles/IProfileFactoryStrategy.ts) for your profile implementation. This strategy is used to construct the profile instance whenever a matching profile uri is encountered in the RO-Crates `conformsTo` property.
3. Add the strategy to the `STRATEGIES` array in the [ProfileFactory](../lib/core/profiles/impl/ProfileFactory.ts). This is currently not extensible at runtime. If a plugin system is ever added, it would be useful to allow adding strategies dynamically from plugins.

Validation happens automatically based on the [profile definition](../lib/core/profiles/types/ProfileDefinition.ts) that your profile needs to output. In the future,
profiles could support additional features:

- Custom validation rules
- UI widgets

This is not yet implemented.