import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as ObjectUtils from '@core/objectUtils'
import { CategoryItemsByCategoryUuid, TaxaByTaxonomyUuid } from '@core/survey/surveyCompare'

import FileZip from '@server/utils/file/fileZip'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
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

const readTaxa = async ({ zipFile, taxonomyUuid }): Promise<any[]> => {
  const taxa = await ArenaSurveyFileZip.getTaxa(zipFile, taxonomyUuid)
  if (taxa.length > 0) return taxa
  const partsCount = ArenaSurveyFileZip.getTaxaPartsCount({ zipFile, taxonomyUuid })
  const result = []
  for (let index = 0; index < partsCount; index++) {
    const partTaxa = await ArenaSurveyFileZip.getTaxaPart({ zipFile, taxonomyUuid, index }) // NOSONAR
    result.push(...partTaxa)
  }
  return result
}

const combineTaxonProps = (taxon: any) => {
  const vernacularNames = Object.fromEntries(
    Object.entries(Taxon.getVernacularNames(taxon) as Record<string, any[]>).map(([lang, names]) => [
      lang,
      names.map(combineProps),
    ])
  )
  return Taxon.assocVernacularNamesByLang(vernacularNames)(combineProps(taxon))
}

const readTaxaByTaxonomyUuid = async ({ zipFile, taxonomyUuids }): Promise<TaxaByTaxonomyUuid> => {
  const result: TaxaByTaxonomyUuid = {}
  for (const taxonomyUuid of taxonomyUuids) {
    const taxa = await readTaxa({ zipFile, taxonomyUuid }) // NOSONAR
    result[taxonomyUuid] = taxa.map(combineTaxonProps)
  }
  return result
}

export interface SurveyCompareSourceSurvey {
  survey: any
  itemsByCategoryUuid: CategoryItemsByCategoryUuid
  taxaByTaxonomyUuid: TaxaByTaxonomyUuid
}

/**
 * Reads the survey (node defs, categories, taxonomies), the category items and the taxa from an Arena survey export
 * file.
 * @param {object} params - The parameters.
 * @param {string} params.filePath - Path of the exported survey (zip) file.
 * @returns {Promise<SurveyCompareSourceSurvey>} - The survey, the items and the taxa.
 */
export const readSurveyFromFile = async ({ filePath }: { filePath: string }): Promise<SurveyCompareSourceSurvey> => {
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
    const taxaByTaxonomyUuid = await readTaxaByTaxonomyUuid({ zipFile, taxonomyUuids: Object.keys(taxonomies) })
    return { survey, itemsByCategoryUuid, taxaByTaxonomyUuid }
  } finally {
    zipFile.close()
  }
}

// vernacular names are fetched with draft props: their published flag is fetched separately
const fetchTaxa = async ({ surveyId, taxonomyUuid }, client: any) => {
  const taxa = await TaxonomyRepository.fetchTaxaWithVernacularNames({ surveyId, taxonomyUuid, draft: true }, client)
  const publishedVernacularNameUuids = new Set(
    await TaxonomyRepository.fetchPublishedVernacularNameUuids({ surveyId, taxonomyUuid }, client)
  )
  return taxa.map((taxon: any) =>
    Taxon.assocVernacularNamesByLang(
      Object.fromEntries(
        Object.entries(Taxon.getVernacularNames(taxon) as Record<string, any[]>).map(([lang, names]) => [
          lang,
          names.map((name) => ({
            ...name,
            published: publishedVernacularNameUuids.has(TaxonVernacularName.getUuid(name)),
          })),
        ])
      )
    )(taxon)
  )
}

/**
 * Fetches a survey (draft) with the items of its categories and its taxa.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {any} [client] - Database client.
 * @returns {Promise<{survey: any, itemsByCategoryUuid: CategoryItemsByCategoryUuid, taxaByTaxonomyUuid: TaxaByTaxonomyUuid, usedNodeDefUuids: string[]}>} - The survey, the items, the taxa and all the node def uuids (deleted ones included).
 */
export const fetchSurveyFromDb = async ({ surveyId }: { surveyId: number }, client: any = db) => {
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
  const taxonomyUuids = Survey.getTaxonomiesArray(survey).map((taxonomy: any) => taxonomy.uuid)
  const taxaArrays = await DbUtils.runQueries(
    client,
    taxonomyUuids.map((taxonomyUuid) => () => fetchTaxa({ surveyId, taxonomyUuid }, client))
  )
  const taxaByTaxonomyUuid: TaxaByTaxonomyUuid = Object.fromEntries(
    taxonomyUuids.map((taxonomyUuid, index) => [taxonomyUuid, taxaArrays[index]])
  )
  return { survey, itemsByCategoryUuid, taxaByTaxonomyUuid, usedNodeDefUuids }
}
