import * as R from 'ramda';
import ObjectUtils from '../../objectUtils';
import SurveyNodeDefs from './surveyNodeDefs';
import NodeDef from '../../survey/nodeDef';
import RecordReader from '../../record/_record/recordReader';
import Node from '../../record/node';
import CategoryItem, { ICategoryItem } from '../../survey/categoryItem';
import CategoryLevel from '../../survey/categoryLevel';
import Taxon from '../../survey/taxon';

/**
 * categoryItemUuidIndex : {
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
  // root path key
  indexRefData: '_indexRefData',
  // ref data indexes
  categoryItemUuidIndex: 'categoryItemUuidIndex',
  categoryItemIndex: 'categoryItemIndex',
  taxonUuidIndex: 'taxonUuidIndex',
  taxonIndex: 'taxonIndex'
}

// ====== READ

// ==== category index
const getCategoryItemUuidAndCodeHierarchy = (survey, nodeDef, record, parentNode, code) => survey => {
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const levelIndex = SurveyNodeDefs.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  let parentCategoryItemUuid = 'null'
  let hierarchyCode = []

  if (levelIndex > 0) {
    const parentCodeAttribute = RecordReader.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    parentCategoryItemUuid = Node.getCategoryItemUuid(parentCodeAttribute)
    hierarchyCode = R.append(Node.getCategoryItemUuid(parentCodeAttribute), Node.getHierarchyCode(parentCodeAttribute))
  }

  const itemUuid = R.path(
    [keys.indexRefData, keys.categoryItemUuidIndex, categoryUuid, parentCategoryItemUuid, code],
    survey
  )
  return {
    itemUuid,
    hierarchyCode
  }
}

const getCategoryItemByUuid = categoryItemUuid => R.pathOr(null, [keys.indexRefData, keys.categoryItemIndex, categoryItemUuid])

// ==== taxonomy index

const getTaxonUuid = (nodeDef, taxonCode) => survey => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path(
    [keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.keys.uuid],
    survey
  )
}

const getTaxonVernacularNameUuid = (nodeDef, taxonCode, vernacularName) => survey => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path(
    [keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.keys.vernacularNames, vernacularName],
    survey
  )
}

const includesTaxonVernacularName = (nodeDef, taxonCode, vernacularNameUuid) => survey => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.pipe(
    R.path(
      [keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.keys.vernacularNames]
    ),
    R.values,
    R.includes(vernacularNameUuid)
  )(survey)
}

const getTaxonByUuid = taxonUuid => R.path([keys.indexRefData, keys.taxonIndex, taxonUuid])

// ====== UPDATE

const assocRefData = (categoryItemsRefData, taxaIndexRefData) => survey => {
  const refDataIndex = {
    ..._getCategoryIndex(categoryItemsRefData),
    ..._getTaxonomyIndex(taxaIndexRefData),
  }

  return {
    ...survey,
    [keys.indexRefData]: refDataIndex
  }
}

const _getCategoryIndex = R.reduce(
  (accIndex, row: ICategoryItem) => {
    ObjectUtils.setInPath(
      [
        keys.categoryItemUuidIndex,
        CategoryLevel.getCategoryUuid(row),
        CategoryItem.getParentUuid(row) || 'null',
        CategoryItem.getCode(row)
      ],
      CategoryItem.getUuid(row)
    )(accIndex)

    ObjectUtils.setInPath([keys.categoryItemIndex, CategoryItem.getUuid(row)], row)(accIndex)

    return accIndex
  },
  {}
)

const _getTaxonomyIndex = R.reduce(
  (accIndex, row: any) => {
    ObjectUtils.setInPath(
      [
        keys.taxonUuidIndex,
        Taxon.getTaxonomyUuid(row),
        Taxon.getCode(row)
      ],
      {
        [Taxon.keys.uuid]: Taxon.getUuid(row),
        [Taxon.keys.vernacularNames]: R.pipe(
          R.prop(Taxon.keys.vernacularNames) as (x: any) => any[],
          R.mergeAll
        )(row),
      }
    )(accIndex)

    ObjectUtils.setInPath([keys.taxonIndex, Taxon.getUuid(row)], row)(accIndex)

    return accIndex
  },
  {}
)

export default {
  // ==== category index
  getCategoryItemUuidAndCodeHierarchy,
  getCategoryItemByUuid,

  // ==== taxonomy index
  getTaxonUuid,
  getTaxonVernacularNameUuid,
  getTaxonByUuid,
  includesTaxonVernacularName,

  assocRefData,
};
