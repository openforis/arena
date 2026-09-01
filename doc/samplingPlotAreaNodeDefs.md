## **Sampling "plot area" and "weight" node defs**

Analysis chains can auto-generate a small set of hidden, chain-scoped node defs used only to
hold R-script variables needed for area-based calculations. This document explains what they
are, how they get created/deleted, and where that logic lives.

### What gets generated

- `weight` - created on the chain's **base unit** entity. Default script: `entity$weight <- 1`.
- `${entityName}_plot_area_` - created on **any** entity that has an active, chain-scoped
  "area-based estimated" attribute. Default script: `entity$entity_plot_area_ <- NA` (the
  analyst is expected to replace `NA` with the actual area formula).

Both are:

- decimal node defs
- `temporary: true` / `analysis: true`, not shown in the data entry form
- flagged with the advanced props `isSampling: true`, `chainUuid`, `active`, `index: -1`

### Why they exist

When a quantitative analysis attribute is flagged "area-based estimate" (`hasAreaBasedEstimated`,
toggled in `webapp/components/survey/NodeDefDetails/AnalysisProps/AreaBasedEstimated`), Arena
creates a derived sibling attribute `${attr}_ha` whose script divides the raw value by the
entity's plot area:

```
entity$attr_ha <- entity$attr / entity$entity_plot_area_
```

(see `AreaBasedEstimatedOfNodeDef.getScript` in `common/analysis/areaBasedEstimatedNodeDef.js`).
For that division to resolve, the entity needs the `entity_plot_area_` variable to exist -
that's what this generation step provides. The `weight` variable serves an analogous purpose
for the base unit entity, e.g. as the starting point for sampling-design weight calculations.

### Where it's computed

`SamplingNodeDefs.determinePlotAreaNodeDefs({ survey, chain })` in
`common/analysis/samplingNodeDefs.js`:

1. **Weight**: looked up/created directly against the chain's base unit entity
   (`Survey.getBaseUnitNodeDef({ chain })(survey)`), independently of where that entity sits in
   the survey hierarchy.
2. **Plot area**: computed independently of the base unit. Every analysis entity in the chain
   (`Survey.getAnalysisEntities({ chain })(survey)` - a hierarchy-agnostic scan of the whole
   survey) is checked for a child node def that is:
   - the derived `_ha` attribute of an area-based estimate (`NodeDef.isAreaBasedEstimatedOf`)
   - **active** (`NodeDef.isActive`)
   - belonging to **this** chain (`NodeDef.getChainUuid(childDef) === chainUuid`)

   If such a child exists, a `${entity}_plot_area_` node def is created (or kept, if one with
   the exact expected name already exists). If not, any existing one for that entity is
   scheduled for deletion.
3. **Cleanup pass**: independently re-scans the whole chain for any `weight` or
   `*_plot_area_`-named sampling node def and deletes whichever one wasn't re-validated in
   steps 1-2 above (e.g. after an entity rename, or a base-unit reassignment).

Weight and plot area are deliberately **not linked** to each other's hierarchy position: a
survey can have the base unit and the area-holding entity as siblings under a common parent
(e.g. a "plot" entity with sibling "sub-plot" and "tree" child entities) - each is evaluated on
its own criteria.

### Where it's run

This function runs once per chain, on every survey publish, via
`ChainsSamplingNodeDefsCheckJob` (`server/modules/survey/service/publish/jobs/chainsSamplingNodeDefsCheckJob.js`),
wired into `SurveyPublishJob`. The returned `nodeDefsToCreate` / `nodeDefsToDelete` are
persisted through `NodeDefManager`.

### R script generation

When the R analysis chain is generated (`server/modules/analysis/service/rChain/rChain.js`),
`SamplingNodeDefs.getSamplingDefsInEntities` collects these sampling node defs across the
chain's entities and orders `weight` first, followed by the base unit's own plot area (if any),
then the rest - each one is written out as its own `.R` file under the chain's `sampling/`
folder, containing either its custom script or the default assignment shown above.

### Note on cross-entity joins

If the base unit entity and an area-holding entity are siblings (not ancestor/descendant), each
gets its own R dataframe populated from a per-entity view that flattens in only *ancestor*
attributes - sibling data is not automatically joined. The analyst still needs to write an R
`merge()`/join by hand to combine them; Arena only guarantees that the `_plot_area_` (and
`weight`) variables themselves get generated so there is something to join to.

### Tests

`test/unit/tests/030samplingNodeDefs.test.js` covers the core scenarios: a sibling base unit and
area entity, a childless base unit, an inactive area-based attribute, cross-chain isolation, an
entity rename, and a base-unit reassignment.
