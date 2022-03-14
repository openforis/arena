import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as RecordReader from '@core/record/_record/recordReader'
import * as Node from '@core/record/node'

import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Taxon from '@core/survey/taxon'
import * as SurveyNodeDefs from './surveyNodeDefs'

/*
 * CategoryItemUuidIndex : {
 *    [$categoryUuid] : {
 *      [$parentCategoryItemUuid] :{
 *        [$categoryItemCode] : $categoryItemUuid
 *      }
 *    }
 * }
 *
 * categoryItemIndex : {
 *    [$categoryItemUuid] : { ...$categoryItem }
 * }
 *
 * taxonUuidIndex : {
 *   [$taxonomyUuid] : {
 *     [$taxonCode] : {
 *       uuid : $taxonUuid,
 *       vernacularNames: {
 *        [$vernacularName] : $vernacularNameUuid,
 *       ...
 *       }
 *     }
 *   }
 * }
 *
 *  taxonIndex : {
 *    [$taxonUuid] : { ...$taxon }
 * }
 *
 */

const keys = {
  // Root path key
  indexRefData: '_indexRefData',
  // Ref data indexes
  categoryItemUuidIndex: 'categoryItemUuidIndex', // items by category uuid, parent item uuid and item code
  categoryItemIndex: 'categoryItemIndex', // items by item uuid
  taxonUuidIndex: 'taxonUuidIndex',
  taxonIndex: 'taxonIndex',
}

const categoryItemNullParentUuid = 'null'

// ====== READ

// ==== category index

export const getCategoryItemByUuid = (categoryItemUuid) =>
  R.pathOr(null, [keys.indexRefData, keys.categoryItemIndex, categoryItemUuid])

const getCategoryItemUuid = ({ categoryUuid, parentItemUuid, code }) =>
  R.path([keys.indexRefData, keys.categoryItemUuidIndex, categoryUuid, parentItemUuid, code])

export const getCategoryItemUuidAndCodeHierarchy =
  ({ nodeDef, code, record = null, parentNode = null }) =>
  (survey) => {
    const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
    const levelIndex = SurveyNodeDefs.getNodeDefCategoryLevelIndex(nodeDef)(survey)
    let parentItemUuid = categoryItemNullParentUuid
    let hierarchyCode = []

    if (levelIndex > 0) {
      const parentCodeAttribute = RecordReader.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
      parentItemUuid = Node.getCategoryItemUuid(parentCodeAttribute)
      hierarchyCode = R.append(parentItemUuid, Node.getHierarchyCode(parentCodeAttribute))
    }

    const itemUuid = getCategoryItemUuid({ categoryUuid, parentItemUuid, code })(survey)

    return {
      itemUuid,
      hierarchyCode,
    }
  }

export const getCategoryItemByHierarchicalCodes =
  ({ categoryUuid, codesPath }) =>
  (survey) => {
    const itemUuid = codesPath.reduce(
      (currentParentUuid, code) =>
        getCategoryItemUuid({ categoryUuid, parentItemUuid: currentParentUuid, code })(survey),
      categoryItemNullParentUuid
    )
    return getCategoryItemByUuid(itemUuid)(survey)
  }

// ==== taxonomy index

export const getTaxonByUuid = (taxonUuid) => R.path([keys.indexRefData, keys.taxonIndex, taxonUuid])

export const getTaxonByCode =
  ({ taxonomyUuid, taxonCode }) =>
  (survey) => {
    const taxonUuid = R.path([keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode])(survey)
    return taxonUuid ? getTaxonByUuid(taxonUuid)(survey) : null
  }

export const getTaxonUuid = (nodeDef, taxonCode) => (survey) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxon = getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
  return Taxon.getUuid(taxon)
}

export const getTaxonVernacularNameUuid = (nodeDef, taxonCode, vernacularName) => (survey) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxon = getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
  const vernacularNamesUuidByName = Taxon.getVernacularNames(taxon)
  return vernacularNamesUuidByName[vernacularName]
}

export const includesTaxonVernacularName = (nodeDef, taxonCode, vernacularNameUuid) => (survey) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxon = getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
  const vernacularNamesUuidByName = Taxon.getVernacularNames(taxon)
  return Object.values(vernacularNamesUuidByName).includes(vernacularNameUuid)
}

// ====== UPDATE

const _getCategoryIndex = R.reduce((accIndex, row) => {
  ObjectUtils.setInPath(
    [
      keys.categoryItemUuidIndex,
      CategoryLevel.getCategoryUuid(row),
      CategoryItem.getParentUuid(row) || categoryItemNullParentUuid,
      CategoryItem.getCode(row),
    ],
    CategoryItem.getUuid(row)
  )(accIndex)

  ObjectUtils.setInPath([keys.categoryItemIndex, CategoryItem.getUuid(row)], row)(accIndex)

  return accIndex
}, {})

const _getTaxonomyIndex = R.reduce((accIndex, row) => {
  const taxonomyUuid = Taxon.getTaxonomyUuid(row)
  const taxonUuid = Taxon.getUuid(row)
  const taxonCode = Taxon.getCode(row)

  ObjectUtils.setInPath([keys.taxonUuidIndex, taxonomyUuid, taxonCode], taxonUuid)(accIndex)

  const vernacularNamesMerged = R.pipe(R.prop(Taxon.keys.vernacularNames), R.mergeAll)(row)
  const taxonUpdated = { ...row, [Taxon.keys.vernacularNames]: vernacularNamesMerged }
  ObjectUtils.setInPath([keys.taxonIndex, taxonUuid], taxonUpdated)(accIndex)

  return accIndex
}, {})

export const assocRefData =
  ({ categoryItemsRefData = [], taxaIndexRefData = [] }) =>
  (survey) => {
    const refDataIndex = {
      ..._getCategoryIndex(categoryItemsRefData),
      ..._getTaxonomyIndex(taxaIndexRefData),
    }
    return {
      ...survey,
      [keys.indexRefData]: refDataIndex,
    }
  }
