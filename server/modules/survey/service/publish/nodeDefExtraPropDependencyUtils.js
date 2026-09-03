import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import { db } from '@server/db/db'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'

// Compares two raw extra-prop-def maps (name -> { dataType, index, locked }) and returns the set of
// prop names that were added, removed, or retyped between them. Reordering (index) and locked flips
// are ignored - they don't affect evaluated values.
const _diffExtraPropDefNames = (extraDefA, extraDefB) => {
  const changedPropNames = new Set()
  const allNames = new Set([...Object.keys(extraDefA), ...Object.keys(extraDefB)])
  allNames.forEach((name) => {
    const propA = extraDefA[name]
    const propB = extraDefB[name]
    if (!propA || !propB || ExtraPropDef.getDataType(propA) !== ExtraPropDef.getDataType(propB)) {
      changedPropNames.add(name)
    }
  })
  return changedPropNames
}

// Groups rows shaped like { [entityUuidField]: uuid, extraPublished, extraDraft } (as returned by
// CategoryRepository.fetchCategoryItemsWithChangedExtraValues / TaxonomyRepository.fetchTaxaWithChangedExtraValues)
// by entity uuid, diffing extraPublished vs extraDraft key by key and accumulating the differing prop
// names per entity.
const _groupChangedExtraValuePropNamesByEntityUuid = (rows, entityUuidField) => {
  const changedPropNamesByEntityUuid = new Map()
  rows.forEach((row) => {
    const entityUuid = row[entityUuidField]
    const extraPublished = row.extraPublished ?? {}
    const extraDraft = row.extraDraft ?? {}
    const changedPropNames = changedPropNamesByEntityUuid.get(entityUuid) ?? new Set()
    const allNames = new Set([...Object.keys(extraPublished), ...Object.keys(extraDraft)])
    allNames.forEach((name) => {
      if (JSON.stringify(extraPublished[name]) !== JSON.stringify(extraDraft[name])) {
        changedPropNames.add(name)
      }
    })
    if (changedPropNames.size > 0) {
      changedPropNamesByEntityUuid.set(entityUuid, changedPropNames)
    }
  })
  return changedPropNamesByEntityUuid
}

const _unionPropNames = (setA, setB) => new Set([...(setA ?? []), ...(setB ?? [])])

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
  { surveyId, survey },
  client = db
) => {
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

  const changedCategories = [] // { name, changedPropNames }
  Survey.getCategoriesArray(survey).forEach((categoryDraft) => {
    const categoryUuid = Category.getUuid(categoryDraft)
    const categoryPublished = categoriesPublishedByUuid[categoryUuid]
    const schemaChangedPropNames = categoryPublished
      ? _diffExtraPropDefNames(Category.getItemExtraDef(categoryDraft), Category.getItemExtraDef(categoryPublished))
      : new Set()
    const changedPropNames = _unionPropNames(
      schemaChangedPropNames,
      categoryValueChangedPropNamesByUuid.get(categoryUuid)
    )
    if (changedPropNames.size > 0) {
      changedCategories.push({ name: Category.getName(categoryDraft), changedPropNames })
    }
  })

  const changedTaxonomies = [] // { name, changedPropNames }
  Survey.getTaxonomiesArray(survey).forEach((taxonomyDraft) => {
    const taxonomyUuid = Taxonomy.getUuid(taxonomyDraft)
    const taxonomyPublished = taxonomiesPublishedByUuid[taxonomyUuid]
    const schemaChangedPropNames = taxonomyPublished
      ? _diffExtraPropDefNames(Taxonomy.getExtraPropsDefs(taxonomyDraft), Taxonomy.getExtraPropsDefs(taxonomyPublished))
      : new Set()
    const changedPropNames = _unionPropNames(
      schemaChangedPropNames,
      taxonomyValueChangedPropNamesByUuid.get(taxonomyUuid)
    )
    if (changedPropNames.size > 0) {
      changedTaxonomies.push({ name: Taxonomy.getName(taxonomyDraft), changedPropNames })
    }
  })

  const valueAffectedNodeDefUuids = new Set()
  const validationAffectedNodeDefUuids = new Set()

  if (changedCategories.length > 0 || changedTaxonomies.length > 0) {
    Survey.getNodeDefsArray(survey).forEach((nodeDef) => {
      if (!NodeDef.isPublished(nodeDef) || NodeDef.isDeleted(nodeDef)) return

      const valueMatch =
        changedCategories.some(({ name, changedPropNames }) =>
          NodeDef.referencesCategoryExtraProp({ categoryName: name, changedPropNames })(nodeDef)
        ) ||
        changedTaxonomies.some(({ name, changedPropNames }) =>
          NodeDef.referencesTaxonomyExtraProp({ taxonomyName: name, changedPropNames })(nodeDef)
        )
      if (valueMatch) {
        valueAffectedNodeDefUuids.add(NodeDef.getUuid(nodeDef))
        return
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
    })
  }

  return { valueAffectedNodeDefUuids, validationAffectedNodeDefUuids }
}
