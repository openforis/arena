import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as ObjectUtils from '@core/objectUtils'
import { CategoryItemsByCategoryUuid } from '@core/survey/surveyCompare'

import FileZip from '@server/utils/file/fileZip'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryService from '@server/modules/category/service/categoryService'
import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

const hasDraftProps = (obj: any): boolean => Boolean(obj?.propsDraft || obj?.propsAdvancedDraft)

// a backup export keeps published and draft props separated: combine them, draft props win
const combineProps = (obj: any): any => {
  if (!hasDraftProps(obj)) return obj
  const result = {
    ...obj,
    props: ObjectUtils.getPropsAndPropsDraftCombined(obj),
    propsAdvanced: { ...obj.propsAdvanced, ...obj.propsAdvancedDraft },
  }
  delete result.propsDraft
  delete result.propsAdvancedDraft
  return result
}

const combinePropsInObjects = (objsByUuid: Record<string, any> = {}): Record<string, any> =>
  Object.fromEntries(Object.entries(objsByUuid).map(([uuid, obj]) => [uuid, combineProps(obj)]))

const combineCategoryProps = (category: any) => {
  const categoryCombined = combineProps(category)
  const levels = Category.getLevelsArray(categoryCombined).map(combineProps)
  return Category.assocLevelsArray(levels)(categoryCombined)
}

const readCategoryItems = async ({ zipFile, categoryUuid }): Promise<any[]> => {
  const items = await ArenaSurveyFileZip.getCategoryItems(zipFile, categoryUuid)
  if (items.length > 0) return items
  const partsCount = ArenaSurveyFileZip.getCategoryItemsPartsCount({ zipFile, categoryUuid })
  const result = []
  for (let index = 0; index < partsCount; index++) {
    const partItems = await ArenaSurveyFileZip.getCategoryItemsPart({ zipFile, categoryUuid, index }) // NOSONAR
    result.push(...partItems)
  }
  return result
}

/**
 * Reads the survey (node defs, categories, taxonomies) and the category items from an Arena survey export file.
 * @param {object} params - The parameters.
 * @param {string} params.filePath - Path of the exported survey (zip) file.
 * @returns {Promise<{survey: any, itemsByCategoryUuid: CategoryItemsByCategoryUuid}>} - The survey and the items.
 */
export const readSurveyFromFile = async ({
  filePath,
}: {
  filePath: string
}): Promise<{ survey: any; itemsByCategoryUuid: CategoryItemsByCategoryUuid }> => {
  const zipFile = new FileZip(filePath)
  await zipFile.init()
  try {
    const arenaSurvey = await ArenaSurveyFileZip.getSurvey(zipFile)
    if (!arenaSurvey) {
      throw new Error('Invalid survey file: survey definition not found')
    }
    const categoriesInZip = await ArenaSurveyFileZip.getCategories(zipFile)
    const categoriesByUuid = Object.fromEntries(
      Object.values({ ...arenaSurvey.categories, ...categoriesInZip }).map((category: any) => [
        Category.getUuid(category),
        combineCategoryProps(category),
      ])
    )
    const taxonomies = combinePropsInObjects(arenaSurvey.taxonomies)
    const nodeDefs = Object.values(combinePropsInObjects(arenaSurvey.nodeDefs)).filter(
      (nodeDef) => !NodeDef.isDeleted(nodeDef)
    )
    // node defs, categories and taxonomies are replaced below
    let survey = { ...arenaSurvey, info: combineProps(Survey.getSurveyInfo(arenaSurvey)) }
    survey = Survey.assocCategories(categoriesByUuid)(survey)
    survey = Survey.assocTaxonomies(taxonomies)(survey)
    survey = Survey.assocNodeDefsSimple({ nodeDefs: ObjectUtils.toUuidIndexedObj(nodeDefs) })(survey)
    survey = await Survey.buildAndAssocDependencyGraph(survey)

    const itemsByCategoryUuid: CategoryItemsByCategoryUuid = {}
    for (const categoryUuid of Object.keys(categoriesByUuid)) {
      const items = await readCategoryItems({ zipFile, categoryUuid }) // NOSONAR
      itemsByCategoryUuid[categoryUuid] = items.map(combineProps)
    }
    return { survey, itemsByCategoryUuid }
  } finally {
    zipFile.close()
  }
}

/**
 * Fetches the survey (draft) to update and the items of its categories.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {any} [client] - Database client.
 * @returns {Promise<{survey: any, itemsByCategoryUuid: CategoryItemsByCategoryUuid, usedNodeDefUuids: string[]}>} - The survey, the items and all the node def uuids (deleted ones included).
 */
export const fetchTargetSurvey = async ({ surveyId }: { surveyId: number }, client: any = db) => {
  const surveyWithDeleted = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, draft: true, advanced: true, includeDeleted: true },
    client
  )
  const usedNodeDefUuids = Object.keys(Survey.getNodeDefs(surveyWithDeleted))
  const nodeDefs = Survey.getNodeDefsArray(surveyWithDeleted).filter((nodeDef) => !NodeDef.isDeleted(nodeDef))
  const survey = await Survey.buildAndAssocDependencyGraph(
    Survey.assocNodeDefsSimple({ nodeDefs: ObjectUtils.toUuidIndexedObj(nodeDefs) })(surveyWithDeleted)
  )
  const categoryUuids = Survey.getCategoriesArray(survey).map(Category.getUuid)
  const itemsArrays = await DbUtils.runQueries(
    client,
    categoryUuids.map(
      (categoryUuid) => () => CategoryService.fetchItemsByCategoryUuid({ surveyId, categoryUuid, draft: true }, client)
    )
  )
  const itemsByCategoryUuid: CategoryItemsByCategoryUuid = Object.fromEntries(
    categoryUuids.map((categoryUuid, index) => [categoryUuid, itemsArrays[index]])
  )
  return { survey, itemsByCategoryUuid, usedNodeDefUuids }
}
