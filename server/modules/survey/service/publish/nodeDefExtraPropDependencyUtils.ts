import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import { db } from '@server/db/db'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'

type ExtraPropDefsMap = Record<string, any>
type ExtraValueRow = Record<string, any>
type ChangedEntity = { name: string; changedPropNames: Set<string> }

// ExtraPropDef.getDataType is a Ramda-style curried function typed as `unknown` by its curry helper -
// cast once here rather than at every call site.
const getExtraPropDefDataType = ExtraPropDef.getDataType as (extraPropDef: any) => string

// Compares two raw extra-prop-def maps (name -> { dataType, index, locked }) and returns the set of
// prop names that were added, removed, or retyped between them. Reordering (index) and locked flips
// are ignored - they don't affect evaluated values.
const _diffExtraPropDefNames = (extraDefA: ExtraPropDefsMap, extraDefB: ExtraPropDefsMap): Set<string> => {
  const changedPropNames = new Set<string>()
  const allNames = new Set([...Object.keys(extraDefA), ...Object.keys(extraDefB)])
  for (const name of allNames) {
    const propA = extraDefA[name]
    const propB = extraDefB[name]
    if (!propA || !propB || getExtraPropDefDataType(propA) !== getExtraPropDefDataType(propB)) {
      changedPropNames.add(name)
    }
  }
  return changedPropNames
}

// Groups rows shaped like { [entityUuidField]: uuid, extraPublished, extraDraft } (as returned by
// CategoryRepository.fetchCategoryItemsWithChangedExtraValues / TaxonomyRepository.fetchTaxaWithChangedExtraValues)
// by entity uuid, diffing extraPublished vs extraDraft key by key and accumulating the differing prop
// names per entity.
const _groupChangedExtraValuePropNamesByEntityUuid = (
  rows: ExtraValueRow[],
  entityUuidField: string
): Map<string, Set<string>> => {
  const changedPropNamesByEntityUuid = new Map<string, Set<string>>()
  for (const row of rows) {
    const entityUuid = row[entityUuidField]
    const extraPublished = row.extraPublished ?? {}
    const extraDraft = row.extraDraft ?? {}
    const changedPropNames = changedPropNamesByEntityUuid.get(entityUuid) ?? new Set<string>()
    const allNames = new Set([...Object.keys(extraPublished), ...Object.keys(extraDraft)])
    for (const name of allNames) {
      if (JSON.stringify(extraPublished[name]) !== JSON.stringify(extraDraft[name])) {
        changedPropNames.add(name)
      }
    }
    if (changedPropNames.size > 0) {
      changedPropNamesByEntityUuid.set(entityUuid, changedPropNames)
    }
  }
  return changedPropNamesByEntityUuid
}

const _unionPropNames = (setA?: Set<string>, setB?: Set<string>): Set<string> =>
  new Set([...(setA ?? []), ...(setB ?? [])])

