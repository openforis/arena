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
  categoryItemUuidIndex: 'categoryItemUuidIndex',
  categoryItemIndex: 'categoryItemIndex',
  taxonUuidIndex: 'taxonUuidIndex',
  taxonIndex: 'taxonIndex',
}

const categoryItemNullParentUuid = 'null'

// ====== READ

// ==== category index
const getCategoryItemUuid = ({ categoryUuid, parentItemUuid, code }) =>
  R.path([keys.indexRefData, keys.categoryItemUuidIndex, categoryUuid, parentItemUuid, code])

export const getCategoryItemUuidAndCodeHierarchy = (nodeDef, record, parentNode, code) => (survey) => {
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

export const getCategoryItemByUuid = (categoryItemUuid) =>
  R.pathOr(null, [keys.indexRefData, keys.categoryItemIndex, categoryItemUuid])

export const getCategoryItemByHierarchicalCodes = ({ categoryUuid, hiearachicalCodes }) => (survey) => {
  const itemUuid = hiearachicalCodes.reduce(
    (currentParentUuid, code) => getCategoryItemUuid({ categoryUuid, parentItemUuid: currentParentUuid, code })(survey),
    categoryItemNullParentUuid
  )
  return getCategoryItemByUuid(itemUuid)(survey)
}

// ==== taxonomy index

export const getTaxonUuid = (nodeDef, taxonCode) => (survey) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path([keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.keys.uuid], survey)
}

export const getTaxonVernacularNameUuid = (nodeDef, taxonCode, vernacularName) => (survey) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path(
    [keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.keys.vernacularNames, vernacularName],
    survey
  )
}

export const includesTaxonVernacularName = (nodeDef, taxonCode, vernacularNameUuid) => (survey) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.pipe(
    R.path([keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.keys.vernacularNames]),
    R.values,
    R.includes(vernacularNameUuid)
  )(survey)
}

export const getTaxonByUuid = (taxonUuid) => R.path([keys.indexRefData, keys.taxonIndex, taxonUuid])

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
  ObjectUtils.setInPath([keys.taxonUuidIndex, Taxon.getTaxonomyUuid(row), Taxon.getCode(row)], {
    [Taxon.keys.uuid]: Taxon.getUuid(row),
    [Taxon.keys.vernacularNames]: R.pipe(R.prop(Taxon.keys.vernacularNames), R.mergeAll)(row),
  })(accIndex)

  ObjectUtils.setInPath([keys.taxonIndex, Taxon.getUuid(row)], row)(accIndex)

  return accIndex
}, {})

export const assocRefData = (categoryItemsRefData, taxaIndexRefData) => (survey) => {
  const refDataIndex = {
    ..._getCategoryIndex(categoryItemsRefData),
    ..._getTaxonomyIndex(taxaIndexRefData),
  }

  return {
    ...survey,
    [keys.indexRefData]: refDataIndex,
  }
}
