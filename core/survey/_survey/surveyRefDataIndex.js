import * as NodeDef from '@core/survey/nodeDef'
import * as RecordReader from '@core/record/_record/recordReader'
import * as Node from '@core/record/node'

import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import * as SurveyNodeDefs from './surveyNodeDefs'
import { Objects, SurveyRefDataFactory, Surveys } from '@openforis/arena-core'

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
  refData: 'refData',
  // Ref data indexes
  categoryItemUuidIndex: 'categoryItemUuidIndex', // items by category uuid, parent item uuid and item code
  categoryItemIndex: 'categoryItemIndex', // items by item uuid
  taxonUuidIndex: 'taxonUuidIndex',
  taxonIndex: 'taxonIndex',
}

const categoryItemNullParentUuid = 'null'

// ====== READ

// ==== category index

export const getCategoryItemByUuid = (itemUuid) => (survey) => Surveys.getCategoryItemByUuid({ survey, itemUuid })

const getCategoryItemUuid =
  ({ categoryUuid, parentItemUuid, code }) =>
  (survey) =>
    Surveys.getCategoryItemUuidByCode({ survey, categoryUuid, parentItemUuid, code })

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
      hierarchyCode = [...Node.getHierarchyCode(parentCodeAttribute), parentItemUuid]
    }

    const itemUuid = getCategoryItemUuid({ categoryUuid, parentItemUuid, code })(survey)

    return {
      itemUuid,
      hierarchyCode,
    }
  }

export const getCategoryItemByHierarchicalCodes =
  ({ categoryUuid, codesPath }) =>
  (survey) =>
    Surveys.getCategoryItemByCodePaths({ survey, categoryUuid, codePaths: codesPath })

export const getCategoryItemsInLevel =
  ({ categoryUuid, levelIndex = 0 }) =>
  (survey) => {
    const rootItems = Surveys.getCategoryItems({ survey, categoryUuid })
    if (levelIndex === 0) return rootItems

    let itemsPrevLevel = [...rootItems]
    let currentLevelIndex = 1
    while (currentLevelIndex <= levelIndex) {
      const itemsInLevel = []
      itemsPrevLevel.forEach((item) => {
        const parentItemUuid = CategoryItem.getUuid(item)
        itemsInLevel.push(...Surveys.getCategoryItems({ survey, categoryUuid, parentItemUuid }))
      })
      currentLevelIndex += 1
      itemsPrevLevel = itemsInLevel
    }
    return itemsPrevLevel
  }

// ==== taxonomy index

export const getTaxonByUuid = (taxonUuid) => (survey) => Surveys.getTaxonByUuid({ survey, taxonUuid })

export const getTaxonByCode =
  ({ taxonomyUuid, taxonCode }) =>
  (survey) =>
    Surveys.getTaxonByCode({ survey, taxonomyUuid, taxonCode })

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

export const includesTaxonVernacularName = (nodeDef, taxonCode, vernacularNameUuid) => (survey) =>
  Surveys.includesTaxonVernacularName({ survey, nodeDef, taxonCode, vernacularNameUuid })

// ====== UPDATE

export const assocRefData =
  ({ categoryItemsRefData = [], taxaIndexRefData = [] }) =>
  (survey) => {
    const itemsByCategoryUuid = {}
    categoryItemsRefData.forEach((categoryItemRefData) => {
      const categoryUuid = CategoryLevel.getCategoryUuid(categoryItemRefData)
      const itemsInCategory = itemsByCategoryUuid[categoryUuid] || []
      itemsInCategory.push(categoryItemRefData)
      itemsByCategoryUuid[categoryUuid] = itemsInCategory
    })

    const taxonIndex = {}
    const taxonUuidIndex = {}
    taxaIndexRefData.forEach((item) => {
      // item.vernacularNames = _groupVernacularNamesByLang(item.vernacularNames)
      const uuid = Taxon.getUuid(item)
      taxonIndex[uuid] = item
      Objects.setInPath({ obj: taxonUuidIndex, path: [Taxon.getTaxonomyUuid(item), Taxon.getCode(item)], value: uuid })
    })

    const refData = SurveyRefDataFactory.createInstance({ itemsByCategoryUuid, taxonIndex, taxonUuidIndex })

    return {
      ...survey,
      [keys.refData]: refData,
    }
  }
