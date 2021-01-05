import * as Response from '@server/utils/response'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as RecordService from '@server/modules/record/service/recordService'
import * as AnalysisService from '@server/modules/analysis/service'

import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '../manager/surveyManager'

import SurveyPublishJob from './publish/surveyPublishJob'

// JOBS
export const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const exportSurvey = async ({ surveyId, res }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId)

  const base = '/tmp/export'
  const prefix = `survey_${surveyId}`
  const pathPrefix = FileUtils.join(base, prefix)
  await FileUtils.rmdir(pathPrefix)
  await FileUtils.mkdir(pathPrefix)

  // Survey
  const name = `survey.json`
  const filePath = FileUtils.join(base, prefix, name)
  await FileUtils.writeFile(filePath, JSON.stringify(survey, null, 2))

  // Categories
  const categoriesPathDir = FileUtils.join(pathPrefix, 'categories')
  await FileUtils.mkdir(categoriesPathDir)
  const categoriesPathFile = FileUtils.join(categoriesPathDir, 'categories.json')

  const categories = await CategoryService.fetchCategoriesAndLevelsBySurveyId({ surveyId })
  const categoriesUuids = Object.keys(categories || {})
  await FileUtils.writeFile(categoriesPathFile, JSON.stringify(categories, null, 2))

  await Promise.all(
    categoriesUuids.map(async (categoryUuid) => {
      const itemsData = await CategoryService.fetchItemsByCategoryUuid(surveyId, categoryUuid)
      await FileUtils.writeFile(
        FileUtils.join(categoriesPathDir, `${categoryUuid.uuid}.json`),
        JSON.stringify(itemsData, null, 2)
      )
    })
  )

  // Taxonomy
  const taxonomiesPathDir = FileUtils.join(pathPrefix, 'taxonomies')
  await FileUtils.mkdir(taxonomiesPathDir)
  const taxonomiesPathFile = FileUtils.join(taxonomiesPathDir, 'taxonomies.json')

  const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId })
  await FileUtils.writeFile(taxonomiesPathFile, JSON.stringify(taxonomies, null, 2))

  await Promise.all(
    taxonomies.map(async (taxonomy) => {
      const taxaData = await TaxonomyService.fetchTaxaWithVernacularNames(surveyId, taxonomy.uuid)
      await FileUtils.writeFile(
        FileUtils.join(taxonomiesPathDir, `${taxonomy.uuid}.json`),
        JSON.stringify(taxaData, null, 2)
      )
    })
  )

  // Records
  const recordsPathDir = FileUtils.join(pathPrefix, 'records')
  await FileUtils.mkdir(recordsPathDir)
  const recordsPathFile = FileUtils.join(recordsPathDir, 'records.json')

  const records = await RecordService.fetchRecordsUuidAndCycle(surveyId)
  await FileUtils.writeFile(recordsPathFile, JSON.stringify(records, null, 2))

  await Promise.all(
    records.map(async (record) => {
      const recordData = await RecordService.fetchRecordByUuid(surveyId, record.uuid)
      await FileUtils.writeFile(
        FileUtils.join(recordsPathDir, `${record.uuid}.json`),
        JSON.stringify(recordData, null, 2)
      )
    })
  )

  // Chain
  const chainsPathDir = FileUtils.join(pathPrefix, 'chains')
  await FileUtils.mkdir(chainsPathDir)
  const chainsPathFile = FileUtils.join(chainsPathDir, 'chains.json')

  const chains = await AnalysisService.fetchChains({ surveyId })
  await FileUtils.writeFile(chainsPathFile, JSON.stringify(chains, null, 2))

  await Promise.all(
    chains.map(async (chain) => {
      const chaindata = await AnalysisService.fetchChain({ surveyId, chainUuid: chain.uuid })
      await FileUtils.writeFile(FileUtils.join(chainsPathDir, `${chain.uuid}.json`), JSON.stringify(chaindata, null, 2))
    })
  )

  await Response.sendZipFile(res, pathPrefix, `${prefix}.zip`)
}

export const {
  // CREATE
  insertSurvey,
  // READ
  fetchUserSurveysInfo,
  countUserSurveys,
  fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId,
  // UPDATE
  updateSurveyProps,
  // DELETE
  deleteSurvey,
  // UTILS
  validateNewSurvey,
} = SurveyManager
