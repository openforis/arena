# Performance benchmarks

Benchmarks run directly with Jest (no webpack bundle, no database). They are not part of `yarn test`.

## Record update (`recordUpdate.perf.ts`)

Builds a survey (`cluster` → multiple `plot` → multiple `tree`) and a record in memory, then measures the record
update functions used by data entry and data import (`Record.updateAttributesWithValues`):

- record build (plots and trees inserted one by one, like a data import)
- update of an attribute without dependents (`notes`)
- update of an attribute with dependents (`dbh`: calculated attributes, applicability, validations, plot aggregates)
- insertion of a new tree

Record sizes: small (10 trees), medium (200 trees), big (1000 trees); few expressions (none) or many expressions
(10 calculated attributes, 5 applicability conditions, 5 validation expressions, `sum`/`count` plot aggregates).

```bash
yarn test:perf

# options
PERF_UPDATE_ITERATIONS=50 yarn test:perf                     # iterations per update kind (default 30)
PERF_SCENARIO="big (1000 trees) / many" yarn test:perf       # run only the matching scenarios
PERF_OUTPUT_FILE=/tmp/perf-results.json yarn test:perf       # save the results as JSON
```

To compare two `@openforis/arena-core` versions, run it once per version (saving the results with
`PERF_OUTPUT_FILE`) and compare the JSON files.

## Records of a real survey (`surveyRecords.perf.ts`)

Loads an extracted survey export (`survey.json`, `categories/`, `taxonomies/`) in memory, builds records with random
(seeded, so reproducible) values through the data import path and measures: record build, full record validation, data
entry like attribute updates (with and without dependents) and stem insertion. It also prints a fingerprint of the
values and applicability, to check that different versions compute the same record. Written for the NFI MNE survey
(entity and attribute names are hard-coded); skipped when `PERF_SURVEY_DIR` is not set.

```bash
PERF_SURVEY_DIR=/path/to/extracted/export PERF_SIZES=small,medium,big \
  jest --runInBand --testMatch '**/test/perf/surveyRecords.perf.ts'
```
