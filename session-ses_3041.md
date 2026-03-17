# RO-Crate tests in NovaCrate analysis and gaps

**Session ID:** ses_304108003ffeTCLyjur3X6aSrw
**Created:** 3/17/2026, 2:15:03 PM
**Updated:** 3/17/2026, 2:20:22 PM

---

## User

Please analyze the tests in tests/unit/lib/core in the eye of RO-Crate functionality and the purpose of this tool (NovaCrate). Do these tests make sense? Is something missing?

---

## Assistant



I'll analyze the test files in `tests/unit/lib/core` and the broader codebase to understand NovaCrate's RO-Crate functionality. Let me start by exploring the test directory and the core library.

**Tool: task**

---

## Assistant

Excellent. Now let me also look at the validation rules and the utility functions more closely, since those are critical to RO-Crate correctness.

**Tool: task**

---

## Assistant

Now I have a comprehensive picture. Let me provide my analysis.

---

## Analysis of `tests/unit/lib/core/` Tests

### What's There (5 test files)

The test suite covers the four core service implementations plus the event system:

| Test File | Coverage Summary |
|---|---|
| `core-service-impl.test.ts` | Orchestration: add file/folder, rename, delete, service accessors, dynamic file service swap, disposal |
| `metadata-service-impl.test.ts` | Entity CRUD, `hasPart` management for data entities, cross-reference updates on rename, recursive folder rename, persistence round-trip, change deduplication via `dequal` |
| `context-service-impl.test.ts` | v1.1/v1.2 spec loading, `@vocab` handling, custom prefix pairs, resolve/reverse, array contexts, fallback behavior |
| `persistence-adapter-impl.test.ts` | JSON parsing/validation, graph/context CRUD, event forwarding, invalid input rejection |
| `observable.test.ts` | Event registration, removal, emission, cleanup functions |

### Do the tests make sense?

**Yes, broadly.** The tests are well-structured and test the right things for an RO-Crate editor's core services. The layered architecture (CrateService → PersistenceAdapter → MetadataService/ContextService → CoreService) is tested at each level with appropriate mocking of the layer below. Key observations:

1. **`hasPart` management is thoroughly tested** — data entities (File/Dataset) are correctly added to and removed from the root entity's `hasPart`, and contextual entities are correctly excluded. This is a critical RO-Crate invariant.

2. **Cross-reference propagation during renames is well-covered** — including the recursive case of renaming a folder and all its children. This is complex and error-prone, so the coverage here is valuable.

3. **Context resolution has good breadth** — v1.1, v1.2, object contexts, array contexts, `@vocab`, custom prefixes, and fallback are all tested.

4. **Persistence validation rejects malformed inputs correctly** — missing `@graph`, non-array `@graph`, missing `@context`, invalid JSON are all covered.

### What's Missing or Could Be Improved

#### High Priority (RO-Crate correctness gaps)

1. **No unit tests for validation rules.** The validation system (`ro-crate-base.ts`, `ro-crate-v1.1.ts`, `ro-crate-v1.2.ts`) contains ~940 lines of complex rule logic that is only exercised by a minimal E2E test (48 lines, covers only 2-3 rules). These rules enforce the RO-Crate specification — they are arguably the most important code for ensuring crate correctness. Each rule should have unit tests covering:
   - Happy path (valid crate passes)
   - Detection case (invalid crate triggers the correct result)
   - Edge cases (empty values, arrays, mixed types)
   
   Rules like `unresolvedRef`, `wrongRefType`, `metadataEntityAbout`, `rootEntityType`, `dataEntityFileError`, `rootEntityDatePublishedFormat`, and `conformsTo` validation all deserve dedicated unit tests.

2. **Root entity discovery via `about` is not tested in core.** The `getRootEntityID()` function (which reads `about` from the metadata descriptor to find the root) is used by MetadataServiceImpl but isn't directly tested. Scenarios like: what if `about` points to a non-existent entity? What if the metadata entity is missing? What if `about` is an array?

3. **No tests for non-standard root entity IDs.** The tests always use `"./"` as the root entity ID. The v1.2 spec allows absolute URIs as root entity IDs. The metadata service should handle this correctly — renaming entities, managing `hasPart`, etc. — but it isn't tested.

#### Medium Priority (robustness gaps)

4. **`changeEntityIdentifier` doesn't test renaming TO an identifier that is a substring/superstring of another entity.** For example, renaming `data/` to `data/subdir/` when `data/file.txt` already exists — does the recursive child logic handle this correctly without false matches?

5. **No tests for `@type` as an array.** RO-Crate entities can have `"@type": ["File", "SoftwareSourceCode"]`. The core service tests only use string `@type` values. The `isFileDataEntity` and `isFolderDataEntity` utility functions do support array types, but the services that depend on type checking (like deciding whether to add to `hasPart`) should be tested with array types.

6. **No tests for the metadata entity itself being modified/renamed/deleted.** What happens if someone tries to `deleteEntity("ro-crate-metadata.json")` or `changeEntityIdentifier("ro-crate-metadata.json", "something-else")`? The core should either prevent this or handle it gracefully. Currently, the code doesn't appear to guard against this.

7. **No tests for the root entity being deleted.** Similarly, what happens if `deleteEntity("./")` is called? The `hasPart` management code depends on the root entity existing.

8. **No concurrency/ordering tests for persistence.** The `PersistenceAdapterImpl` does async reads and writes. If `updateMetadataGraph` is called while `getMetadataGraph` is in flight, what happens? The tests don't exercise interleaved operations.

#### Lower Priority (nice-to-haves)

9. **No tests for `dispose()` being called multiple times.** While tested, the tests only call dispose once. Double-dispose is a common source of bugs.

10. **No tests for very large graphs.** All test fixtures have 2-5 entities. While this is fine for correctness, a performance smoke test with hundreds of entities would catch O(n²) issues in `changeEntityIdOccurrences`.

11. **`CrateContext` (`crate-context.test.ts`) vs `ContextServiceImpl` (`context-service-impl.test.ts`) overlap.** Both test context resolution, but they test different classes. The relationship between these two classes and whether `CrateContext` is still used independently isn't clear — if it's dead code, the tests should be removed; if it's used, they should test distinct behavior.

12. **No tests for export formats.** The `IRepositoryService` interface defines `getCrateAs` with zip/eln/standalone-json formats. These are important for RO-Crate interoperability but aren't tested at the unit level (they're persistence-layer concerns, but still worth noting).

### Summary

The existing tests are solid for what they cover — entity CRUD, `hasPart` management, context resolution, and the event/persistence plumbing. The most significant gap is the **complete absence of unit tests for the validation rules**, which are the primary mechanism for ensuring RO-Crate spec compliance. Secondary gaps include testing edge cases around protected entities (root, metadata descriptor), non-standard root IDs (v1.2), and array `@type` values.

---

