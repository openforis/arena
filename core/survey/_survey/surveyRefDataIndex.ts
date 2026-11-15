import { Objects, SurveyRefDataFactory, Surveys } from '@openforis/arena-core'
import type {
  ArenaRecord,
  CategoryItem as ArenaCategoryItem,
  Node as ArenaNode,
  NodeDef as ArenaNodeDef,
  NodeDefTaxon,
  NodeDefType,
  Survey as ArenaSurvey,
  Taxon as ArenaTaxon,
} from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as RecordReader from '@core/record/_record/recordReader'
import * as Node from '@core/record/node'

import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import * as SurveyNodeDefs from './surveyNodeDefs'

type AnyNodeDef = ArenaNodeDef<NodeDefType>
type SurveyUpdater = (survey: ArenaSurvey) => ArenaSurvey

// survey.refData is an arena-core SurveyRefData: category items by category uuid, taxa by uuid and by taxonomy uuid and code
const keys = {
  refData: 'refData',
} as const

const categoryItemNullParentUuid = 'null'

// ====== READ

// ==== category index

export const getCategoryItemByUuid =
  (itemUuid: string) =>
  (survey: ArenaSurvey): ArenaCategoryItem | undefined =>
    Surveys.getCategoryItemByUuid({ survey, itemUuid })

const getCategoryItemUuid =
  ({ categoryUuid, parentItemUuid, code }: { categoryUuid: string; parentItemUuid: string; code: string }) =>
  (survey: ArenaSurvey): string | undefined =>
    Surveys.getCategoryItemUuidByCode({ survey, categoryUuid, parentItemUuid, code })

export const getCategoryItemUuidAndCodeHierarchy =
  ({
    nodeDef,
    code,
    record = null,
    parentNode = null,
  }: {
    nodeDef: AnyNodeDef
    code: string
    record?: ArenaRecord | null
    parentNode?: ArenaNode | null
  }) =>
  (survey: ArenaSurvey): { itemUuid: string | undefined; hierarchyCode: string[] } => {
    const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
    const levelIndex = SurveyNodeDefs.getNodeDefCategoryLevelIndex(nodeDef)(survey)
    let parentItemUuid = categoryItemNullParentUuid
    let hierarchyCode: string[] = []

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
  ({ categoryUuid, codesPath }: { categoryUuid: string; codesPath: string[] }) =>
  (survey: ArenaSurvey): ArenaCategoryItem | undefined =>
    Surveys.getCategoryItemByCodePaths({ survey, categoryUuid, codePaths: codesPath })

export const getCategoryItemsInLevel =
  ({ categoryUuid, levelIndex = 0 }: { categoryUuid: string; levelIndex?: number }) =>
  (survey: ArenaSurvey): ArenaCategoryItem[] => {
    const rootItems = Surveys.getCategoryItems({ survey, categoryUuid, parentItemUuid: null })
    if (levelIndex === 0) return rootItems

    let itemsPrevLevel = [...rootItems]
    let currentLevelIndex = 1
    while (currentLevelIndex <= levelIndex) {
      const itemsInLevel: ArenaCategoryItem[] = []
      for (const item of itemsPrevLevel) {
        const parentItemUuid = CategoryItem.getUuid(item)
        itemsInLevel.push(...Surveys.getCategoryItems({ survey, categoryUuid, parentItemUuid }))
      }
      currentLevelIndex += 1
      itemsPrevLevel = itemsInLevel
    }
    return itemsPrevLevel
  }

// ==== taxonomy index

export const getTaxonByUuid =
  (taxonUuid: string) =>
  (survey: ArenaSurvey): ArenaTaxon | undefined =>
    Surveys.getTaxonByUuid({ survey, taxonUuid })

export const getTaxonByCode =
  ({ taxonomyUuid, taxonCode }: { taxonomyUuid: string; taxonCode: string }) =>
  (survey: ArenaSurvey): ArenaTaxon | undefined =>
    Surveys.getTaxonByCode({ survey, taxonomyUuid, taxonCode })

export const getTaxonUuid =
  (nodeDef: AnyNodeDef, taxonCode: string) =>
  (survey: ArenaSurvey): string => {
    const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
    const taxon = getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
    return Taxon.getUuid(taxon)
  }

export const getTaxonVernacularNameUuid =
  ({ nodeDef, taxonCode, vernacularName }: { nodeDef: AnyNodeDef; taxonCode: string; vernacularName: string }) =>
  (survey: ArenaSurvey): string | undefined => {
    const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
    const taxon = getTaxonByCode({ taxonomyUuid, taxonCode })(survey)
    const vernacularNamesUuidByName = Taxon.getVernacularNames(taxon)
    return vernacularNamesUuidByName[vernacularName]
  }

export const includesTaxonVernacularName =
  (nodeDef: AnyNodeDef, taxonCode: string, vernacularNameUuid: string) =>
  (survey: ArenaSurvey): boolean =>
    Surveys.includesTaxonVernacularName({ survey, nodeDef: nodeDef as NodeDefTaxon, taxonCode, vernacularNameUuid })

// ====== UPDATE

const groupItemsByCategoryUuid = (categoryItemsRefData: ArenaCategoryItem[]): Record<string, ArenaCategoryItem[]> => {
  const itemsByCategoryUuid: Record<string, ArenaCategoryItem[]> = {}
  for (const categoryItemRefData of categoryItemsRefData) {
    const categoryUuid = CategoryLevel.getCategoryUuid(categoryItemRefData)
    const itemsInCategory = itemsByCategoryUuid[categoryUuid] || []
    itemsInCategory.push(categoryItemRefData)
    itemsByCategoryUuid[categoryUuid] = itemsInCategory
  }
  return itemsByCategoryUuid
}

export const assocRefData =
  ({
    categoryItemsRefData = [],
    taxaIndexRefData = [],
  }: {
    categoryItemsRefData?: ArenaCategoryItem[]
    taxaIndexRefData?: ArenaTaxon[]
  }): SurveyUpdater =>
  (survey) => {
    const itemsByCategoryUuid = groupItemsByCategoryUuid(categoryItemsRefData)

    const taxonIndex: Record<string, ArenaTaxon> = {}
    const taxonUuidIndex: Record<string, Record<string, string>> = {}
    for (const item of taxaIndexRefData) {
      const uuid = Taxon.getUuid(item)
      taxonIndex[uuid] = item
      Objects.setInPath({ obj: taxonUuidIndex, path: [Taxon.getTaxonomyUuid(item), Taxon.getCode(item)], value: uuid })
    }

    const refData = SurveyRefDataFactory.createInstance({ itemsByCategoryUuid, taxonIndex, taxonUuidIndex })

    return {
      ...survey,
      [keys.refData]: refData,
    }
  }