// Finds already-published, non-deleted node defs whose expressions reference (via
// categoryItemProp/taxonProp) a category/taxonomy extra prop that changed in the draft - either its
// definition (itemExtraDef/extraPropsDefs: added, removed, retyped) or an existing item's/taxon's
// extra value. These node defs' stored values need recalculating (RecordCheckJob) or would silently
// go stale (SurveyService's publish warning) once the category/taxonomy props are published.
//
// `survey` is expected to already carry draft-merged categories/taxonomies (fetched with
// draft: true - see SurveyManager.fetchSurveyAndNodeDefsBySurveyId), so this only needs a few extra,
// cheap queries: the published-only state of categories/taxonomies (to diff definitions against), and
// any item/taxon rows with a pending extra-value draft change (to diff values against).
export const findNodeDefUuidsAffectedByCategoryOrTaxonomyExtraPropChanges = async (
  { surveyId, survey }: { surveyId: number; survey: any },
  client: any = db
): Promise<{ valueAffectedNodeDefUuids: Set<string>; validationAffectedNodeDefUuids: Set<string> }> => {
  const [categoriesPublishedByUuid, taxonomiesPublishedArray, categoryItemsChangedRows, taxaChangedRows] =
    await Promise.all([
      CategoryRepository.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: false }, client),
      TaxonomyRepository.fetchTaxonomiesBySurveyId({ surveyId, draft: false }, client),
      CategoryRepository.fetchCategoryItemsWithChangedExtraValues({ surveyId }, client),
      TaxonomyRepository.fetchTaxaWithChangedExtraValues({ surveyId }, client),
    ])
  const taxonomiesPublishedByUuid = ObjectUtils.toUuidIndexedObj(taxonomiesPublishedArray)

  const categoryValueChangedPropNamesByUuid = _groupChangedExtraValuePropNamesByEntityUuid(
    categoryItemsChangedRows,
    'categoryUuid'
  )
  const taxonomyValueChangedPropNamesByUuid = _groupChangedExtraValuePropNamesByEntityUuid(
    taxaChangedRows,
    'taxonomyUuid'
  )

  const changedCategories: ChangedEntity[] = []
  for (const categoryDraft of Survey.getCategoriesArray(survey)) {
    const categoryUuid = Category.getUuid(categoryDraft)
    const categoryPublished = categoriesPublishedByUuid[categoryUuid]
    const schemaChangedPropNames = categoryPublished
      ? _diffExtraPropDefNames(Category.getItemExtraDef(categoryDraft), Category.getItemExtraDef(categoryPublished))
      : new Set<string>()
    const changedPropNames = _unionPropNames(
      schemaChangedPropNames,
      categoryValueChangedPropNamesByUuid.get(categoryUuid)
    )
    if (changedPropNames.size > 0) {
      changedCategories.push({ name: Category.getName(categoryDraft), changedPropNames })
    }
  }

  const changedTaxonomies: ChangedEntity[] = []
  for (const taxonomyDraft of Survey.getTaxonomiesArray(survey)) {
    const taxonomyUuid = Taxonomy.getUuid(taxonomyDraft)
    const taxonomyPublished = taxonomiesPublishedByUuid[taxonomyUuid]
    const schemaChangedPropNames = taxonomyPublished
      ? _diffExtraPropDefNames(Taxonomy.getExtraPropsDefs(taxonomyDraft), Taxonomy.getExtraPropsDefs(taxonomyPublished))
      : new Set<string>()
    const changedPropNames = _unionPropNames(
      schemaChangedPropNames,
      taxonomyValueChangedPropNamesByUuid.get(taxonomyUuid)
    )
    if (changedPropNames.size > 0) {
      changedTaxonomies.push({ name: Taxonomy.getName(taxonomyDraft), changedPropNames })
    }
  }

  const valueAffectedNodeDefUuids = new Set<string>()
  const validationAffectedNodeDefUuids = new Set<string>()

  if (changedCategories.length > 0 || changedTaxonomies.length > 0) {
    for (const nodeDef of Survey.getNodeDefsArray(survey)) {
      if (!NodeDef.isPublished(nodeDef) || NodeDef.isDeleted(nodeDef)) continue

      const valueMatch =
        changedCategories.some(({ name, changedPropNames }) =>
          NodeDef.referencesCategoryExtraProp({ categoryName: name, changedPropNames })(nodeDef)
        ) ||
        changedTaxonomies.some(({ name, changedPropNames }) =>
          NodeDef.referencesTaxonomyExtraProp({ taxonomyName: name, changedPropNames })(nodeDef)
        )
      if (valueMatch) {
        valueAffectedNodeDefUuids.add(NodeDef.getUuid(nodeDef))
        continue
      }

      const validationMatch =
        changedCategories.some(({ name, changedPropNames }) =>
          NodeDef.referencesCategoryExtraPropInValidations({ categoryName: name, changedPropNames })(nodeDef)
        ) ||
        changedTaxonomies.some(({ name, changedPropNames }) =>
          NodeDef.referencesTaxonomyExtraPropInValidations({ taxonomyName: name, changedPropNames })(nodeDef)
        )
      if (validationMatch) {
        validationAffectedNodeDefUuids.add(NodeDef.getUuid(nodeDef))
      }
    }
  }

  return { valueAffectedNodeDefUuids, validationAffectedNodeDefUuids }
}
